"""
BlockEstate — Flask Application Entry Point
Blueprint-based modular architecture.
"""

import os
import sys

# Ensure backend/ is on the path so models/routes/services resolve correctly
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # ── Register Blueprints ──────────────────────────────────────────────
    from routes.kyc          import kyc_bp
    from routes.listings     import listings_bp
    from routes.land_records import land_records_bp
    from routes.buy_requests import buy_requests_bp
    from routes.admin        import admin_bp

    app.register_blueprint(kyc_bp)
    app.register_blueprint(listings_bp)
    app.register_blueprint(land_records_bp)
    app.register_blueprint(buy_requests_bp)
    app.register_blueprint(admin_bp)

    # ── Health check ────────────────────────────────────────────────────
    @app.route("/api/health", methods=["GET"])
    def health():
        return {"status": "ok", "version": "2.0.0"}

    return app


if __name__ == "__main__":
    from models.db import init_db
    init_db()

    # Seed mock land records on first run
    from seed import seed_land_records
    seed_land_records()

    from services.algorand_service import admin_address
    print(f"[OK] Admin address : {admin_address}")
    print(f"[OK] DB path       : {os.path.join(os.path.dirname(__file__), 'blockestate.db')}")
    print(f"[OK] Server        : http://localhost:5000")

    app = create_app()
    app.run(debug=True, port=5000)