"""
Listing model — property listings linked to land_records and users
"""

from models.db import get_db, row_to_dict, rows_to_list
import uuid
from datetime import datetime


def create_listings_table():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS listings (
            id                      TEXT PRIMARY KEY,
            land_record_id          TEXT,
            seller_id               TEXT,
            seller_wallet           TEXT,
            title                   TEXT,
            description             TEXT,
            token_count             INTEGER DEFAULT 1,
            price_microalgo         INTEGER,
            price_inr               INTEGER,
            commission_pct          INTEGER DEFAULT 2,
            broker_address          TEXT,
            ipfs_hash               TEXT,
            images                  TEXT,
            status                  TEXT DEFAULT 'pending',
            asset_id                INTEGER,
            app_id                  INTEGER,
            app_address             TEXT,
            state                   TEXT DEFAULT 'listed',
            mint_txid               TEXT,
            deploy_txid             TEXT,
            created_at              TEXT,
            updated_at              TEXT
        )
    """)
    conn.commit()
    conn.close()


def insert_listing(data):
    conn = get_db()
    listing_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    listing = {
        "id": listing_id,
        "land_record_id": data.get("land_record_id"),
        "seller_id": data.get("seller_id"),
        "seller_wallet": data["seller_wallet"],
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "token_count": data.get("token_count", 1),
        "price_microalgo": data["price_microalgo"],
        "price_inr": data.get("price_inr", 0),
        "commission_pct": data.get("commission_pct", 2),
        "broker_address": data.get("broker_address", ""),
        "ipfs_hash": data.get("ipfs_hash", ""),
        "images": data.get("images", "[]"),
        "status": "pending",
        "asset_id": None,
        "app_id": None,
        "app_address": None,
        "state": "listed",
        "mint_txid": None,
        "deploy_txid": None,
        "created_at": now,
        "updated_at": now,
    }
    conn.execute("""
        INSERT INTO listings (
            id, land_record_id, seller_id, seller_wallet, title, description,
            token_count, price_microalgo, price_inr, commission_pct, broker_address,
            ipfs_hash, images, status, asset_id, app_id, app_address, state,
            mint_txid, deploy_txid, created_at, updated_at
        ) VALUES (
            :id, :land_record_id, :seller_id, :seller_wallet, :title, :description,
            :token_count, :price_microalgo, :price_inr, :commission_pct, :broker_address,
            :ipfs_hash, :images, :status, :asset_id, :app_id, :app_address, :state,
            :mint_txid, :deploy_txid, :created_at, :updated_at
        )
    """, listing)
    conn.commit()
    conn.close()
    return get_listing_by_id(listing_id)


def get_listing_by_id(listing_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM listings WHERE id = ?", (listing_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


def get_all_approved_listings():
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM listings WHERE status = 'approved' ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return rows_to_list(rows)


def get_listings_by_seller(seller_wallet):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM listings WHERE seller_wallet = ? ORDER BY created_at DESC",
        (seller_wallet,)
    ).fetchall()
    conn.close()
    return rows_to_list(rows)


def get_all_listings():
    conn = get_db()
    rows = conn.execute("SELECT * FROM listings ORDER BY created_at DESC").fetchall()
    conn.close()
    return rows_to_list(rows)


def update_listing(listing_id, **kwargs):
    kwargs["updated_at"] = datetime.utcnow().isoformat()
    fields = ", ".join(f"{k} = ?" for k in kwargs)
    values = list(kwargs.values()) + [listing_id]
    conn = get_db()
    conn.execute(f"UPDATE listings SET {fields} WHERE id = ?", values)
    conn.commit()
    conn.close()


def get_listing_by_asset_id(asset_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM listings WHERE asset_id = ?", (asset_id,)).fetchone()
    conn.close()
    return row_to_dict(row)
