"""
Algorand helpers — shared across services
"""

import base64
from algosdk.v2client import algod, indexer
import os

ALGOD_ADDRESS   = os.getenv("ALGOD_ADDRESS", "https://testnet-api.algonode.cloud")
ALGOD_TOKEN     = os.getenv("ALGOD_TOKEN", "")
INDEXER_ADDRESS = "https://testnet-idx.algonode.cloud"

client         = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
indexer_client = indexer.IndexerClient("", INDEXER_ADDRESS)


def wait_for_confirmation(txid):
    last_round = client.status()["last-round"]
    while True:
        txinfo = client.pending_transaction_info(txid)
        if txinfo.get("confirmed-round", 0) > 0:
            return txinfo
        client.status_after_block(last_round + 1)
        last_round += 1


def compile_teal(teal_source):
    return base64.b64decode(client.compile(teal_source)["result"])


def get_asset_current_owner(asset_id):
    try:
        balances = indexer_client.asset_balances(asset_id)
        for b in balances.get("balances", []):
            if b["amount"] >= 1:
                return b["address"]
        return None
    except Exception:
        return None


def get_asset_tx_history(asset_id, limit=10):
    try:
        txns    = indexer_client.search_asset_transactions(asset_id=asset_id, txn_type="axfer")
        history = []
        for t in txns.get("transactions", [])[:limit]:
            history.append({
                "txid":   t["id"],
                "from":   t.get("sender", ""),
                "to":     t.get("asset-transfer-transaction", {}).get("receiver", ""),
                "amount": t.get("asset-transfer-transaction", {}).get("amount", 0),
                "round":  t.get("confirmed-round", 0),
            })
        return history
    except Exception:
        return []
