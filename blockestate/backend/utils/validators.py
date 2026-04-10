"""
Input validation helpers
"""
import re


def is_valid_algo_address(address: str) -> bool:
    """Basic Algorand address validation (58 chars, base32)."""
    return bool(address) and len(address) == 58 and re.match(r'^[A-Z2-7]+$', address)


def is_valid_pan(pan: str) -> bool:
    """Indian PAN number format: ABCDE1234F"""
    return bool(re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]$', pan.upper()))


def is_valid_aadhaar(aadhaar: str) -> bool:
    """Aadhaar: 12 digits."""
    return bool(re.match(r'^\d{12}$', aadhaar.replace(" ", "")))


def is_valid_phone(phone: str) -> bool:
    return bool(re.match(r'^\+?[6-9]\d{9}$', phone.replace(" ", "")))


def sanitize_string(s: str, max_len: int = 500) -> str:
    if not s:
        return ""
    return str(s).strip()[:max_len]


def validate_required(data: dict, fields: list) -> list:
    """Returns list of missing field names."""
    return [f for f in fields if not data.get(f)]
