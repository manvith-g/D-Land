import { useState } from "react";
import { toMicroAlgo, addListing } from "../utils/algorand";

export default function RegisterPage({ account, navigate }) {
  const [form, setForm] = useState({
    property_id:    "",
    location:       "",
    price_algo:     "",
    commission_pct: "5",
    broker_address: "",
    ipfs_hash:      "",
  });
  const [status, setStatus] = useState("idle");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    if (!account) return alert("Connect wallet first!");

    setStatus("submitting");

    const listing = {
      ...form,
      seller_address:  account,
      price_microalgo: toMicroAlgo(parseFloat(form.price_algo)),
      commission_pct:  parseInt(form.commission_pct),
      state:           "listed",
      asset_id:        null,
      app_id:          null,
    };

    await addListing(listing);
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="register-page">
        <div className="success-box big">
          <div style={{ fontSize: "3rem" }}>🎉</div>
          <h2>Property submitted for review!</h2>
          <p>Admin will verify documents and mint the ASA. You'll receive the property token in your wallet.</p>
          <button className="btn-primary" onClick={() => navigate("listings")}>View Listings</button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <h1>List a Property</h1>
      <p className="sub">After submission, admin verifies and mints your property as an ASA on Algorand Testnet.</p>

      <div className="form-card">
        <div className="form-group">
          <label>Property ID *</label>
          <input name="property_id" placeholder="e.g. MNG-004" value={form.property_id} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Location *</label>
          <input name="location" placeholder="e.g. Mangalore, Karnataka" value={form.location} onChange={handleChange} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Price (ALGO) *</label>
            <input name="price_algo" type="number" placeholder="e.g. 50" value={form.price_algo} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Commission % *</label>
            <input name="commission_pct" type="number" placeholder="5" value={form.commission_pct} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label>Broker Wallet Address *</label>
          <input name="broker_address" placeholder="Algorand address of broker" value={form.broker_address} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>IPFS Document Hash *</label>
          <input name="ipfs_hash" placeholder="QmYourIPFSHash..." value={form.ipfs_hash} onChange={handleChange} />
          <small>Upload property documents to IPFS (Pinata) and paste the hash here.</small>
        </div>

        <div className="form-group">
          <label>Your Wallet (Seller)</label>
          <input value={account || "Not connected"} disabled />
        </div>

        <button
          className="btn-primary big"
          onClick={handleSubmit}
          disabled={status === "submitting" || !account}
        >
          {status === "submitting" ? "Submitting..." : "Submit Property"}
        </button>
      </div>
    </div>
  );
}