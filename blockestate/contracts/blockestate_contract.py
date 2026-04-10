"""
BlockEstate Smart Contract v2 — PyTeal
Handles: Property listing, buy request acceptance, escrow, ownership transfer, broker commission.

State machine:
  0 = listed         (ASA in contract, accepting buy requests)
  1 = request_accepted (seller accepted a buyer, awaiting payment confirmation by platform)
  2 = in_settlement   (payment received, completing transfer)
  3 = sold            (ASA transferred to buyer)
  4 = cancelled       (listing withdrawn)

New in v2:
  - state 1 (request_accepted) — seller locks in a buyer before payment
  - freeze_request  action — seller accepts buyer, records buyer address
  - release_to_buyer action — platform triggers final transfer after payment
  - reject_request  action — seller rejects, resets to listed
"""

from pyteal import *


def approval_program():
    # ── Global State Keys ──────────────────────────────────────────────
    seller_key       = Bytes("seller")
    buyer_key        = Bytes("buyer")
    asset_id_key     = Bytes("asset_id")
    price_key        = Bytes("price")
    broker_key       = Bytes("broker")
    commission_key   = Bytes("commission_pct")
    state_key        = Bytes("state")
    request_id_key   = Bytes("request_id")   # NEW: off-chain buy_request UUID

    # ── State constants ────────────────────────────────────────────────
    STATE_LISTED   = Int(0)
    STATE_ACCEPTED = Int(1)
    STATE_SETTLING = Int(2)
    STATE_SOLD     = Int(3)
    STATE_CANCELLED= Int(4)

    # ─────────────────────────────────────────────────────────────────
    # ACTION: create  (called on app create)
    # accounts[1] = broker wallet
    # assets[0]   = ASA (property token)
    # args[1]     = price in microALGO (8 bytes big-endian)
    # args[2]     = commission % integer
    # ─────────────────────────────────────────────────────────────────
    on_create = Seq([
        Assert(Txn.application_args.length() == Int(3)),
        App.globalPut(seller_key,     Txn.sender()),
        App.globalPut(broker_key,     Txn.accounts[1]),
        App.globalPut(asset_id_key,   Txn.assets[0]),
        App.globalPut(price_key,      Btoi(Txn.application_args[1])),
        App.globalPut(commission_key, Btoi(Txn.application_args[2])),
        App.globalPut(state_key,      STATE_LISTED),
        Approve(),
    ])

    # ─────────────────────────────────────────────────────────────────
    # ACTION: opt_in_asset — contract self opt-in to hold the ASA
    # ─────────────────────────────────────────────────────────────────
    opt_in_asset = Seq([
        Assert(App.globalGet(state_key) == STATE_LISTED),
        Assert(Txn.sender() == App.globalGet(seller_key)),
        InnerTxnBuilder.Execute({
            TxnField.type_enum:      TxnType.AssetTransfer,
            TxnField.asset_receiver: Global.current_application_address(),
            TxnField.xfer_asset:     App.globalGet(asset_id_key),
            TxnField.asset_amount:   Int(0),
            TxnField.fee:            Int(0),
        }),
        Approve(),
    ])

    # ─────────────────────────────────────────────────────────────────
    # ACTION: deposit_asset — seller transfers ASA into the escrow
    # Must be grouped: [AppCall, AssetTransfer]
    # ─────────────────────────────────────────────────────────────────
    deposit_asset = Seq([
        Assert(App.globalGet(state_key) == STATE_LISTED),
        Assert(Txn.sender() == App.globalGet(seller_key)),
        Assert(Gtxn[1].type_enum()      == TxnType.AssetTransfer),
        Assert(Gtxn[1].asset_receiver() == Global.current_application_address()),
        Assert(Gtxn[1].xfer_asset()     == App.globalGet(asset_id_key)),
        Assert(Gtxn[1].asset_amount()   >= Int(1)),
        Approve(),
    ])

    # ─────────────────────────────────────────────────────────────────
    # ACTION: freeze_request (NEW)
    # Seller accepts a buyer's request.
    # accounts[1] = buyer wallet
    # args[1]     = request_id (bytes, off-chain UUID for traceability)
    # ─────────────────────────────────────────────────────────────────
    freeze_request = Seq([
        Assert(App.globalGet(state_key) == STATE_LISTED),
        Assert(Txn.sender() == App.globalGet(seller_key)),
        Assert(Txn.application_args.length() >= Int(2)),
        App.globalPut(buyer_key,      Txn.accounts[1]),
        App.globalPut(request_id_key, Txn.application_args[1]),
        App.globalPut(state_key,      STATE_ACCEPTED),
        Approve(),
    ])

    # ─────────────────────────────────────────────────────────────────
    # ACTION: reject_request (NEW)
    # Seller rejects accepted request — reset back to listed
    # ─────────────────────────────────────────────────────────────────
    reject_request = Seq([
        Assert(App.globalGet(state_key) == STATE_ACCEPTED),
        Assert(Txn.sender() == App.globalGet(seller_key)),
        App.globalPut(buyer_key,    Bytes("")),
        App.globalPut(request_id_key, Bytes("")),
        App.globalPut(state_key,    STATE_LISTED),
        Approve(),
    ])

    # ─────────────────────────────────────────────────────────────────
    # ACTION: release_to_buyer (NEW — replaces old complete_transfer)
    # Platform/admin confirms payment → sends ASA to buyer + pays parties
    # accounts[1] = seller, accounts[2] = buyer, accounts[3] = broker
    # ─────────────────────────────────────────────────────────────────
    price             = App.globalGet(price_key)
    commission_pct    = App.globalGet(commission_key)
    commission_amount = price * commission_pct / Int(100)
    seller_amount     = price - commission_amount

    release_to_buyer = Seq([
        Assert(App.globalGet(state_key) == STATE_ACCEPTED),
        Assert(Txn.sender() == App.globalGet(seller_key)),

        # 1. Transfer ASA to buyer
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum:      TxnType.AssetTransfer,
            TxnField.xfer_asset:     App.globalGet(asset_id_key),
            TxnField.asset_amount:   Int(1),
            TxnField.asset_receiver: App.globalGet(buyer_key),
            TxnField.fee:            Int(0),
        }),
        InnerTxnBuilder.Next(),

        # 2. Pay broker commission
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver:  App.globalGet(broker_key),
            TxnField.amount:    commission_amount,
            TxnField.fee:       Int(0),
        }),
        InnerTxnBuilder.Next(),

        # 3. Pay seller
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver:  App.globalGet(seller_key),
            TxnField.amount:    seller_amount,
            TxnField.fee:       Int(0),
        }),
        InnerTxnBuilder.Submit(),

        App.globalPut(state_key, STATE_SOLD),
        Approve(),
    ])

    # ─────────────────────────────────────────────────────────────────
    # ACTION: complete_transfer (legacy alias → release_to_buyer)
    # ─────────────────────────────────────────────────────────────────
    complete_transfer = release_to_buyer

    # ─────────────────────────────────────────────────────────────────
    # ACTION: cancel — seller withdraws listing
    # Returns ASA; if in STATE_ACCEPTED, resets buyer slot
    # ─────────────────────────────────────────────────────────────────
    on_cancel = Seq([
        Assert(Txn.sender() == App.globalGet(seller_key)),
        Assert(App.globalGet(state_key) != STATE_SOLD),

        # Return ASA to seller
        InnerTxnBuilder.Execute({
            TxnField.type_enum:      TxnType.AssetTransfer,
            TxnField.xfer_asset:     App.globalGet(asset_id_key),
            TxnField.asset_amount:   Int(1),
            TxnField.asset_receiver: App.globalGet(seller_key),
            TxnField.fee:            Int(0),
        }),

        App.globalPut(state_key,   STATE_CANCELLED),
        Approve(),
    ])

    # ── Router ─────────────────────────────────────────────────────────
    action = Txn.application_args[0]

    program = Cond(
        [Txn.application_id() == Int(0),          on_create],
        [action == Bytes("opt_in_asset"),          opt_in_asset],
        [action == Bytes("deposit_asset"),         deposit_asset],
        [action == Bytes("freeze_request"),        freeze_request],
        [action == Bytes("reject_request"),        reject_request],
        [action == Bytes("release_to_buyer"),      release_to_buyer],
        [action == Bytes("complete_transfer"),     complete_transfer],
        [action == Bytes("cancel"),                on_cancel],
    )

    return program


def clear_program():
    return Approve()


if __name__ == "__main__":
    import os
    from pyteal import compileTeal, Mode

    approval = compileTeal(approval_program(), mode=Mode.Application, version=8)
    clear    = compileTeal(clear_program(),    mode=Mode.Application, version=8)

    os.makedirs("build", exist_ok=True)
    with open("build/approval.teal", "w") as f:
        f.write(approval)
    with open("build/clear.teal", "w") as f:
        f.write(clear)

    print("[OK] Compiled: build/approval.teal & build/clear.teal")
