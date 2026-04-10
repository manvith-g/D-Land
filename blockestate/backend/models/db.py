"""
Database connection & initialization for BlockEstate
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "blockestate.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def row_to_dict(row):
    return dict(row) if row else None


def rows_to_list(rows):
    return [row_to_dict(r) for r in rows]


def init_db():
    from models.user import create_users_table
    from models.land_record import create_land_records_table
    from models.listing import create_listings_table
    from models.buy_request import create_buy_requests_table

    create_users_table()
    create_land_records_table()
    create_listings_table()
    create_buy_requests_table()
    print("[OK] All tables initialised")
