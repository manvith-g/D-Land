"""
Admin Routes — /api/admin/*
Mint ASA, deploy contract, approve/reject listings.
"""

from flask import Blueprint, request, jsonify
from models.listing import get_listing_by_id, get_all_listings, update_listing
from services.algorand_service import (
    mint_asa, deploy_escrow_contract, fund_contract,
    opt_contract_into_asset, transfer_asa_to_contract,
    admin_address
)
from utils.algorand_helpers import get_asset_current_owner, get_asset_tx_history, client

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.route("/info", methods=["GET"])
def admin_info():
    return jsonify({
        "admin_address": admin_address,
        "connected": admin_address is not None,
    })


@admin_bp.route("/listings", methods=["GET"])
def all_listings():
    return jsonify({"listings": get_all_listings()})


@admin_bp.route("/approve/<listing_id>", methods=["POST"])
def approve_listing(listing_id):
    """
    Approve a listing:
    1. Mint ASA (property token)
    2. Deploy escrow smart contract
    3. Fund contract with min ALGO
    4. Opt contract into ASA
    5. Transfer ASA into contract
    """
    listing = get_listing_by_id(listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404
    if listing["status"] == "approved":
        return jsonify({"error": "Already approved"}), 400

    from models.land_record import get_by_id as get_land_record
    land_record = get_land_record(listing.get("land_record_id") or "")
    location = ""
    if land_record:
        location = f"{land_record['location_village']}, {land_record['location_district']}"

    try:
        # 1. Mint ASA
        asset_id, mint_txid = mint_asa(
            location    = location or listing.get("title", ""),
            property_id = listing_id[:10],
            ipfs_hash   = listing.get("ipfs_hash", ""),
            seller_addr = listing["seller_wallet"],
            token_count = listing.get("token_count", 1),
        )

        # 2. Deploy contract
        broker = listing.get("broker_address") or admin_address
        app_id, app_address, deploy_txid = deploy_escrow_contract(
            seller_address = listing["seller_wallet"],
            broker_address = broker,
            asset_id       = asset_id,
            price          = listing["price_microalgo"],
            commission_pct = listing.get("commission_pct", 2),
        )

        # 3. Fund contract (so it can do inner txns)
        fund_contract(app_address, amount_microalgo=500_000)

        # 4. Opt contract into ASA
        opt_contract_into_asset(app_id, asset_id)

        # 5. Transfer ASA from admin into contract
        transfer_asa_to_contract(app_address, asset_id)

        # Update DB
        update_listing(listing_id,
            status      = "approved",
            state       = "listed",
            asset_id    = asset_id,
            app_id      = app_id,
            app_address = app_address,
            mint_txid   = mint_txid,
            deploy_txid = deploy_txid,
        )

        return jsonify({
            "success":      True,
            "asset_id":     asset_id,
            "app_id":       app_id,
            "app_address":  app_address,
            "explorer_url": f"https://lora.algokit.io/testnet/asset/{asset_id}",
            "mint_txid":    mint_txid,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/reject/<listing_id>", methods=["POST"])
def reject_listing(listing_id):
    listing = get_listing_by_id(listing_id)
    if not listing:
        return jsonify({"error": "Not found"}), 404
    update_listing(listing_id, status="rejected")
    return jsonify({"success": True})


@admin_bp.route("/verify/<search_term>", methods=["GET"])
def verify_on_chain(search_term):
    """Verify on-chain ownership by survey number or asset ID."""
    from models.listing import get_listing_by_asset_id
    from models.land_record import get_by_survey_number, get_by_reraid

    listing = None

    # Try asset_id (int)
    try:
        listing = get_listing_by_asset_id(int(search_term))
    except ValueError:
        pass

    # Try land record lookup
    if not listing:
        for finder in (get_by_survey_number, get_by_reraid):
            record = finder(search_term)
            if record:
                from models.listing import get_listings_by_seller
                from models.db import get_db, row_to_dict
                conn = get_db()
                row = conn.execute(
                    "SELECT * FROM listings WHERE land_record_id = ?", (record["id"],)
                ).fetchone()
                conn.close()
                listing = row_to_dict(row)
                break

    if not listing:
        return jsonify({"found": False, "message": "Property not found"}), 404
    if listing["status"] != "approved":
        return jsonify({"found": True, "status": listing["status"], "message": "Not yet on-chain"})

    asset_id      = listing["asset_id"]
    current_owner = get_asset_current_owner(asset_id)
    tx_history    = get_asset_tx_history(asset_id)
    is_sold       = (current_owner and
                     current_owner != listing["seller_wallet"] and
                     current_owner != admin_address)

    return jsonify({
        "found":           True,
        "listing_id":      listing["id"],
        "asset_id":        asset_id,
        "app_id":          listing["app_id"],
        "seller_wallet":   listing["seller_wallet"],
        "current_owner":   current_owner,
        "is_sold":         is_sold,
        "status":          "SOLD 🔴" if is_sold else "AVAILABLE 🟢",
        "price_algo":      listing["price_microalgo"] / 1_000_000,
        "explorer_url":    f"https://lora.algokit.io/testnet/asset/{asset_id}",
        "tx_history":      tx_history,
    })
