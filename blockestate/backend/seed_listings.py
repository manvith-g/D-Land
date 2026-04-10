"""
Seed dummy listings so the marketplace isn't empty.
Creates fake KYC-verified users + listings linked to the seeded land records.
Run: python backend/seed_listings.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from models.db import init_db
from models.user import create_user, get_user_by_wallet, update_user_kyc
from models.land_record import get_by_survey_number
from models.listing import insert_listing, get_listings_by_seller
from seed import seed_land_records
from services.kyc_service import hash_aadhaar
from datetime import datetime
import uuid

# Make sure tables + land records exist
init_db()
seed_land_records()

# Dummy sellers — each "owns" one of the seeded land records
DUMMY_SELLERS = [
    {
        "wallet":  "RAMESH7GOWDA7WALLET77777777777777777777777777777777777777AA",
        "name":    "Ramesh Kumar Gowda",
        "aadhaar": "123456789012",
        "pan":     "ABCPG1234R",
        "phone":   "9876543210",
        "survey":  "KA-BLR-042-127",
        "title":   "Premium 2400 sqft Plot in Sarjapura",
        "desc":    "Corner site with clear title, close to Wipro Campus. Perfect for villa construction. All amenities within 2km. BBMP approved layout.",
        "price_algo": 50_000_000,   # 50 ALGO
        "price_inr":  8500000,
    },
    {
        "wallet":  "SUNITA7NAGARAJ7WALLET7777777777777777777777777777777777AA",
        "name":    "Sunita Nagaraj",
        "aadhaar": "234567890123",
        "pan":     "BCQSN2345T",
        "phone":   "9876543211",
        "survey":  "KA-MYS-017-089",
        "title":   "5500 sqft Agricultural Land near Kodagu",
        "desc":    "Fertile land with borewell, 2km from main road. Ideal for coffee or pepper plantation. Beautiful hill view.",
        "price_algo": 25_000_000,   # 25 ALGO
        "price_inr":  3200000,
    },
    {
        "wallet":  "PRIYA7VENKATESH7WALLET777777777777777777777777777777777AA",
        "name":    "Priya Venkatesh",
        "aadhaar": "345678901234",
        "pan":     "CDRPV3456U",
        "phone":   "9876543212",
        "survey":  "KA-HVR-003-214",
        "title":   "12000 sqft Farm Land in Akkialur, Haveri",
        "desc":    "Large agricultural plot with natural water source. Currently growing paddy. Excellent investment opportunity.",
        "price_algo": 15_000_000,   # 15 ALGO
        "price_inr":  1800000,
    },
    {
        "wallet":  "MEENA7KRISHNA7WALLET7777777777777777777777777777777777AAA",
        "name":    "Meena Krishnamurthy",
        "aadhaar": "567890123456",
        "pan":     "EFGMK5678W",
        "phone":   "9876543214",
        "survey":  "KA-BLR-099-301",
        "title":   "3200 sqft Premium Plot in Hennur, Bangalore",
        "desc":    "Prime location near Hennur Main Road. 5 mins to Manyata Tech Park. BMRDA approved. Already has compound wall.",
        "price_algo": 120_000_000,  # 120 ALGO
        "price_inr":  22000000,
    },
    {
        "wallet":  "VENKATAPPA7REDDY7WALLET7777777777777777777777777777777AAA",
        "name":    "Venkatappa Reddy",
        "aadhaar": "678901234567",
        "pan":     "FGHVR6789X",
        "phone":   "9876543215",
        "survey":  "KA-KLR-021-178",
        "title":   "8800 sqft Agricultural Land in Mulbagal, Kolar",
        "desc":    "Well-maintained farm with mango and coconut trees. Fenced property. 30 mins from Kolar Gold Fields.",
        "price_algo": 18_000_000,   # 18 ALGO
        "price_inr":  2400000,
    },
]

print()
print("=" * 60)
print("SEEDING DUMMY USERS & LISTINGS")
print("=" * 60)

for seller in DUMMY_SELLERS:
    # 1. Create or get user
    user = get_user_by_wallet(seller["wallet"])
    if not user:
        user = create_user(
            wallet_address=seller["wallet"],
            full_name=seller["name"],
            aadhaar_hash=hash_aadhaar(seller["aadhaar"]),
            pan_number=seller["pan"],
            phone=seller["phone"],
            dob="",
        )
        update_user_kyc(seller["wallet"], "verified", f"MOCK-SEED-{uuid.uuid4().hex[:6].upper()}")
        user = get_user_by_wallet(seller["wallet"])
        print(f"  [+] Created user: {seller['name']} ({seller['wallet'][:16]}...)")
    else:
        print(f"  [=] User exists:  {seller['name']}")

    # 2. Look up land record
    record = get_by_survey_number(seller["survey"])
    if not record:
        print(f"  [!] Land record not found: {seller['survey']} -- skipping")
        continue

    # 3. Check if listing already exists for this seller
    existing = get_listings_by_seller(seller["wallet"])
    if existing:
        print(f"  [=] Listing exists for {seller['name']}")
        continue

    # 4. Create listing (status=approved so it shows in marketplace)
    listing = insert_listing({
        "land_record_id":  record["id"],
        "seller_id":       user["id"],
        "seller_wallet":   seller["wallet"],
        "title":           seller["title"],
        "description":     seller["desc"],
        "token_count":     1,
        "price_microalgo": seller["price_algo"],
        "price_inr":       seller["price_inr"],
        "commission_pct":  2,
        "broker_address":  "",
        "ipfs_hash":       "",
        "images":          "[]",
    })

    # Mark as approved so it shows in the marketplace
    from models.listing import update_listing
    update_listing(listing["id"], status="approved", state="listed")
    print(f"  [+] Listed: {seller['title']} ({seller['price_inr']/100000:.1f}L INR / {seller['price_algo']/1_000_000} ALGO)")

print()
print("[OK] Seeding complete! Run dump_db.py to verify.")
