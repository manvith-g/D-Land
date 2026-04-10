"""
Algorand Service — ASA minting, contract deploy, escrow ops
"""

import json, os
from algosdk import account, mnemonic, transaction
from algosdk.logic import get_application_address
from utils.algorand_helpers import client, compile_teal, wait_for_confirmation
from dotenv import load_dotenv

load_dotenv()

ADMIN_MNEMONIC = os.getenv("ADMIN_MNEMONIC")
admin_pk       = mnemonic.to_private_key(ADMIN_MNEMONIC) if ADMIN_MNEMONIC else None
admin_address  = account.address_from_private_key(admin_pk) if admin_pk else None

CONTRACTS_DIR = os.path.join(os.path.dirname(__file__), "../../contracts/build")


def mint_asa(location: str, property_id: str, ipfs_hash: str,
             seller_addr: str, token_count: int = 1) -> tuple:
    """
    Mint a property ASA.
    token_count=1  → whole ownership token
    token_count>1  → fractional shares
    Returns (asset_id, txid)
    """
    sp = client.suggested_params()
    txn = transaction.AssetConfigTxn(
        sender         = admin_address,
        sp             = sp,
        default_frozen = False,
        unit_name      = "PROP",
        asset_name     = f"Property-{property_id[:10]}",
        manager        = admin_address,
        reserve        = admin_address,
        freeze         = admin_address,
        clawback       = admin_address,
        url            = f"ipfs://{ipfs_hash}" if ipfs_hash else "ipfs://QmMock",
        total          = token_count,
        decimals       = 0,
        note           = json.dumps({
            "property_id": property_id,
            "location":    location,
            "seller":      seller_addr,
        }).encode(),
    )
    signed = txn.sign(admin_pk)
    txid   = client.send_transaction(signed)
    result = wait_for_confirmation(txid)
    return result["asset-index"], txid


def deploy_escrow_contract(seller_address: str, broker_address: str,
                           asset_id: int, price: int, commission_pct: int) -> tuple:
    """
    Deploy the PropertyEscrow smart contract.
    Returns (app_id, app_address, txid)
    """
    approval_path = os.path.join(CONTRACTS_DIR, "approval.teal")
    clear_path    = os.path.join(CONTRACTS_DIR, "clear.teal")

    with open(approval_path) as f:
        approval_program = compile_teal(f.read())
    with open(clear_path) as f:
        clear_program = compile_teal(f.read())

    sp            = client.suggested_params()
    global_schema = transaction.StateSchema(num_uints=5, num_byte_slices=4)
    local_schema  = transaction.StateSchema(num_uints=0, num_byte_slices=0)

    txn = transaction.ApplicationCreateTxn(
        sender           = admin_address,
        sp               = sp,
        on_complete      = transaction.OnComplete.NoOpOC,
        approval_program = approval_program,
        clear_program    = clear_program,
        global_schema    = global_schema,
        local_schema     = local_schema,
        app_args         = [b"create", price.to_bytes(8, "big"), commission_pct.to_bytes(8, "big")],
        accounts         = [broker_address if broker_address else admin_address],
        foreign_assets   = [asset_id],
    )
    signed = txn.sign(admin_pk)
    txid   = client.send_transaction(signed)
    result = wait_for_confirmation(txid)
    app_id      = result["application-index"]
    app_address = get_application_address(app_id)
    return app_id, app_address, txid


def fund_contract(app_address: str, amount_microalgo: int = 300_000) -> str:
    """Send minimum ALGO to contract so it can do inner transactions."""
    sp  = client.suggested_params()
    txn = transaction.PaymentTxn(admin_address, sp, app_address, amount_microalgo)
    signed = txn.sign(admin_pk)
    txid   = client.send_transaction(signed)
    wait_for_confirmation(txid)
    return txid


def opt_contract_into_asset(app_id: int, asset_id: int) -> str:
    """Admin calls opt_in_asset so contract can hold the ASA."""
    sp  = client.suggested_params()
    txn = transaction.ApplicationCallTxn(
        sender        = admin_address,
        sp            = sp,
        index         = app_id,
        on_complete   = transaction.OnComplete.NoOpOC,
        app_args      = [b"opt_in_asset"],
        foreign_assets= [asset_id],
    )
    signed = txn.sign(admin_pk)
    txid   = client.send_transaction(signed)
    wait_for_confirmation(txid)
    return txid


def transfer_asa_to_contract(app_address: str, asset_id: int,
                              seller_private_key: str = None) -> str:
    """Transfer ASA from admin/seller into contract escrow."""
    pk = seller_private_key or admin_pk
    sender = account.address_from_private_key(pk)
    sp = client.suggested_params()
    txn = transaction.AssetTransferTxn(
        sender    = sender,
        sp        = sp,
        receiver  = app_address,
        amt       = 1,
        index     = asset_id,
    )
    signed = txn.sign(pk)
    txid   = client.send_transaction(signed)
    wait_for_confirmation(txid)
    return txid


def complete_settlement(app_id: int, asset_id: int,
                        buyer_address: str, seller_address: str,
                        broker_address: str, price: int) -> str:
    """
    Admin triggers complete_transfer on the contract after payment confirmed.
    Returns settlement txid.
    """
    sp = client.suggested_params()
    txn = transaction.ApplicationCallTxn(
        sender        = admin_address,
        sp            = sp,
        index         = app_id,
        on_complete   = transaction.OnComplete.NoOpOC,
        app_args      = [b"complete_transfer"],
        accounts      = [seller_address, buyer_address, broker_address or admin_address],
        foreign_assets= [asset_id],
    )
    signed = txn.sign(admin_pk)
    txid   = client.send_transaction(signed)
    wait_for_confirmation(txid)
    return txid
