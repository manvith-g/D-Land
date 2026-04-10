"""
KYC Service — mock provider (swap for Surepass/HypeVerge in production)
Hashes Aadhaar locally so raw PII is never stored.
"""

import hashlib
import uuid
from datetime import datetime


def hash_aadhaar(aadhaar: str) -> str:
    """SHA-256 of cleaned Aadhaar digits. Never store raw Aadhaar."""
    clean = aadhaar.replace(" ", "").replace("-", "").strip()
    return hashlib.sha256(clean.encode()).hexdigest()


def hash_pan(pan: str) -> str:
    return hashlib.sha256(pan.upper().strip().encode()).hexdigest()


def mock_verify_kyc(full_name: str, aadhaar: str, pan: str, phone: str, dob: str = "") -> dict:
    """
    Mock KYC verification.
    In production: call Surepass / HypeVerge API here.
    Returns: { success, provider_ref, aadhaar_hash }
    """
    # Simulate: any valid-format input = verified
    aadhaar_clean = aadhaar.replace(" ", "").replace("-", "")
    if len(aadhaar_clean) != 12 or not aadhaar_clean.isdigit():
        return {"success": False, "error": "Invalid Aadhaar number (must be 12 digits)"}
    if len(pan.strip()) != 10:
        return {"success": False, "error": "Invalid PAN number"}
    if not full_name.strip():
        return {"success": False, "error": "Full name is required"}

    return {
        "success": True,
        "provider_ref": f"MOCK-KYC-{uuid.uuid4().hex[:8].upper()}",
        "aadhaar_hash": hash_aadhaar(aadhaar),
        "verified_at": datetime.utcnow().isoformat(),
    }


def verify_ownership_match(user_aadhaar_hash: str, land_record: dict) -> dict:
    """
    Check if the KYC'd user is the registered owner of the land record.
    Compares aadhaar_hash in our DB vs hash stored in land_records.
    """
    if not land_record:
        return {"match": False, "reason": "Land record not found"}

    record_hash = land_record.get("owner_aadhaar_hash", "")
    if not record_hash:
        return {"match": False, "reason": "No owner biometric on file for this record"}

    if user_aadhaar_hash == record_hash:
        return {
            "match": True,
            "owner_name": land_record["owner_name"],
            "reason": "Aadhaar hash matches registered owner",
        }
    return {
        "match": False,
        "reason": "Your identity does not match the registered owner of this property",
    }
