"""
Land Record Service — lookup and ownership verification logic
"""

from models.land_record import get_by_survey_number, get_by_reraid, search_records


def lookup_land_record(identifier: str) -> dict | None:
    """
    Try survey number first, then RERAID.
    Returns the land record dict or None.
    """
    identifier = identifier.strip()
    # Try survey number
    record = get_by_survey_number(identifier)
    if record:
        return record
    # Try RERAID
    record = get_by_reraid(identifier)
    if record:
        return record
    return None


def format_record_for_frontend(record: dict) -> dict:
    """Return a clean, frontend-safe representation of a land record."""
    if not record:
        return {}
    return {
        "id": record["id"],
        "survey_number": record["survey_number"],
        "reraid": record.get("reraid"),
        "owner_name": record["owner_name"],
        "location": {
            "district": record["location_district"],
            "taluk": record["location_taluk"],
            "village": record["location_village"],
        },
        "area_sqft": record["area_sqft"],
        "land_type": record["land_type"],
        "govt_valuation_inr": record.get("govt_valuation_inr", 0),
        "encumbrance_status": record.get("encumbrance_status", "unknown"),
        "last_registered": record.get("last_registered"),
        "raw_doc_url": record.get("raw_doc_url"),
        # Never expose owner_aadhaar_hash or owner_pan to frontend
    }
