"""
Buy Requests Routes — /api/buy-requests/*
"""

from flask import Blueprint, request, jsonify
from models.buy_request import (
    create_buy_request, get_request_by_id,
    get_requests_by_buyer, get_requests_by_seller_wallet,
    get_requests_by_listing, update_request
)
from models.listing import get_listing_by_id, update_listing
from models.user import get_user_by_wallet
from services.settlement_service import process_settlement
from utils.validators import validate_required
from datetime import datetime

buy_requests_bp = Blueprint("buy_requests", __name__, url_prefix="/api/buy-requests")


def _enrich_request(req: dict) -> dict:
    """Attach listing and buyer display info."""
    if not req:
        return req
    req = dict(req)
    listing = get_listing_by_id(req["listing_id"])
    if listing:
        req["listing_title"] = listing.get("title", "")
        req["listing_status"] = listing.get("status")
        req["listing_state"]  = listing.get("state")
        req["asset_id"]       = listing.get("asset_id")
    buyer = get_user_by_wallet(req["buyer_wallet"])
    if buyer:
        req["buyer_name"]       = buyer["full_name"]
        req["buyer_kyc_status"] = buyer["kyc_status"]
    return req


@buy_requests_bp.route("", methods=["POST"])
def send_buy_request():
    """
    POST /api/buy-requests
    Body: { listing_id, buyer_wallet, token_count, offered_price_microalgo, message? }
    """
    data = request.json or {}
    missing = validate_required(data, ["listing_id", "buyer_wallet", "offered_price_microalgo"])
    if missing:
        return jsonify({"error": f"Missing: {', '.join(missing)}"}), 400

    # KYC check
    buyer = get_user_by_wallet(data["buyer_wallet"])
    if not buyer or buyer["kyc_status"] != "verified":
        return jsonify({"error": "KYC verification required to send a buy request"}), 403

    # Listing must exist and be approved+listed
    listing = get_listing_by_id(data["listing_id"])
    if not listing:
        return jsonify({"error": "Listing not found"}), 404
    if listing["status"] != "approved" or listing["state"] not in ("listed",):
        return jsonify({"error": "This property is not available for purchase"}), 400
    if listing["seller_wallet"] == data["buyer_wallet"]:
        return jsonify({"error": "You cannot buy your own listing"}), 400

    req = create_buy_request({
        "listing_id":              data["listing_id"],
        "buyer_id":                buyer["id"],
        "buyer_wallet":            data["buyer_wallet"],
        "token_count":             int(data.get("token_count", 1)),
        "offered_price_microalgo": int(data["offered_price_microalgo"]),
        "message":                 data.get("message", ""),
    })
    return jsonify({"success": True, "request": _enrich_request(req)}), 201


@buy_requests_bp.route("/buyer/<wallet>", methods=["GET"])
def buyer_requests(wallet):
    """GET /api/buy-requests/buyer/<wallet> — buyer's outgoing requests."""
    reqs = get_requests_by_buyer(wallet)
    return jsonify({"requests": [_enrich_request(r) for r in reqs]})


@buy_requests_bp.route("/seller/<wallet>", methods=["GET"])
def seller_requests(wallet):
    """GET /api/buy-requests/seller/<wallet> — seller's incoming requests."""
    reqs = get_requests_by_seller_wallet(wallet)
    return jsonify({"requests": [_enrich_request(r) for r in reqs]})


@buy_requests_bp.route("/listing/<listing_id>", methods=["GET"])
def listing_requests(listing_id):
    reqs = get_requests_by_listing(listing_id)
    return jsonify({"requests": [_enrich_request(r) for r in reqs]})


@buy_requests_bp.route("/<req_id>/accept", methods=["POST"])
def accept_request(req_id):
    """
    Seller accepts a buy request.
    Marks listing as 'in_escrow' and request as 'accepted'.
    (Token freeze is done by platform/admin off-chain or via separate call.)
    """
    req = get_request_by_id(req_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404
    if req["status"] != "pending":
        return jsonify({"error": f"Request is already '{req['status']}'"}), 400

    # Validate caller is seller
    seller_wallet = (request.json or {}).get("seller_wallet")
    listing = get_listing_by_id(req["listing_id"])
    if not listing or listing["seller_wallet"] != seller_wallet:
        return jsonify({"error": "Unauthorized"}), 403

    # Reject all other pending requests for this listing
    all_reqs = get_requests_by_listing(req["listing_id"])
    for r in all_reqs:
        if r["id"] != req_id and r["status"] == "pending":
            update_request(r["id"], status="rejected",
                           seller_response_at=datetime.utcnow().isoformat())

    # Accept this request
    update_request(req_id, status="accepted",
                   seller_response_at=datetime.utcnow().isoformat())
    update_listing(req["listing_id"], state="in_escrow")

    return jsonify({"success": True, "message": "Request accepted. Awaiting buyer payment."})


@buy_requests_bp.route("/<req_id>/reject", methods=["POST"])
def reject_request(req_id):
    """Seller rejects a buy request."""
    req = get_request_by_id(req_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404
    if req["status"] not in ("pending",):
        return jsonify({"error": f"Cannot reject a '{req['status']}' request"}), 400

    seller_wallet = (request.json or {}).get("seller_wallet")
    listing = get_listing_by_id(req["listing_id"])
    if not listing or listing["seller_wallet"] != seller_wallet:
        return jsonify({"error": "Unauthorized"}), 403

    update_request(req_id, status="rejected",
                   seller_response_at=datetime.utcnow().isoformat())
    return jsonify({"success": True})


@buy_requests_bp.route("/<req_id>/complete", methods=["POST"])
def complete_request(req_id):
    """
    Platform/admin confirms payment received and triggers on-chain settlement.
    In production: called automatically after Razorpay webhook.
    """
    result = process_settlement(req_id)
    if result["success"]:
        return jsonify(result)
    return jsonify(result), 400
