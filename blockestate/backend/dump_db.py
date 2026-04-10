"""Quick script to dump all SQLite tables."""
import sqlite3, os

DB = os.path.join(os.path.dirname(__file__), "blockestate.db")
conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row

print("=" * 60)
print("TABLES IN DATABASE")
print("=" * 60)
tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
for t in tables:
    print(f"  - {t[0]}")

print()
print("=" * 60)
print("LAND RECORDS (Government data - seeded on startup)")
print("=" * 60)
rows = conn.execute("SELECT survey_number, owner_name, location_village, location_district, area_sqft, land_type, govt_valuation_inr, encumbrance_status FROM land_records").fetchall()
print(f"  Total: {len(rows)}")
for r in rows:
    print(f"  [{r['survey_number']}] {r['owner_name']} | {r['location_village']}, {r['location_district']} | {r['area_sqft']} sqft | {r['land_type']} | INR {r['govt_valuation_inr']} | {r['encumbrance_status']}")

print()
print("=" * 60)
print("USERS (KYC-verified wallets)")
print("=" * 60)
rows = conn.execute("SELECT id, wallet_address, full_name, kyc_status, phone FROM users").fetchall()
print(f"  Total: {len(rows)}")
for r in rows:
    print(f"  {r['full_name']} | {r['wallet_address'][:12]}... | KYC: {r['kyc_status']}")

print()
print("=" * 60)
print("LISTINGS (Properties listed for sale)")
print("=" * 60)
rows = conn.execute("SELECT id, title, seller_wallet, status, state, asset_id, price_microalgo, price_inr FROM listings").fetchall()
print(f"  Total: {len(rows)}")
for r in rows:
    print(f"  {r['title']} | Status: {r['status']} | State: {r['state']} | ASA: {r['asset_id']} | {r['price_microalgo']} microALGO")

print()
print("=" * 60)
print("BUY REQUESTS")
print("=" * 60)
rows = conn.execute("SELECT * FROM buy_requests").fetchall()
print(f"  Total: {len(rows)}")
for r in rows:
    print(f"  Listing: {r['listing_id'][:8]}... | Buyer: {r['buyer_wallet'][:12]}... | Status: {r['status']}")

conn.close()
