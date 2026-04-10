"""
User model — stores KYC data linked to Algorand wallet
"""

from models.db import get_db, row_to_dict, rows_to_list
import uuid
from datetime import datetime


def create_users_table():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id              TEXT PRIMARY KEY,
            wallet_address  TEXT UNIQUE,
            full_name       TEXT,
            aadhaar_hash    TEXT,
            pan_number      TEXT,
            phone           TEXT,
            dob             TEXT,
            kyc_status      TEXT DEFAULT 'pending',
            kyc_provider_ref TEXT,
            created_at      TEXT,
            updated_at      TEXT
        )
    """)
    conn.commit()
    conn.close()


def create_user(wallet_address, full_name, aadhaar_hash, pan_number, phone, dob=""):
    conn = get_db()
    user_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn.execute("""
        INSERT INTO users (id, wallet_address, full_name, aadhaar_hash, pan_number,
            phone, dob, kyc_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    """, (user_id, wallet_address, full_name, aadhaar_hash, pan_number, phone, dob, now, now))
    conn.commit()
    conn.close()
    return get_user_by_wallet(wallet_address)


def get_user_by_wallet(wallet_address):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM users WHERE wallet_address = ?", (wallet_address,)
    ).fetchone()
    conn.close()
    return row_to_dict(row)


def get_user_by_id(user_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


def update_user_kyc(wallet_address, kyc_status, kyc_provider_ref=None):
    conn = get_db()
    now = datetime.utcnow().isoformat()
    conn.execute("""
        UPDATE users SET kyc_status = ?, kyc_provider_ref = ?, updated_at = ?
        WHERE wallet_address = ?
    """, (kyc_status, kyc_provider_ref, now, wallet_address))
    conn.commit()
    conn.close()


def update_user_wallet(user_id, wallet_address):
    conn = get_db()
    now = datetime.utcnow().isoformat()
    conn.execute(
        "UPDATE users SET wallet_address = ?, updated_at = ? WHERE id = ?",
        (wallet_address, now, user_id)
    )
    conn.commit()
    conn.close()
