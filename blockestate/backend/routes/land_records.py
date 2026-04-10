"""
Land Records Routes — /api/land-records/*
"""

from flask import Blueprint, request, jsonify
from models.land_record import search_records
from services.land_record_service import lookup_land_record, format_record_for_frontend
from models.db import get_db, rows_to_list

land_records_bp = Blueprint("land_records", __name__, url_prefix="/api/land-records")


@land_records_bp.route("/all", methods=["GET"])
def get_all():
    """GET /api/land-records/all — list all survey numbers in the database."""
    conn = get_db()
    rows = conn.execute(
        "SELECT survey_number, reraid, owner_name, location_village, location_district, area_sqft, land_type, govt_valuation_inr, encumbrance_status FROM land_records ORDER BY survey_number"
    ).fetchall()
    conn.close()
    records = rows_to_list(rows)
    return jsonify({"count": len(records), "records": records})


@land_records_bp.route("/lookup", methods=["GET"])
def lookup():
    """
    GET /api/land-records/lookup?q=<survey_number_or_reraid>
    Returns the land record (without sensitive ownership hashes).
    """
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"error": "Query param 'q' required"}), 400

    record = lookup_land_record(q)
    if not record:
        return jsonify({"found": False, "message": "No property record found for this identifier"}), 404

    return jsonify({
        "found": True,
        "record": format_record_for_frontend(record),
    })


@land_records_bp.route("/search", methods=["GET"])
def search():
    """
    GET /api/land-records/search?q=<text>
    Returns up to 20 matching records.
    """
    q = request.args.get("q", "").strip()
    if len(q) < 3:
        return jsonify({"error": "Query must be at least 3 characters"}), 400

    records = search_records(q)
    return jsonify({
        "count": len(records),
        "records": [format_record_for_frontend(r) for r in records],
    })
