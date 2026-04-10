"""
main.py  –  Flask REST API for D-Land tokenisation
───────────────────────────────────────────────────
POST /api/tokenise
  Body (JSON):
    {
      "rera_id":          "PRM/KA/RERA/...",
      "seller_mnemonic":  "word1 word2 ... word25"
    }

  Returns:
    {
      "success": true,
      "data": {
        "rera_id": "...",
        "seller_wallet": "ALGO...",
        "ipfs_hash": "Qm...",
        "ipfs_url": "https://gateway.pinata.cloud/ipfs/Qm...",
        "no_of_flats": 15,
        "assets": [
          {"asset_id": 123456, "flat_index": 1},
          ...
        ]
      }
    }
"""

from flask import Flask, request, jsonify # Correct
from flask_cors import CORS
from dotenv import load_dotenv

# Load .env BEFORE any module that reads os.environ
load_dotenv()

from rera_token_create import tokenise_rera, fetch_rera_record  # noqa: E402

app = Flask(__name__)
CORS(app)


@app.route("/api/verify", methods=["POST"])
def verify():
    """
    Verify a RERA ID exists in the database.
    Expects JSON body with:
      - rera_id (str)
    """
    body = request.get_json(force=True, silent=True)
    if not body:
        return jsonify({"success": False, "error": "Request body must be JSON"}), 400

    rera_id = body.get("rera_id", "").strip()
    if not rera_id:
        return jsonify({"success": False, "error": "rera_id is required"}), 400

    try:
        record = fetch_rera_record(rera_id)
        return jsonify({"success": True, "data": record}), 200
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 404
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500

@app.route("/api/tokenise", methods=["POST"])
def tokenise():
    """
    Tokenise a RERA-registered property.

    Expects JSON body with:
      - rera_id          (str)  – RERA registration string
      - seller_mnemonic  (str)  – 25-word Algorand mnemonic of the seller
    """
    body = request.get_json(force=True, silent=True)
    if not body:
        return jsonify({"success": False, "error": "Request body must be JSON"}), 400

    rera_id = body.get("rera_id", "").strip()
    seller_mnemonic = body.get("seller_mnemonic", "").strip()

    # ── validation ──────────────────────────────
    if not rera_id:
        return jsonify({"success": False, "error": "rera_id is required"}), 400
    if not seller_mnemonic:
        return jsonify({"success": False, "error": "seller_mnemonic is required"}), 400

    try:
        result = tokenise_rera(rera_id, seller_mnemonic)
        return jsonify({"success": True, "data": result}), 201
    except ValueError as exc:
        # Record-not-found or validation issues
        return jsonify({"success": False, "error": str(exc)}), 404
    except Exception as exc:
        # Pinata / Algorand / unexpected errors
        return jsonify({"success": False, "error": str(exc)}), 500


# ── health check ──────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
