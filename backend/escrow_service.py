import base64
from typing import Dict, Any
from datetime import datetime

from pyteal import *
from algosdk import account, mnemonic, transaction, logic, encoding
from rera_token_create import supabase, algod_client, CREATOR_MNEMONIC, CREATOR_SK, CREATOR_ADDR, _wait_for_confirmation

def escrow_program(buyer_addr: str, seller_addr: str, asset_id: int, amount: int):
    """
    Stateless Smart Contract restricting the Escrow Address to only 2 actions:
    1. Opting into the ASA (Group Size 1)
    2. Atomic Settlement (Group Size 2: ASA to Buyer, ALGO to Seller)
    """
    # 1. ASA Opt-In Condition
    is_opt_in = And(
        Global.group_size() == Int(1),
        Txn.type_enum() == TxnType.AssetTransfer,
        Txn.xfer_asset() == Int(asset_id),
        Txn.asset_receiver() == Txn.sender(),
        Txn.asset_amount() == Int(0),
        Txn.fee() <= Int(2000),
        Txn.rekey_to() == Global.zero_address()
    )
    
    # 2. Atomic Settle Condition
    is_settle = And(
        Global.group_size() == Int(2),
        
        # Txn 0: ASA to Buyer
        Gtxn[0].type_enum() == TxnType.AssetTransfer,
        Gtxn[0].xfer_asset() == Int(asset_id),
        Gtxn[0].asset_receiver() == Addr(buyer_addr),
        Gtxn[0].asset_amount() == Int(1),
        Gtxn[0].sender() == Txn.sender(),
        Gtxn[0].fee() <= Int(2000),
        Gtxn[0].rekey_to() == Global.zero_address(),
        
        # Txn 1: Algo Payment to Seller
        Gtxn[1].type_enum() == TxnType.Payment,
        Gtxn[1].receiver() == Addr(seller_addr),
        Gtxn[1].amount() >= Int(amount), 
        Gtxn[1].sender() == Txn.sender(),
        Gtxn[1].fee() <= Int(2000),
        Gtxn[1].rekey_to() == Global.zero_address()
    )
    
    program = Cond(
        [is_opt_in, Int(1)],
        [is_settle, Int(1)]
    )
    
    return program

def get_compiled_escrow(buyer_addr: str, seller_addr: str, asset_id: int, amount: int) -> transaction.LogicSigAccount:
    program_ast = escrow_program(buyer_addr, seller_addr, asset_id, amount)
    teal_src = compileTeal(program_ast, mode=Mode.Signature, version=5)
    
    compilation_result = algod_client.compile(teal_src)
    program_bytes = base64.b64decode(compilation_result['result'])
    return transaction.LogicSigAccount(program_bytes)

def fund_and_optin_lsig(lsig: transaction.LogicSigAccount, asset_id: int):
    """
    Called intimately upon contract deployment.
    Forces minimum balance and opts-in to the ASA so the Escrow can receive it. 
    """
    escrow_addr = lsig.address()
    params = algod_client.suggested_params()
    
    # 1. Fund from Creator 
    fund_txn = transaction.PaymentTxn(
        sender=CREATOR_ADDR,
        sp=params,
        receiver=escrow_addr,
        amt=205000
    )
    stxn_fund = fund_txn.sign(CREATOR_SK)
    txid_fund = algod_client.send_transaction(stxn_fund)
    _wait_for_confirmation(txid_fund)
    
    # 2. ASA Opt-In signed by LogicSig itself
    params = algod_client.suggested_params()
    optin_txn = transaction.AssetTransferTxn(
        sender=escrow_addr,
        sp=params,
        receiver=escrow_addr,
        amt=0,
        index=asset_id
    )
    stxn_optin = transaction.LogicSigTransaction(optin_txn, lsig)
    txid_optin = algod_client.send_transaction(stxn_optin)
    _wait_for_confirmation(txid_optin)

def create_escrow_contract(buyer_addr: str, seller_addr: str, asset_id: int, amount_algo: float) -> Dict[str, str]:
    """Generates the TEAL contract and returns its metadata"""
    amount_microalgos = int(amount_algo * 1_000_000)
    lsig = get_compiled_escrow(buyer_addr, seller_addr, asset_id, amount_microalgos)
    
    # Prep it for the blockchain
    fund_and_optin_lsig(lsig, asset_id)
    
    encoded_bytes = base64.b64encode(lsig.lsig.logic).decode('utf-8')
    
    return {
        "address": lsig.address(),
        "compiled_teal": encoded_bytes
    }

def get_escrow_details(escrow_id: str) -> Dict[str, Any]:
    """Fetch an escrow from the database."""
    res = supabase.table("escrows").select("*").eq("id", escrow_id).single().execute()
    if not res.data:
        raise ValueError(f"Escrow {escrow_id} not found")
    
    return res.data

def update_escrow_status(escrow_id: str, updates: Dict[str, Any]):
    """Update escrow columns."""
    supabase.table("escrows").update(updates).eq("id", escrow_id).execute()

def simulate_lock_token(escrow_id: str):
    """
    For backend testing: mints an identical ASA or transfers directly from creator
    to the Escrow address to satisfy Smart Contract holding requirements.
    """
    escrow = get_escrow_details(escrow_id)
    asset_id = int(escrow["asset_id"])
    escrow_addr = escrow["escrow_address"]
    
    params = algod_client.suggested_params()
    
    # In a fully integrated workflow, seller signs this. Here we force it from creator for test.
    # Note: If creator holds it! 
    # If not, execution will fail, but since creator minted the testing ASAs, it usually works.
    try:
        xfer_txn = transaction.AssetTransferTxn(
            sender=CREATOR_ADDR,
            sp=params,
            receiver=escrow_addr,
            amt=1,
            index=asset_id
        )
        stxn = xfer_txn.sign(CREATOR_SK)
        txid = algod_client.send_transaction(stxn)
        _wait_for_confirmation(txid)
    except Exception as e:
        print(f"Simulation force mock warning (creator lacks asset): {e}")
        
    update_escrow_status(escrow_id, {"token_locked": True, "status": "token_locked"})
    check_settlement(escrow_id)

def simulate_lock_payment(escrow_id: str):
    """
    For backend testing: transfers ALGO from creator to Escrow address
    to satisfy Smart Contract capital requirements.
    """
    escrow = get_escrow_details(escrow_id)
    amount_microalgos = int(float(escrow["amount"]) * 1_000_000)
    escrow_addr = escrow["escrow_address"]
    
    params = algod_client.suggested_params()
    xfer_txn = transaction.PaymentTxn(
        sender=CREATOR_ADDR,
        sp=params,
        receiver=escrow_addr,
        amt=amount_microalgos
    )
    try:
        stxn = xfer_txn.sign(CREATOR_SK)
        txid = algod_client.send_transaction(stxn)
        _wait_for_confirmation(txid)
    except Exception as e:
        print(f"Simulation force mock warning (capital failure): {e}")
    
    update_escrow_status(escrow_id, {"payment_locked": True, "status": "payment_locked"})
    check_settlement(escrow_id)

def build_lock_token_txn_b64(escrow_id: str) -> str:
    """
    Builds an unsigned AssetTransferTxn for the SELLER to send the ASA
    to the escrow address.
    Returns Base64-encoded msgpack bytes ready for Pera Wallet signing.
    """
    escrow = get_escrow_details(escrow_id)
    asset_id = int(escrow["asset_id"])
    escrow_addr = escrow["escrow_address"]
    seller_addr = escrow["seller_wallet"]
    
    params = algod_client.suggested_params()
    
    # Transfer ASA from SELLER → Escrow
    xfer_txn = transaction.AssetTransferTxn(
        sender=seller_addr,
        sp=params,
        receiver=escrow_addr,
        amt=1,
        index=asset_id
    )
    
    # msgpack_encode returns a base64 string of raw msgpack bytes
    return encoding.msgpack_encode(xfer_txn)

def check_if_opted_in(addr: str, asset_id: int) -> bool:
    try:
        algod_client.account_asset_info(addr, asset_id)
        return True
    except Exception as e:
        return False

def build_lock_payment_txn_b64(escrow_id: str) -> list:
    """
    Builds grouped unsigned transactions: ASA Opt-In + ALGO Payment
    Returns list of Base64-encoded msgpack bytes for Pera Wallet.
    """
    escrow = get_escrow_details(escrow_id)
    amount_microalgos = int(float(escrow["amount"]) * 1_000_000)
    escrow_addr = escrow["escrow_address"]
    buyer_addr = escrow["buyer_wallet"]
    asset_id = int(escrow["asset_id"])
    
    params = algod_client.suggested_params()
    
    # PAYMENT Transaction
    txn_pay = transaction.PaymentTxn(
        sender=buyer_addr,
        sp=params,
        receiver=escrow_addr,
        amt=amount_microalgos
    )
    
    needs_opt_in = not check_if_opted_in(buyer_addr, asset_id)

    if needs_opt_in:
        # OPT-IN Transaction
        txn_opt = transaction.AssetTransferTxn(
            sender=buyer_addr,
            sp=params,
            receiver=buyer_addr, # Self receive for opt-in
            amt=0,
            index=asset_id
        )
        
        gid = transaction.calculate_group_id([txn_opt, txn_pay])
        txn_opt.group = gid
        txn_pay.group = gid
        
        return [
            encoding.msgpack_encode(txn_opt),
            encoding.msgpack_encode(txn_pay)
        ]
    else:
        return [
            encoding.msgpack_encode(txn_pay)
        ]

def submit_signed_lock(escrow_id: str, signed_b64: str, lock_type: str):
    """Takes a Pera-signed msgpack transaction, submits it, and triggers settlement."""
    print("DEBUG submit_signed_lock -> len:", len(str(signed_b64)))
    
    # Actually submit to the network (expects Base64!)
    txid = algod_client.send_raw_transaction(signed_b64)
    _wait_for_confirmation(txid)
    
    # Update DB based on token vs payment
    if lock_type == "token":
        update_escrow_status(escrow_id, {"token_locked": True, "status": "token_locked"})
    elif lock_type == "payment":
        update_escrow_status(escrow_id, {"payment_locked": True, "status": "payment_locked"})
        
    check_settlement(escrow_id)

def check_settlement(escrow_id: str):
    """If both locked, execute atomic swap via deployed Smart Contract!"""
    escrow = get_escrow_details(escrow_id)
    if escrow["token_locked"] and escrow["payment_locked"] and escrow["status"] != "settled":
        execute_atomic_swap(escrow)

def execute_atomic_swap(escrow: Dict[str, Any]):
    """
    Executes the stateless smart contract group constraint!
    This will mathematically fail if conditions defined in PyTeal are violated.
    """
    program_bytes = base64.b64decode(escrow["escrow_mnemonic"]) # We repurposed this column for the TEAL
    lsig = transaction.LogicSigAccount(program_bytes)
    escrow_addr = lsig.address()
    
    buyer_wallet = escrow["buyer_wallet"]
    seller_wallet = escrow["seller_wallet"]
    asset_id = int(escrow["asset_id"])
    amount_microalgos = int(float(escrow["amount"]) * 1_000_000)
    
    params = algod_client.suggested_params()
    
    # Txn 0: ASA to Buyer
    tx0 = transaction.AssetTransferTxn(
        sender=escrow_addr,
        sp=params,
        receiver=buyer_wallet,
        amt=1,
        index=asset_id
    )
    
    # Txn 1: ALGO to Seller
    tx1 = transaction.PaymentTxn(
        sender=escrow_addr,
        sp=params,
        receiver=seller_wallet,
        amt=amount_microalgos
    )
    
    # Group them together!
    gid = transaction.calculate_group_id([tx0, tx1])
    tx0.group = gid
    tx1.group = gid
    
    # LogicSig signs both!
    stx0 = transaction.LogicSigTransaction(tx0, lsig)
    stx1 = transaction.LogicSigTransaction(tx1, lsig)
    
    # Fire off to Algorand network
    txid = algod_client.send_transactions([stx0, stx1])
    _wait_for_confirmation(txid)
    
    # Update DB statuses upon successful validation by node
    update_escrow_status(escrow["id"], {
        "status": "settled",
        "updated_at": datetime.utcnow().isoformat()
    })
    
    supabase.table("buy_requests").update({"status": "settled"}).eq("id", escrow["buy_request_id"]).execute()
    
    req = supabase.table("buy_requests").select("listing_id").eq("id", escrow["buy_request_id"]).single().execute()
    if req.data:
        listing_id = req.data["listing_id"]
        supabase.table("property_listings").update({"status": "sold"}).eq("id", listing_id).execute()
