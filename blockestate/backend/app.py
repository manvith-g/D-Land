"""
BlockEstate - Flask Backend
Storage: SQLite (persistent across restarts)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod, indexer
from algosdk.logic import get_application_address
import base64, json, os, uuid, sqlite3
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)

ALGOD_ADDRESS   = os.getenv("ALGOD_ADDRESS", "https://testnet-api.algonode.cloud")
ALGOD_TOKEN     = os.getenv("ALGOD_TOKEN", "")
INDEXER_ADDRESS = "https://testnet-idx.algonode.cloud"

client         = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
indexer_client = indexer.IndexerClient("", INDEXER_ADDRESS)

ADMIN_MNEMONIC = os.getenv("ADMIN_MNEMONIC")
admin_pk       = mnemonic.to_private_key(ADMIN_MNEMONIC) if ADMIN_MNEMONIC else None
admin_address  = account.address_from_private_key(admin_pk) if admin_pk else None

DB_PATH = os.path.join(os.path.dirname(__file__), "blockestate.db")


# ─────────────────────────────────────────────
# SQLite setup
# ─────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS listings (
            id              TEXT PRIMARY KEY,
            property_id     TEXT,
            location        TEXT,
            price_microalgo INTEGER,
            commission_pct  INTEGER,
            broker_address  TEXT,
            ipfs_hash       TEXT,
            seller_address  TEXT,
            image           TEXT,
            status          TEXT DEFAULT 'pending',
            asset_id        INTEGER,
            app_id          INTEGER,
            app_address     TEXT,
            state           TEXT DEFAULT 'listed',
            mint_txid       TEXT,
            deploy_txid     TEXT
        )
    """)
    conn.commit()
    conn.close()


def row_to_dict(row):
    return dict(row) if row else None


def get_all_listings():
    conn = get_db()
    rows = conn.execute("SELECT * FROM listings").fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


def get_listing_by_id(listing_id):
    conn = get_db()
    row  = conn.execute("SELECT * FROM listings WHERE id=?", (listing_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


def get_listing_by_property_id(property_id):
    conn = get_db()
    row  = conn.execute("SELECT * FROM listings WHERE LOWER(property_id)=?", (property_id.lower(),)).fetchone()
    conn.close()
    return row_to_dict(row)


def get_listing_by_asset_id(asset_id):
    conn = get_db()
    row  = conn.execute("SELECT * FROM listings WHERE asset_id=?", (asset_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


def insert_listing(listing):
    conn = get_db()
    conn.execute("""
        INSERT INTO listings (id, property_id, location, price_microalgo, commission_pct,
            broker_address, ipfs_hash, seller_address, image, status, asset_id, app_id,
            app_address, state, mint_txid, deploy_txid)
        VALUES (:id, :property_id, :location, :price_microalgo, :commission_pct,
            :broker_address, :ipfs_hash, :seller_address, :image, :status, :asset_id, :app_id,
            :app_address, :state, :mint_txid, :deploy_txid)
    """, listing)
    conn.commit()
    conn.close()


def update_listing(listing_id, **kwargs):
    fields = ", ".join(f"{k}=?" for k in kwargs)
    values = list(kwargs.values()) + [listing_id]
    conn   = get_db()
    conn.execute(f"UPDATE listings SET {fields} WHERE id=?", values)
    conn.commit()
    conn.close()


# ─────────────────────────────────────────────
# ALGORAND HELPERS
# ─────────────────────────────────────────────
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


def mint_asa(location, property_id, ipfs_hash, seller_addr):
    sp      = client.suggested_params()
    mint_txn = transaction.AssetConfigTxn(
        sender         = admin_address,
        sp             = sp,
        default_frozen = False,
        unit_name      = "PROP",
        asset_name     = f"Property-{property_id}",
        manager        = admin_address,
        reserve        = admin_address,
        freeze         = admin_address,
        clawback       = admin_address,
        url            = f"ipfs://{ipfs_hash}",
        total          = 1,
        decimals       = 0,
        note           = json.dumps({
            "property_id": property_id,
            "location":    location,
            "seller":      seller_addr,
            "ipfs":        ipfs_hash
        }).encode(),
    )
    signed      = mint_txn.sign(admin_pk)
    txid        = client.send_transaction(signed)
    result      = wait_for_confirmation(txid)
    return result["asset-index"], txid


def deploy_contract(seller_address, broker_address, asset_id, price, commission_pct):
    approval_path = os.path.join(os.path.dirname(__file__), "../contracts/build/approval.teal")
    clear_path    = os.path.join(os.path.dirname(__file__), "../contracts/build/clear.teal")

    with open(approval_path) as f:
        approval_program = compile_teal(f.read())
    with open(clear_path) as f:
        clear_program = compile_teal(f.read())

    sp            = client.suggested_params()
    global_schema = transaction.StateSchema(num_uints=4, num_byte_slices=3)
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
        accounts         = [broker_address],
        foreign_assets   = [asset_id],
    )
    signed = txn.sign(admin_pk)
    txid   = client.send_transaction(signed)
    result = wait_for_confirmation(txid)
    app_id      = result["application-index"]
    app_address = get_application_address(app_id)
    return app_id, app_address, txid


def get_asset_current_owner(asset_id):
    try:
        balances = indexer_client.asset_balances(asset_id)
        for b in balances.get("balances", []):
            if b["amount"] == 1:
                return b["address"]
        return None
    except Exception:
        return None


def get_asset_tx_history(asset_id):
    try:
        txns    = indexer_client.search_asset_transactions(asset_id=asset_id, txn_type="axfer")
        history = []
        for t in txns.get("transactions", [])[:10]:
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


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────

@app.route("/api/admin/info", methods=["GET"])
def admin_info():
    return jsonify({"admin_address": admin_address, "connected": admin_address is not None})


@app.route("/api/listings", methods=["GET"])
def get_listings():
    all_listings = get_all_listings()
    approved     = [l for l in all_listings if l["status"] == "approved"]
    return jsonify({"listings": approved})


@app.route("/api/admin/listings", methods=["GET"])
def get_admin_listings():
    return jsonify({"listings": get_all_listings()})


@app.route("/api/listings", methods=["POST"])
def submit_listing():
    data    = request.json
    listing = {
        "id":              str(uuid.uuid4()),
        "property_id":     data["property_id"],
        "location":        data["location"],
        "price_microalgo": data["price_microalgo"],
        "commission_pct":  data["commission_pct"],
        "broker_address":  data["broker_address"],
        "ipfs_hash":       data.get("ipfs_hash", "QmTest123"),
        "seller_address":  data["seller_address"],
        "image":           data.get("image", "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400"),
        "status":          "pending",
        "asset_id":        None,
        "app_id":          None,
        "app_address":     None,
        "state":           "listed",
        "mint_txid":       None,
        "deploy_txid":     None,
    }
    insert_listing(listing)
    return jsonify({"success": True, "listing": listing})


@app.route("/api/admin/approve/<listing_id>", methods=["POST"])
def approve_listing(listing_id):
    listing = get_listing_by_id(listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404
    if listing["status"] == "approved":
        return jsonify({"error": "Already approved"}), 400

    try:
        asset_id, mint_txid = mint_asa(
            location    = listing["location"],
            property_id = listing["property_id"],
            ipfs_hash   = listing["ipfs_hash"],
            seller_addr = listing["seller_address"],
        )
        app_id, app_address, deploy_txid = deploy_contract(
            seller_address = listing["seller_address"],
            broker_address = listing["broker_address"],
            asset_id       = asset_id,
            price          = listing["price_microalgo"],
            commission_pct = listing["commission_pct"],
        )
        update_listing(listing_id,
            status      = "approved",
            asset_id    = asset_id,
            app_id      = app_id,
            app_address = app_address,
            mint_txid   = mint_txid,
            deploy_txid = deploy_txid,
        )
        return jsonify({
            "success":      True,
            "asset_id":     asset_id,
            "app_id":       app_id,
            "app_address":  app_address,
            "seller_proof": f"https://lora.algokit.io/testnet/asset/{asset_id}",
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/reject/<listing_id>", methods=["POST"])
def reject_listing(listing_id):
    listing = get_listing_by_id(listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404
    update_listing(listing_id, status="rejected")
    return jsonify({"success": True})


@app.route("/api/verify/<search_term>", methods=["GET"])
def verify_ownership(search_term):
    listing = get_listing_by_property_id(search_term)
    if not listing:
        try:
            listing = get_listing_by_asset_id(int(search_term))
        except ValueError:
            pass

    if not listing:
        return jsonify({"found": False, "message": "Property not found"}), 404

    if listing["status"] != "approved":
        return jsonify({"found": True, "status": listing["status"], "message": "Not yet on-chain"})

    asset_id      = listing["asset_id"]
    current_owner = get_asset_current_owner(asset_id)
    tx_history    = get_asset_tx_history(asset_id)
    is_sold       = current_owner and current_owner != listing["seller_address"] and current_owner != admin_address

    return jsonify({
        "found":               True,
        "property_id":         listing["property_id"],
        "location":            listing["location"],
        "asset_id":            asset_id,
        "app_id":              listing["app_id"],
        "seller_address":      listing["seller_address"],
        "current_owner":       current_owner,
        "is_sold":             is_sold,
        "ownership_status":    "SOLD 🔴" if is_sold else "AVAILABLE 🟢",
        "price_algo":          listing["price_microalgo"] / 1_000_000,
        "ipfs_hash":           listing["ipfs_hash"],
        "explorer_url":        f"https://lora.algokit.io/testnet/asset/{asset_id}",
        "transaction_history": tx_history,
    })


@app.route("/api/contract/<int:app_id>/state", methods=["GET"])
def get_contract_state(app_id):
    app_info     = client.application_info(app_id)
    global_state = {}
    state_map    = {0: "listed", 1: "in_escrow", 2: "sold"}
    for kv in app_info["params"].get("global-state", []):
        key   = base64.b64decode(kv["key"]).decode("utf-8", errors="ignore")
        value = kv["value"]
        if value["type"] == 1:
            global_state[key] = base64.b64decode(value["bytes"]).hex()
        else:
            global_state[key] = state_map.get(value["uint"], value["uint"]) if key == "state" else value["uint"]
    return jsonify({"app_id": app_id, "state": global_state})


if __name__ == "__main__":
    init_db()
    print(f"✅ Admin address: {admin_address}")
    print(f"✅ Database: {DB_PATH}")
    app.run(debug=True, port=5000)