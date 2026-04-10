"""
BlockEstate Smart Contract - PyTeal
Handles: Property listing, escrow, ownership transfer, broker commission
"""

from pyteal import *


def approval_program():
    # ── Global State Keys ──
    seller_key       = Bytes("seller")
    buyer_key        = Bytes("buyer")
    asset_id_key     = Bytes("asset_id")
    price_key        = Bytes("price")
    broker_key       = Bytes("broker")
    commission_key   = Bytes("commission_pct")   # e.g. 5 = 5%
    state_key        = Bytes("state")             # 0=listed, 1=in_escrow, 2=sold

    # ── App call transaction argument positions ──
    # Args[0] = action string

    # ─────────────────────────────────────────────
    # ACTION: create  (called on app create)
    # Txn.accounts[1] = broker wallet
    # Txn.assets[0]   = ASA (property token)
    # Args[1]         = price in microALGO
    # Args[2]         = commission % (integer)
    # ─────────────────────────────────────────────
    on_create = Seq([
        Assert(Txn.application_args.length() == Int(3)),
        App.globalPut(seller_key,     Txn.sender()),
        App.globalPut(broker_key,     Txn.accounts[1]),
        App.globalPut(asset_id_key,   Txn.assets[0]),
        App.globalPut(price_key,      Btoi(Txn.application_args[1])),
        App.globalPut(commission_key, Btoi(Txn.application_args[2])),
        App.globalPut(state_key,      Int(0)),
        Approve(),
    ])

    # ─────────────────────────────────────────────
    # ACTION: opt_in_asset
    # Contract opts itself into the ASA so it can hold it
    # ─────────────────────────────────────────────
    opt_in_asset = Seq([
        Assert(App.globalGet(state_key) == Int(0)),
        Assert(Txn.sender() == App.globalGet(seller_key)),
        InnerTxnBuilder.Execute({
            TxnField.type_enum:    TxnType.AssetTransfer,
            TxnField.asset_receiver: Global.current_application_address(),
            TxnField.xfer_asset:   App.globalGet(asset_id_key),
            TxnField.asset_amount: Int(0),   # opt-in = 0 amount self transfer
            TxnField.fee:          Int(0),
        }),
        Approve(),
    ])

    # ─────────────────────────────────────────────
    # ACTION: deposit_asset
    # Seller transfers ASA into the contract escrow
    # (Grouped with an AssetTransfer txn)
    # ─────────────────────────────────────────────
    deposit_asset = Seq([
        Assert(App.globalGet(state_key) == Int(0)),
        Assert(Txn.sender() == App.globalGet(seller_key)),
        Assert(Gtxn[1].type_enum()      == TxnType.AssetTransfer),
        Assert(Gtxn[1].asset_receiver() == Global.current_application_address()),
        Assert(Gtxn[1].xfer_asset()     == App.globalGet(asset_id_key)),
        Assert(Gtxn[1].asset_amount()   == Int(1)),
        Approve(),
    ])

    # ─────────────────────────────────────────────
    # ACTION: buy
    # Buyer sends ALGO payment (grouped with a PaymentTxn)
    # Contract locks funds → state = in_escrow
    # ─────────────────────────────────────────────
    price       = App.globalGet(price_key)
    on_buy = Seq([
        Assert(App.globalGet(state_key) == Int(0)),
        Assert(Txn.sender() != App.globalGet(seller_key)),       # seller can't buy own property
        Assert(Gtxn[1].type_enum()      == TxnType.Payment),
        Assert(Gtxn[1].receiver()       == Global.current_application_address()),
        Assert(Gtxn[1].amount()         >= price),
        App.globalPut(buyer_key, Txn.sender()),
        App.globalPut(state_key, Int(1)),                        # in_escrow
        Approve(),
    ])

    # ─────────────────────────────────────────────
    # ACTION: complete_transfer
    # Called by seller after buyer paid
    # Contract:
    #   1. Sends ASA → buyer
    #   2. Sends commission ALGO → broker
    #   3. Sends remaining ALGO → seller
    # ─────────────────────────────────────────────
    commission_pct    = App.globalGet(commission_key)
    commission_amount = price * commission_pct / Int(100)
    seller_amount     = price - commission_amount

    on_complete = Seq([
        Assert(App.globalGet(state_key) == Int(1)),
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

        App.globalPut(state_key, Int(2)),   # sold
        Approve(),
    ])

    # ─────────────────────────────────────────────
    # ACTION: cancel
    # Seller cancels listing → returns ASA + refunds buyer if in escrow
    # ─────────────────────────────────────────────
    on_cancel = Seq([
        Assert(Txn.sender() == App.globalGet(seller_key)),
        Assert(App.globalGet(state_key) != Int(2)),              # can't cancel sold

        # If in_escrow → refund buyer
        If(App.globalGet(state_key) == Int(1)).Then(
            InnerTxnBuilder.Execute({
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver:  App.globalGet(buyer_key),
                TxnField.amount:    App.globalGet(price_key),
                TxnField.fee:       Int(0),
            })
        ),

        # Return ASA to seller
        InnerTxnBuilder.Execute({
            TxnField.type_enum:      TxnType.AssetTransfer,
            TxnField.xfer_asset:     App.globalGet(asset_id_key),
            TxnField.asset_amount:   Int(1),
            TxnField.asset_receiver: App.globalGet(seller_key),
            TxnField.fee:            Int(0),
        }),

        App.globalPut(state_key, Int(0)),
        Approve(),
    ])

    # ─────────────────────────────────────────────
    # Router
    # ─────────────────────────────────────────────
    action = Txn.application_args[0]

    program = Cond(
        [Txn.application_id() == Int(0),        on_create],
        [action == Bytes("opt_in_asset"),        opt_in_asset],
        [action == Bytes("deposit_asset"),       deposit_asset],
        [action == Bytes("buy"),                 on_buy],
        [action == Bytes("complete_transfer"),   on_complete],
        [action == Bytes("cancel"),              on_cancel],
    )

    return program


def clear_program():
    return Approve()


if __name__ == "__main__":
    import os, json

    approval = compileTeal(approval_program(), mode=Mode.Application, version=8)
    clear    = compileTeal(clear_program(),    mode=Mode.Application, version=8)

    os.makedirs("build", exist_ok=True)
    with open("build/approval.teal", "w") as f:
        f.write(approval)
    with open("build/clear.teal", "w") as f:
        f.write(clear)

    print("✅ Compiled: build/approval.teal & build/clear.teal")
