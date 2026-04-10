"""
Buy Request model — buyer-initiated offers on listings
"""

from models.db import get_db, row_to_dict, rows_to_list
import uuid
from datetime import datetime


def create_buy_requests_table():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS buy_requests (
            id                      TEXT PRIMARY KEY,
            listing_id              TEXT,
            buyer_id                TEXT,
            buyer_wallet            TEXT,
            token_count             INTEGER DEFAULT 1,
            offered_price_microalgo INTEGER,
            message                 TEXT,
            status                  TEXT DEFAULT 'pending',
            seller_response_at      TEXT,
            escrow_txid             TEXT,
            settlement_txid         TEXT,
            created_at              TEXT,
            updated_at              TEXT,
            FOREIGN KEY (listing_id) REFERENCES listings(id)
        )
    """)
    conn.commit()
    conn.close()


def create_buy_request(data):
    conn = get_db()
    req_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn.execute("""
        INSERT INTO buy_requests (
            id, listing_id, buyer_id, buyer_wallet, token_count,
            offered_price_microalgo, message, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    """, (
        req_id, data["listing_id"], data.get("buyer_id"), data["buyer_wallet"],
        data.get("token_count", 1), data["offered_price_microalgo"],
        data.get("message", ""), now, now
    ))
    conn.commit()
    conn.close()
    return get_request_by_id(req_id)


def get_request_by_id(req_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM buy_requests WHERE id = ?", (req_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


def get_requests_by_buyer(buyer_wallet):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM buy_requests WHERE buyer_wallet = ? ORDER BY created_at DESC",
        (buyer_wallet,)
    ).fetchall()
    conn.close()
    return rows_to_list(rows)


def get_requests_by_listing(listing_id):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM buy_requests WHERE listing_id = ? ORDER BY created_at DESC",
        (listing_id,)
    ).fetchall()
    conn.close()
    return rows_to_list(rows)


def get_requests_by_seller_wallet(seller_wallet):
    """Get all buy requests for listings owned by this seller."""
    conn = get_db()
    rows = conn.execute("""
        SELECT br.* FROM buy_requests br
        JOIN listings l ON br.listing_id = l.id
        WHERE l.seller_wallet = ?
        ORDER BY br.created_at DESC
    """, (seller_wallet,)).fetchall()
    conn.close()
    return rows_to_list(rows)


def update_request(req_id, **kwargs):
    kwargs["updated_at"] = datetime.utcnow().isoformat()
    fields = ", ".join(f"{k} = ?" for k in kwargs)
    values = list(kwargs.values()) + [req_id]
    conn = get_db()
    conn.execute(f"UPDATE buy_requests SET {fields} WHERE id = ?", values)
    conn.commit()
    conn.close()
