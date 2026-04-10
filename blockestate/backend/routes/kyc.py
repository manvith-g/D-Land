"""
KYC Routes — /api/kyc/*
"""

from flask import Blueprint, request, jsonify
from models.user import create_user, get_user_by_wallet, update_user_kyc, update_user_wallet
from services.kyc_service import mock_verify_kyc, hash_aadhaar
from utils.validators import validate_required, is_valid_algo_address

kyc_bp = Blueprint("kyc", __name__, url_prefix="/api/kyc")


@kyc_bp.route("/submit", methods=["POST"])
def submit_kyc():
    """
    Submit KYC details for a wallet address.
    Body: { wallet_address, full_name, aadhaar, pan, phone, dob? }
    """
    data = request.json or {}
    missing = validate_required(data, ["wallet_address", "full_name", "aadhaar", "pan", "phone"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    wallet = data["wallet_address"]
    if not is_valid_algo_address(wallet):
        return jsonify({"error": "Invalid Algorand wallet address"}), 400

    # Check if already KYC'd
    existing = get_user_by_wallet(wallet)
    if existing and existing["kyc_status"] == "verified":
        return jsonify({
            "success": True,
            "already_verified": True,
            "kyc_status": "verified",
            "user": _safe_user(existing),
        })

    # Run KYC verification (mock)
    result = mock_verify_kyc(
        full_name = data["full_name"],
        aadhaar   = data["aadhaar"],
        pan       = data["pan"],
        phone     = data["phone"],
        dob       = data.get("dob", ""),
    )

    if not result["success"]:
        return jsonify({"error": result["error"]}), 422

    aadhaar_hash = result["aadhaar_hash"]

    if existing:
        # Update existing user
        update_user_kyc(wallet, "verified", result["provider_ref"])
        user = get_user_by_wallet(wallet)
    else:
        user = create_user(
            wallet_address = wallet,
            full_name      = data["full_name"],
            aadhaar_hash   = aadhaar_hash,
            pan_number     = data["pan"].upper().strip(),
            phone          = data["phone"],
            dob            = data.get("dob", ""),
        )
        update_user_kyc(wallet, "verified", result["provider_ref"])
        user = get_user_by_wallet(wallet)

    return jsonify({
        "success": True,
        "kyc_status": "verified",
        "provider_ref": result["provider_ref"],
        "user": _safe_user(user),
    })


@kyc_bp.route("/status", methods=["GET"])
def kyc_status():
    """GET /api/kyc/status?wallet=<address>"""
    wallet = request.args.get("wallet", "").strip()
    if not wallet:
        return jsonify({"error": "wallet query param required"}), 400

    user = get_user_by_wallet(wallet)
    if not user:
        return jsonify({"kyc_status": "not_started", "user": None})

    return jsonify({
        "kyc_status": user["kyc_status"],
        "user": _safe_user(user),
    })


@kyc_bp.route("/verify-ownership", methods=["POST"])
def verify_ownership():
    """
    Cross-match a wallet's KYC Aadhaar hash against a land record.
    Body: { wallet_address, land_record_id }
    """
    from models.land_record import get_by_id
    from services.kyc_service import verify_ownership_match

    data = request.json or {}
    missing = validate_required(data, ["wallet_address", "land_record_id"])
    if missing:
        return jsonify({"error": f"Missing: {', '.join(missing)}"}), 400

    user = get_user_by_wallet(data["wallet_address"])
    if not user or user["kyc_status"] != "verified":
        return jsonify({"error": "KYC not completed for this wallet"}), 403

    record = get_by_id(data["land_record_id"])
    result = verify_ownership_match(user["aadhaar_hash"], record)

    return jsonify({
        "match": result["match"],
        "reason": result["reason"],
        "owner_name": result.get("owner_name"),
    })


def _safe_user(user: dict) -> dict:
    """Strip sensitive fields before sending to frontend."""
    if not user:
        return {}
    return {
        "id":           user["id"],
        "wallet_address": user["wallet_address"],
        "full_name":    user["full_name"],
        "phone":        user["phone"],
        "kyc_status":   user["kyc_status"],
        "created_at":   user["created_at"],
    }
