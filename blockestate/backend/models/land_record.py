"""
Land Record model — mirrors government property/survey registry
"""

from models.db import get_db, row_to_dict, rows_to_list
import uuid
from datetime import datetime


def create_land_records_table():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS land_records (
            id                  TEXT PRIMARY KEY,
            survey_number       TEXT UNIQUE,
            reraid              TEXT UNIQUE,
            owner_name          TEXT,
            owner_aadhaar_hash  TEXT,
            owner_pan           TEXT,
            location_district   TEXT,
            location_taluk      TEXT,
            location_village    TEXT,
            area_sqft           REAL,
            land_type           TEXT,
            govt_valuation_inr  INTEGER,
            encumbrance_status  TEXT DEFAULT 'clear',
            last_registered     TEXT,
            raw_doc_url         TEXT,
            created_at          TEXT
        )
    """)
    conn.commit()
    conn.close()


def get_by_survey_number(survey_number):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM land_records WHERE LOWER(survey_number) = ?",
        (survey_number.lower().strip(),)
    ).fetchone()
    conn.close()
    return row_to_dict(row)


def get_by_reraid(reraid):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM land_records WHERE LOWER(reraid) = ?",
        (reraid.lower().strip(),)
    ).fetchone()
    conn.close()
    return row_to_dict(row)


def get_by_id(record_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM land_records WHERE id = ?", (record_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


def search_records(query):
    """Search across survey number, RERAID, village, district."""
    conn = get_db()
    q = f"%{query.lower().strip()}%"
    rows = conn.execute("""
        SELECT * FROM land_records WHERE
            LOWER(survey_number) LIKE ? OR
            LOWER(reraid) LIKE ? OR
            LOWER(location_village) LIKE ? OR
            LOWER(location_district) LIKE ?
        LIMIT 20
    """, (q, q, q, q)).fetchall()
    conn.close()
    return rows_to_list(rows)


def insert_land_record(data):
    conn = get_db()
    record_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn.execute("""
        INSERT INTO land_records (
            id, survey_number, reraid, owner_name, owner_aadhaar_hash, owner_pan,
            location_district, location_taluk, location_village, area_sqft,
            land_type, govt_valuation_inr, encumbrance_status, last_registered, raw_doc_url, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        record_id, data["survey_number"], data.get("reraid"),
        data["owner_name"], data.get("owner_aadhaar_hash"), data.get("owner_pan"),
        data["location_district"], data["location_taluk"], data["location_village"],
        data["area_sqft"], data["land_type"], data.get("govt_valuation_inr", 0),
        data.get("encumbrance_status", "clear"), data.get("last_registered"),
        data.get("raw_doc_url"), now
    ))
    conn.commit()
    conn.close()
    return get_by_survey_number(data["survey_number"])
