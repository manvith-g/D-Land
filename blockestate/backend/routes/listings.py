"""
Listings Routes — /api/listings/*
"""

import json
from flask import Blueprint, request, jsonify
from models.listing import (
    insert_listing, get_listing_by_id, get_all_approved_listings,
    get_listings_by_seller, update_listing
)
from models.user import get_user_by_wallet
from models.land_record import get_by_id as get_land_record
from utils.validators import validate_required, is_valid_algo_address

listings_bp = Blueprint("listings", __name__, url_prefix="/api/listings")


def _enrich_listing(listing: dict) -> dict:
    """Add land_record details and parse images JSON."""
    if not listing:
        return listing
    listing = dict(listing)
    # Parse images JSON array
    try:
        listing["images"] = json.loads(listing.get("images") or "[]")
    except Exception:
        listing["images"] = []
    # Attach land record info
    if listing.get("land_record_id"):
        record = get_land_record(listing["land_record_id"])
        if record:
            listing["land_record"] = {
                "survey_number": record["survey_number"],
                "reraid":        record.get("reraid"),
                "location": {
                    "district": record["location_district"],
                    "taluk":    record["location_taluk"],
                    "village":  record["location_village"],
                },
                "area_sqft":    record["area_sqft"],
                "land_type":    record["land_type"],
                "encumbrance_status": record.get("encumbrance_status"),
                "govt_valuation_inr": record.get("govt_valuation_inr"),
            }
    return listing


@listings_bp.route("", methods=["GET"])
def get_listings():
    """GET /api/listings — all approved listings for buyer marketplace."""
    listings = get_all_approved_listings()
    return jsonify({"listings": [_enrich_listing(l) for l in listings]})


@listings_bp.route("/<listing_id>", methods=["GET"])
def get_listing(listing_id):
    listing = get_listing_by_id(listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404
    return jsonify({"listing": _enrich_listing(listing)})


@listings_bp.route("/seller/<wallet>", methods=["GET"])
def get_seller_listings(wallet):
    """GET /api/listings/seller/<wallet> — seller's own listings."""
    listings = get_listings_by_seller(wallet)
    return jsonify({"listings": [_enrich_listing(l) for l in listings]})


@listings_bp.route("", methods=["POST"])
def create_listing():
    """
    POST /api/listings — seller submits a new listing.
    Body: {
        seller_wallet, land_record_id, title, description,
        token_count, price_microalgo, price_inr,
        commission_pct, broker_address, images (JSON array), ipfs_hash
    }
    """
    data = request.json or {}
    missing = validate_required(data, ["seller_wallet", "land_record_id", "price_microalgo"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    wallet = data["seller_wallet"]

    # Enforce KYC
    user = get_user_by_wallet(wallet)
    if not user or user["kyc_status"] != "verified":
        return jsonify({"error": "KYC verification required before listing a property"}), 403

    # Ensure land record exists
    record = get_land_record(data["land_record_id"])
    if not record:
        return jsonify({"error": "Land record not found"}), 404

    images = data.get("images", [])
    if isinstance(images, list):
        images = json.dumps(images)

    listing = insert_listing({
        "land_record_id":  data["land_record_id"],
        "seller_id":       user["id"],
        "seller_wallet":   wallet,
        "title":           data.get("title", f"Property at {record['location_village']}"),
        "description":     data.get("description", ""),
        "token_count":     int(data.get("token_count", 1)),
        "price_microalgo": int(data["price_microalgo"]),
        "price_inr":       int(data.get("price_inr", 0)),
        "commission_pct":  int(data.get("commission_pct", 2)),
        "broker_address":  data.get("broker_address", ""),
        "ipfs_hash":       data.get("ipfs_hash", ""),
        "images":          images,
    })

    # AUTO-MINT PROPERTY TOKEN AND DEPLOY ESCROW
    try:
        from services.algorand_service import (
            mint_asa, deploy_escrow_contract, fund_contract,
            opt_contract_into_asset, transfer_asa_to_contract, admin_address
        )
        location = f"{record['location_village']}, {record['location_district']}"
        
        # 1. Mint ASA
        asset_id, mint_txid = mint_asa(
            location    = location,
            property_id = listing["id"][:10],
            ipfs_hash   = data.get("ipfs_hash", ""),
            seller_addr = wallet,
            token_count = int(data.get("token_count", 1)),
        )

        # 2. Deploy smart contract escrow
        broker = data.get("broker_address") or admin_address
        app_id, app_address, deploy_txid = deploy_escrow_contract(
            seller_address = wallet,
            broker_address = broker,
            asset_id       = asset_id,
            price          = int(data["price_microalgo"]),
            commission_pct = int(data.get("commission_pct", 2)),
        )

        # 3. Fund & Opt-in Contract to ASA
        fund_contract(app_address, amount_microalgo=500_000)
        opt_contract_into_asset(app_id, asset_id)
        
        # 4. Lock ASA in contract
        transfer_asa_to_contract(app_address, asset_id)

        # 5. Approve Listing instantly
        update_listing(listing["id"],
            status      = "approved",
            state       = "listed",
            asset_id    = asset_id,
            app_id      = app_id,
            app_address = app_address,
            mint_txid   = mint_txid,
            deploy_txid = deploy_txid,
        )
        listing = get_listing_by_id(listing["id"])
    except Exception as e:
        print(f"Error during auto-mint: {e}")

    return jsonify({"success": True, "listing": _enrich_listing(listing)}), 201


@listings_bp.route("/<listing_id>/cancel", methods=["POST"])
def cancel_listing(listing_id):
    listing = get_listing_by_id(listing_id)
    if not listing:
        return jsonify({"error": "Not found"}), 404

    wallet = (request.json or {}).get("seller_wallet")
    if listing["seller_wallet"] != wallet:
        return jsonify({"error": "Unauthorized"}), 403
    if listing["state"] == "sold":
        return jsonify({"error": "Cannot cancel a sold listing"}), 400

    update_listing(listing_id, status="cancelled", state="cancelled")
    return jsonify({"success": True})
