"""
Settlement Service — confirms payment and triggers on-chain token release
"""

from services.algorand_service import complete_settlement
from models.buy_request import update_request, get_request_by_id
from models.listing import get_listing_by_id, update_listing
from datetime import datetime


def process_settlement(request_id: str) -> dict:
    """
    Called after buyer payment is confirmed (fiat or ALGO).
    1. Gets buy request + listing details
    2. Triggers complete_transfer on smart contract
    3. Updates DB records
    Returns { success, settlement_txid }
    """
    req = get_request_by_id(request_id)
    if not req:
        return {"success": False, "error": "Buy request not found"}
    if req["status"] != "accepted":
        return {"success": False, "error": f"Request is '{req['status']}', cannot settle"}

    listing = get_listing_by_id(req["listing_id"])
    if not listing:
        return {"success": False, "error": "Listing not found"}
    if not listing["app_id"]:
        return {"success": False, "error": "Contract not deployed for this listing"}

    try:
        txid = complete_settlement(
            app_id         = listing["app_id"],
            asset_id       = listing["asset_id"],
            buyer_address  = req["buyer_wallet"],
            seller_address = listing["seller_wallet"],
            broker_address = listing.get("broker_address") or "",
            price          = req["offered_price_microalgo"],
        )
        update_request(request_id,
            status         = "completed",
            settlement_txid= txid,
        )
        update_listing(listing["id"],
            state  = "sold",
            status = "sold",
        )
        return {"success": True, "settlement_txid": txid}
    except Exception as e:
        return {"success": False, "error": str(e)}
