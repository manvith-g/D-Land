# BlockEstate 🏡
**Trustless Property Ownership & Transfer on Algorand**

---

## Project Structure
```
blockestate/
├── contracts/
│   └── blockestate_contract.py   ← PyTeal smart contract
├── backend/
│   ├── app.py                    ← Flask API
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.jsx
        ├── App.css
        ├── pages/
        │   ├── HomePage.jsx
        │   ├── ListingsPage.jsx
        │   ├── PropertyDetail.jsx
        │   └── RegisterPage.jsx
        └── utils/
            └── algorand.js
```

---

## Setup

### 1. Smart Contract
```bash
cd contracts
pip install pyteal
python blockestate_contract.py
# Output: build/approval.teal + build/clear.teal
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt

# Create .env file:
echo "ADMIN_MNEMONIC=your 25-word mnemonic here" > .env
echo "ALGOD_ADDRESS=https://testnet-api.algonode.cloud" >> .env
echo "ALGOD_TOKEN=" >> .env

python app.py
# Runs on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Get Testnet ALGO
https://bank.testnet.algorand.network/

---

## Flow Summary
1. Admin mints property as ASA (POST /api/property/mint)
2. Admin deploys escrow contract (POST /api/property/deploy-contract)
3. Buyer connects Pera Wallet → opts into ASA → sends payment
4. Smart contract locks funds + verifies ownership
5. Seller calls `complete_transfer` → ASA goes to buyer, ALGO to seller, commission to broker

---

## Testnet Explorer
https://testnet.algoexplorer.io/
