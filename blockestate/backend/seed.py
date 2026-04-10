"""
Seed script — populates mock land_records table with Karnataka-style data.
Run once on startup via app.py or manually: python seed.py
"""

import hashlib
from models.db import get_db
from models.land_record import insert_land_record, get_by_survey_number


def _hash(val: str) -> str:
    return hashlib.sha256(val.encode()).hexdigest()


MOCK_RECORDS = [
    {
        "survey_number":      "KA-BLR-042-127",
        "reraid":             "PRM/KA/RERA/1251/309/PR/180417/001",
        "owner_name":         "Ramesh Kumar Gowda",
        "owner_aadhaar_hash": _hash("123456789012"),   # Aadhaar: 1234 5678 9012
        "owner_pan":          "ABCPG1234R",
        "location_district":  "Bangalore Urban",
        "location_taluk":     "Anekal",
        "location_village":   "Sarjapura",
        "area_sqft":          2400.0,
        "land_type":          "Residential",
        "govt_valuation_inr": 8500000,
        "encumbrance_status": "clear",
        "last_registered":    "2021-03-15",
        "raw_doc_url":        "https://kaverionline.karnataka.gov.in/mock/doc1",
    },
    {
        "survey_number":      "KA-MYS-017-089",
        "reraid":             "PRM/KA/RERA/1251/309/PR/190822/043",
        "owner_name":         "Sunita Nagaraj",
        "owner_aadhaar_hash": _hash("234567890123"),
        "owner_pan":          "BCQSN2345T",
        "location_district":  "Mysuru",
        "location_taluk":     "Hunsur",
        "location_village":   "Kodagu Road",
        "area_sqft":          5500.0,
        "land_type":          "Agricultural",
        "govt_valuation_inr": 3200000,
        "encumbrance_status": "clear",
        "last_registered":    "2019-08-22",
        "raw_doc_url":        "https://kaverionline.karnataka.gov.in/mock/doc2",
    },
    {
        "survey_number":      "KA-HVR-003-214",
        "reraid":             None,
        "owner_name":         "Priya Venkatesh",
        "owner_aadhaar_hash": _hash("345678901234"),
        "owner_pan":          "CDRPV3456U",
        "location_district":  "Haveri",
        "location_taluk":     "Haveri",
        "location_village":   "Akkialur",
        "area_sqft":          12000.0,
        "land_type":          "Agricultural",
        "govt_valuation_inr": 1800000,
        "encumbrance_status": "clear",
        "last_registered":    "2020-11-02",
        "raw_doc_url":        "https://kaverionline.karnataka.gov.in/mock/doc3",
    },
    {
        "survey_number":      "KA-DWD-009-055",
        "reraid":             "PRM/KA/RERA/1251/309/PR/211105/088",
        "owner_name":         "Arjun Desai",
        "owner_aadhaar_hash": _hash("456789012345"),
        "owner_pan":          "DESAD4567V",
        "location_district":  "Dharwad",
        "location_taluk":     "Hubli",
        "location_village":   "Vidyanagar",
        "area_sqft":          1800.0,
        "land_type":          "Commercial",
        "govt_valuation_inr": 12000000,
        "encumbrance_status": "mortgaged",
        "last_registered":    "2021-05-20",
        "raw_doc_url":        "https://kaverionline.karnataka.gov.in/mock/doc4",
    },
    {
        "survey_number":      "KA-BLR-099-301",
        "reraid":             "PRM/KA/RERA/1251/309/PR/220301/112",
        "owner_name":         "Meena Krishnamurthy",
        "owner_aadhaar_hash": _hash("567890123456"),
        "owner_pan":          "EFGMK5678W",
        "location_district":  "Bangalore Urban",
        "location_taluk":     "Bangalore North",
        "location_village":   "Hennur",
        "area_sqft":          3200.0,
        "land_type":          "Residential",
        "govt_valuation_inr": 22000000,
        "encumbrance_status": "clear",
        "last_registered":    "2022-03-01",
        "raw_doc_url":        "https://kaverionline.karnataka.gov.in/mock/doc5",
    },
    {
        "survey_number":      "KA-KLR-021-178",
        "reraid":             None,
        "owner_name":         "Venkatappa Reddy",
        "owner_aadhaar_hash": _hash("678901234567"),
        "owner_pan":          "FGHVR6789X",
        "location_district":  "Kolar",
        "location_taluk":     "Kolar",
        "location_village":   "Mulbagal",
        "area_sqft":          8800.0,
        "land_type":          "Agricultural",
        "govt_valuation_inr": 2400000,
        "encumbrance_status": "clear",
        "last_registered":    "2018-06-14",
        "raw_doc_url":        "https://kaverionline.karnataka.gov.in/mock/doc6",
    },
    {
        "survey_number":      "KA-BLR-011-042",
        "reraid":             "PRM/KA/RERA/1251/309/PR/230515/201",
        "owner_name":         "Demo Seller",
        "owner_aadhaar_hash": _hash("111122223333"),  # Test: Aadhaar 1111 2222 3333
        "owner_pan":          "DEMSD1111Z",
        "location_district":  "Bangalore Urban",
        "location_taluk":     "Bangalore South",
        "location_village":   "Bannerghatta",
        "area_sqft":          2000.0,
        "land_type":          "Residential",
        "govt_valuation_inr": 15000000,
        "encumbrance_status": "clear",
        "last_registered":    "2023-05-15",
        "raw_doc_url":        "https://kaverionline.karnataka.gov.in/mock/doc7",
    },
]


def seed_land_records():
    for record in MOCK_RECORDS:
        if not get_by_survey_number(record["survey_number"]):
            insert_land_record(record)
            print(f"  [*] Seeded: {record['survey_number']}")
        else:
            print(f"  [OK] Already exists: {record['survey_number']}")
    print(f"[OK] Land records seeded ({len(MOCK_RECORDS)} records)")


if __name__ == "__main__":
    import sys, os
    sys.path.insert(0, os.path.dirname(__file__))
    from models.db import init_db
    init_db()
    seed_land_records()
