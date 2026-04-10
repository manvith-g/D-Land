# 🏡 D-Land — Tokenized Real Estate Marketplace on Algorand

D-Land is an OLX-style property marketplace where every listing is backed by a **government-verified land record** and represented as an **Algorand Standard Asset (ASA)** held inside a **smart-contract escrow**. Think of buying a property here like buying a stock on Groww — you send money to the platform, it confirms the payment, then automatically releases the token to your wallet and the INR to the seller.

---

## 🧭 How It Works — Full User Journey

### Step 0 — KYC Gate (Required for Everyone)

When you first visit the website, a **KYC Modal** blocks all actions. You must:

1. **Connect your Algorand wallet** (currently a manual prompt; Pera/Defly SDK ready to plug in)
2. **Enter your Identity Details** (Full Name, Aadhaar, PAN, Phone)
3. The backend **hashes your Aadhaar using SHA-256** and never stores the raw number
4. Your wallet is marked `kyc_status = "verified"` in the database
5. You can now list properties or send buy requests

**Test KYC credentials:**
| Survey Number | Owner Name | Aadhaar to use |
|---|---|---|
| `KA-BLR-042-127` | Ramesh Kumar Gowda | `123456789012` |
| `KA-BLR-011-042` | Demo Seller | `111122223333` |
| `KA-MYS-017-089` | Sunita Nagaraj | `234567890123` |

> The ownership check hashes the Aadhaar you entered during KYC and compares it to the pre-hashed Aadhaar in the land record. Real Aadhaar = real match.

---

### 🟢 Seller Flow

**Tab: "List Property" in Seller Dashboard**

```
Enter Survey # → Lookup → Verify Ownership → Fill Form → Submit → Auto Mint & Escrow
```

**Step 1 — Enter Survey Number or RERA ID**
- Example: `KA-BLR-042-127`
- Hits `GET /api/land-records/lookup?q=KA-BLR-042-127`
- Backend returns the official property details from the SQLite database (seeded from mock government data)

**Step 2 — Verify Ownership**
- Hits `POST /api/kyc/verify-ownership` with `{ wallet_address, land_record_id }`
- Backend looks up your KYC Aadhaar hash and compares it to `owner_aadhaar_hash` in the land record
- **If it matches → you are the legal owner → allowed to list**
- **If it doesn't match → rejected** ("Your identity does not match the registered owner")

**Step 3 — Fill Listing Details**
- Title, Description, Price in ALGO (microALGO), Price in INR (display), Commission %, IPFS hash for docs

**Step 4 — Submit → Automatic On-Chain Minting**
- Hits `POST /api/listings`
- Backend:
  1. Creates a database record for the listing
  2. **Mints** an ASA (property token) on Algorand Testnet via admin wallet
  3. **Deploys** the `blockestate_contract.py` escrow smart contract
  4. **Funds** the contract with minimum ALGO for inner transactions
  5. **Opts** the contract into the ASA
  6. **Transfers** the ASA into the escrow contract
  7. Updates listing status to `approved` and state to `listed`

> ⚠️ The auto-mint only works when `ADMIN_MNEMONIC` is set in `.env`. Without it, the listing is created in the DB but skips the on-chain step (the `try/except` catches this gracefully).

---

### 🔵 Buyer Flow

**Marketplace → Property Card → Buy Request → Escrow → Settlement**

**Step 1 — Browse Marketplace**
- `GET /api/listings` returns all `status=approved` listings
- Properties show dual pricing (ALGO + INR), land type, location, encumbrance status

**Step 2 — Send Buy Request**
- Click "Send Buy Request" on any listing
- Opens the `BuyRequestModal` — set price offer and optional message
- Hits `POST /api/buy-requests`
- Backend validates buyer is KYC verified and listing is available
- Request lands in seller's "Incoming Requests" tab

**Step 3 — Seller Accepts or Rejects**
- In Seller Dashboard → "Incoming Requests" tab
- Seller clicks **Accept**: 
  - All other pending requests for this listing are auto-rejected
  - Listing state changes to `in_escrow`
  - Request status becomes `accepted`
- Seller clicks **Reject**: request marked rejected, listing stays open

**Step 4 — Settlement (Groww-style)**
- Buyer needs to send INR payment to the platform
- Platform (or Razorpay webhook in production) calls: `POST /api/buy-requests/<id>/complete`
- Settlement Service:
  1. Calls `complete_transfer` on the Algorand smart contract
  2. Contract inner transaction sends **ASA to buyer wallet**
  3. Contract inner transaction sends **ALGO to seller wallet** (minus commission to broker)
  4. Listing state updated to `sold`
  5. Buy request marked `completed`

---

## 🗂️ Full File Structure

```
blockestate/
│
├── backend/
│   ├── app.py                     🚀 Entry point — starts Flask API on port 5000
│   ├── seed.py                    🌱 Seeds mock Karnataka land records into DB
│   ├── blockestate.db             💾 SQLite database (auto-created on first run)
│   ├── requirements.txt
│   │
│   ├── models/                    📦 Database schema & CRUD helpers
│   │   ├── db.py                  — get_db(), init_db(), row helpers
│   │   ├── user.py                — users + KYC status
│   │   ├── land_record.py         — government property records
│   │   ├── listing.py             — property listings with token/contract data
│   │   └── buy_request.py         — buyer offers and their states
│   │
│   ├── routes/                    🌐 Flask Blueprint API endpoints
│   │   ├── kyc.py                 — /api/kyc/submit, /status, /verify-ownership
│   │   ├── land_records.py        — /api/land-records/lookup, /search
│   │   ├── listings.py            — /api/listings (GET/POST), /seller/<wallet>
│   │   ├── buy_requests.py        — /api/buy-requests (POST), /accept, /reject, /complete
│   │   └── admin.py               — /api/admin/* (approve, reject, verify on-chain)
│   │
│   ├── services/                  🔧 Business logic
│   │   ├── algorand_service.py    — mint_asa(), deploy_escrow_contract(), complete_settlement()
│   │   ├── kyc_service.py         — mock_verify_kyc(), hash_aadhaar(), verify_ownership_match()
│   │   ├── land_record_service.py — lookup_land_record(), format_record_for_frontend()
│   │   └── settlement_service.py  — process_settlement() → triggers on-chain release
│   │
│   └── utils/
│       ├── algorand_helpers.py    — algod client, compile_teal(), wait_for_confirmation()
│       └── validators.py          — validate_required(), is_valid_algo_address()
│
├── contracts/
│   ├── blockestate_contract.py    📜 PyTeal smart contract (5-state escrow machine)
│   └── build/
│       ├── approval.teal          — Compiled approval program
│       └── clear.teal             — Compiled clear state program
│
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx    🔐 Wallet + KYC state across all pages
    │   │
    │   ├── components/
    │   │   ├── KYCModal.jsx       — Full-screen KYC onboarding gate
    │   │   ├── KYCStatusBadge.jsx — Shows verified/pending badge in navbar
    │   │   ├── Navbar.jsx         — Top nav with wallet display
    │   │   ├── PropertyCard.jsx   — OLX-style listing card
    │   │   ├── BuyRequestModal.jsx— Buyer offer form
    │   │   └── SellerRequestCard.jsx — Seller's incoming request with accept/reject
    │   │
    │   ├── pages/
    │   │   ├── LandingPage.jsx    — Hero page for new visitors
    │   │   ├── MarketplacePage.jsx— Browse + filter all listings
    │   │   ├── PropertyDetailPage.jsx — Single property view + buy CTA
    │   │   ├── SellerDashboard.jsx— List / manage / respond to requests
    │   │   └── BuyerDashboard.jsx — Track your buy requests + portfolio
    │   │
    │   └── utils/
    │       └── api.js             — All Axios calls to backend API
    │
    └── index.css                  🎨 Full design system (tokens, components, utilities)
```

---

## 🚀 Running Locally

### 1. Set Up Environment

Create `backend/.env`:
```env
# Leave blank to run without Algorand (minting will be skipped)
ADMIN_MNEMONIC=

# Algorand Testnet (AlgoNode — free, no key needed)
ALGOD_ADDRESS=https://testnet-api.algonode.cloud
ALGOD_TOKEN=
```

> To enable real minting: go to [app.dappflow.org](https://app.dappflow.org), create a testnet wallet, fund it with test ALGO from the faucet, and paste the mnemonic into `ADMIN_MNEMONIC`.

### 2. Start the Backend

```bash
cd blockestate/backend
pip install -r requirements.txt
python app.py
```

Backend starts at **http://localhost:5000**

On first run it will:
- Create `blockestate.db` with all tables
- Seed 7 Karnataka land records with mock ownership data

### 3. Start the Frontend

```bash
cd blockestate/frontend
npm install
npm run dev
```

Frontend starts at **http://localhost:5173**

---

## 🔑 Smart Contract — 5 States

The `blockestate_contract.py` escrow smart contract tracks every property through these states:

```
0 = listed          ASA is locked in the contract. Open for buy requests.
1 = request_accepted Seller accepted a buyer. Token frozen for that buyer.
2 = in_settlement   Platform is processing fiat payment.
3 = sold            ASA transferred to buyer. Sale complete.
4 = cancelled       Seller withdrew the listing. ASA returned.
```

**Key contract actions:**
| Action | Who calls | What it does |
|---|---|---|
| `opt_in_asset` | Admin | Contract opts into holding the ASA |
| `deposit_asset` | Seller | Transfers ASA into escrow |
| `freeze_request` | Seller | Locks in buyer wallet, state → accepted |
| `reject_request` | Seller | Resets to listed state |
| `release_to_buyer` | **Admin only** | Sends ASA → buyer, ALGO → seller |
| `cancel` | Seller | Returns ASA, state → cancelled |

> The `release_to_buyer` can only be called by the **Platform Admin wallet**. This is the Groww equivalent — the platform holds the money, verifies it, then releases both the token and the payment simultaneously.

---

## 🧪 Testing the Full Flow (Without Real Algorand)

1. Open `http://localhost:5173`
2. **Complete KYC** — enter wallet address `any-test-address`, name = `Demo Seller`, Aadhaar = `111122223333`, PAN = `DEMSD1111Z`, Phone = `9999999999`
3. Go to **Seller Dashboard** → "List Property"
4. Lookup: `KA-BLR-011-042` ← this matches Aadhaar `111122223333`
5. Click **Verify My Ownership** → should say "Aadhaar hash matches registered owner"
6. Fill in price: `5000000` microALGO (= 5 ALGO), INR: `8500000`
7. Click **Submit for Review** — listing gets created in DB (minting skipped without `.env`)
8. Switch to **Marketplace** — listing appears (if `ADMIN_MNEMONIC` is set, it's live on Testnet)
9. **Complete KYC** for a second wallet (buyer)
10. Click "Send Buy Request" on the listing
11. Go back to Seller Dashboard → "Incoming Requests" → Accept
12. Call `POST http://localhost:5000/api/buy-requests/<id>/complete` to simulate payment confirmation

---

## ⚠️ Known Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| `no such column: seller_wallet` | Old `blockestate.db` from before the migration | Delete `backend/blockestate.db` and re-run `python app.py` |
| `Admin address: None` | `ADMIN_MNEMONIC` not set in `.env` | Fine for testing — minting is skipped gracefully |
| KYC ownership check fails | Your Aadhaar doesn't match the seed hash | Use the exact Aadhaar numbers from the table above |
| Listing not appearing in marketplace | Status is still `pending` (no admin wallet) | Set `ADMIN_MNEMONIC` for auto-approval/minting |

---

## 🗺️ What's Real vs. Mock

| Feature | Status |
|---|---|
| KYC verification | **Mock** — any valid-format Aadhaar/PAN passes |
| Land records database | **Mock** — 7 Karnataka-style records seeded in SQLite |
| Ownership verification | **Real logic** — SHA-256 hash comparison |
| ASA minting | **Real** — hits Algorand Testnet (needs `ADMIN_MNEMONIC`) |
| Smart contract | **Real** — compiled PyTeal, deployed to Testnet |
| Settlement / payment | **Mock** — call `/complete` endpoint manually to simulate |
| Wallet signing | **Mock** — admin signs all txns; user wallet signing via Pera SDK is next step |
