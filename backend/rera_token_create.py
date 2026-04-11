"""
rera_token_create.py
─────────────────────
1.  Fetch a RERA record from Supabase by its RERA-ID.
2.  Pin that record's metadata to IPFS via Pinata.
3.  Create N Algorand Standard Assets (one per flat).
4.  Transfer every ASA into the seller's wallet.

Environment variables required (loaded from .env):
    SUPABASE_URL, SUPABASE_SERVICE_KEY,
    PINATA_API_KEY, PINATA_SECRET_API_KEY,
    ALGOD_ADDRESS, ALGOD_TOKEN,
    CREATOR_MNEMONIC          ← the backend "creator" account that
                                 funds ASA creation & opt-in txns.
"""

import json, os, hashlib
from datetime import datetime
from typing import Any

import requests
from algosdk import mnemonic, account, transaction
from algosdk.v2client import algod
from supabase import create_client, Client


# ──────────────────────────────────────────────
#  CONFIG  (all read from env / .env)
# ──────────────────────────────────────────────
SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_KEY: str = os.environ["SUPABASE_SERVICE_KEY"]
PINATA_API_KEY: str = os.environ["PINATA_API_KEY"]
PINATA_SECRET: str = os.environ["PINATA_SECRET_API_KEY"]
ALGOD_ADDRESS: str = os.environ["ALGOD_ADDRESS"]
ALGOD_TOKEN: str = os.environ["ALGOD_TOKEN"]
CREATOR_MNEMONIC: str = os.environ["CREATOR_MNEMONIC"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# Derive creator keys
CREATOR_SK = mnemonic.to_private_key(CREATOR_MNEMONIC)
CREATOR_ADDR = account.address_from_private_key(CREATOR_SK)


# ──────────────────────────────────────────────
#  1 ▸ SUPABASE – fetch RERA row
# ──────────────────────────────────────────────
def fetch_rera_record(rera_id: str) -> dict[str, Any]:
    """Return a single rera_records row or raise."""
    resp = (
        supabase.table("rera_records")
        .select("*")
        .eq("reraid", rera_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise ValueError(f"No RERA record found for ID: {rera_id}")
    return resp.data


# ──────────────────────────────────────────────
#  2 ▸ PINATA – pin JSON metadata to IPFS
# ──────────────────────────────────────────────
PINATA_PIN_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS"

def pin_metadata_to_ipfs(record: dict) -> str:
    """
    Pin the RERA record as JSON to IPFS via Pinata.
    Returns the IPFS CID (hash).
    """
    # Build a clean metadata payload
    metadata_payload = {
        "standard": "arc3",
        "name": f"RERA-{record['reraid']}",
        "description": (
            f"Tokenised real-estate asset registered under "
            f"RERA ID {record['reraid']}"
        ),
        "properties": {
            "reraid": record["reraid"],
            "owner_name": record["owner_name"],
            "owner_pan": record.get("owner_pan"),
            "location": {
                "district": record["location_district"],
                "taluk": record["location_taluk"],
                "village": record["location_village"],
            },
            "area_sqft": str(record.get("area_sqft", "")),
            "land_type": record.get("land_type"),
            "govt_valuation_inr": record.get("govt_valuation_inr"),
            "encumbrance_status": record.get("encumbrance_status"),
            "last_registered": str(record.get("last_registered", "")),
            "raw_doc_url": record.get("raw_doc_url"),
            "no_of_flats": int(record.get("no_of_flats", 1)),
        },
        "pinned_at": datetime.utcnow().isoformat(),
    }

    headers = {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_SECRET,
        "Content-Type": "application/json",
    }

    body = {
        "pinataContent": metadata_payload,
        "pinataMetadata": {"name": f"rera-{record['reraid']}"},
    }

    resp = requests.post(PINATA_PIN_URL, json=body, headers=headers, timeout=30)
    resp.raise_for_status()
    ipfs_hash = resp.json()["IpfsHash"]
    return ipfs_hash


# ──────────────────────────────────────────────
#  3 ▸ ALGORAND – create ASAs + transfer
# ──────────────────────────────────────────────
def _wait_for_confirmation(txid: str, timeout: int = 10) -> dict:
    """Block until the txn is confirmed or times out."""
    try:
        result = transaction.wait_for_confirmation(algod_client, txid, timeout)
        return result
    except Exception as exc:
        raise RuntimeError(f"Txn {txid} failed confirmation: {exc}") from exc


def create_and_transfer_asa(
    *,
    rera_id: str,
    ipfs_hash: str,
    flat_index: int,
    total_flats: int,
    seller_address: str,
    seller_sk: str,
) -> dict:
    """
    Create ONE ASA representing a single flat, then transfer it
    from the creator to the seller.

    Returns {"asset_id": int, "flat_index": int}.
    """
    params = algod_client.suggested_params()

    # Metadata hash (ARC-3): SHA-256 of the IPFS URL bytes
    ipfs_url = f"ipfs://{ipfs_hash}"
    metadata_hash = hashlib.sha256(ipfs_url.encode()).digest()

    # ── 3a. ASA Create txn (signed by creator) ──────────────
    # Algorand Asset Name must be strictly <= 32 characters
    suffix = f"-F{flat_index}/{total_flats}"
    prefix = "RERA-"
    max_rera_len = 32 - len(prefix) - len(suffix)
    short_rera = rera_id[-max_rera_len:] if len(rera_id) > max_rera_len else rera_id
    final_asset_name = f"{prefix}{short_rera}{suffix}"

    create_txn = transaction.AssetConfigTxn(
        sender=CREATOR_ADDR,
        sp=params,
        total=1,                        # NFT-style: 1 unit
        decimals=0,
        default_frozen=False,
        unit_name="DLAND",
        asset_name=final_asset_name,
        url=ipfs_url,
        metadata_hash=metadata_hash,
        manager=CREATOR_ADDR,
        reserve=CREATOR_ADDR,
        freeze="",
        clawback="",
        strict_empty_address_check=False,
    )
    signed_create = create_txn.sign(CREATOR_SK)
    create_txid = algod_client.send_transaction(signed_create)
    result = _wait_for_confirmation(create_txid)
    asset_id = result["asset-index"]

    # Step 3. Opt-in the seller to the newly minted ASA
    params = algod_client.suggested_params()
    opt_in_txn = transaction.AssetTransferTxn(
        sender=seller_address,
        sp=params,
        receiver=seller_address,
        amt=0,
        index=asset_id
    )
    stxn_opt = opt_in_txn.sign(seller_sk)
    txid_opt = algod_client.send_transaction(stxn_opt)
    _wait_for_confirmation(txid_opt)

    # Step 4. Transfer the ASA from Creator to Seller
    xfer_txn = transaction.AssetTransferTxn(
        sender=CREATOR_ADDR,
        sp=params,
        receiver=seller_address,
        amt=1,
        index=asset_id
    )
    stxn_xfer = xfer_txn.sign(CREATOR_SK)
    txid_xfer = algod_client.send_transaction(stxn_xfer)
    _wait_for_confirmation(txid_xfer)

    return {"asset_id": asset_id, "flat_index": flat_index}


# ──────────────────────────────────────────────
#  4 ▸ ORCHESTRATOR – end-to-end pipeline
# ──────────────────────────────────────────────
def tokenise_rera(rera_id: str, seller_mnemonic: str, price: float = 0.0) -> dict:
    """
    Full pipeline:
      fetch → pin → create N ASAs → transfer to seller.

    Parameters
    ----------
    rera_id : str
        The RERA registration ID to look up.
    seller_mnemonic : str
        25-word Algorand mnemonic of the seller so we can
        sign the opt-in txn on their behalf.

    Returns
    -------
    dict with ipfs_hash, no_of_flats, and list of created assets.
    """
    # Derive seller keys from mnemonic
    seller_sk = mnemonic.to_private_key(seller_mnemonic)
    seller_address = account.address_from_private_key(seller_sk)

    # Step 1 – Supabase
    record = fetch_rera_record(rera_id)

    # Step 2 – IPFS / Pinata
    ipfs_hash = pin_metadata_to_ipfs(record)

    # Step 3 + 4 – create & transfer each flat token
    total_flats = int(record.get("no_of_flats", 1))
    created_assets = []

    for i in range(1, total_flats + 1):
        asset_info = create_and_transfer_asa(
            rera_id=rera_id,
            ipfs_hash=ipfs_hash,
            flat_index=i,
            total_flats=total_flats,
            seller_address=seller_address,
            seller_sk=seller_sk,
        )
        created_assets.append(asset_info)
        
        # Insert into property_listings
        try:
            supabase.table("property_listings").insert({
                "rera_id": rera_id,
                "asset_id": asset_info["asset_id"],
                "seller_wallet": seller_address,
                "price": float(price),
                "status": "listed"
            }).execute()
        except Exception as e:
            print(f"Failed to insert listing for ASA {asset_info['asset_id']}: {e}")

    return {
        "rera_id": rera_id,
        "seller_wallet": seller_address,
        "ipfs_hash": ipfs_hash,
        "ipfs_url": f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}",
        "no_of_flats": total_flats,
        "assets": created_assets,
    }
