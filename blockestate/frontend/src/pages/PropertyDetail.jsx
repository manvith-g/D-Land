import { useState } from "react";
import { optIntoAsset, buyProperty, toAlgo } from "../utils/algorand";

export default function PropertyDetail({ property, account, peraWallet, navigate }) {
  const [step, setStep]   = useState("idle");
  const [txid, setTxid]   = useState("");
  const [error, setError] = useState("");

  if (!property) return <div className="empty">No property selected.</div>;

  async function handleBuy() {
    if (!account) return alert("Connect your Pera Wallet first!");

    try {
      setStep("opting");
      await optIntoAsset(account, property.asset_id, peraWallet);

      setStep("buying");
      const tx = await buyProperty(
        account,
        property.app_id,
        property.asset_id,
        property.price_microalgo,
        peraWallet
      );
      setTxid(tx);
      setStep("done");
    } catch (e) {
      setError(e.message || "Transaction failed");
      setStep("error");
    }
  }

  const stepLabel = {
    opting: "Step 1/2: Opting into ASA...",
    buying: "Step 2/2: Sending payment to escrow...",
    done:   "🎉 Purchase submitted! Awaiting seller confirmation.",
  };

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={() => navigate("listings")}>← Back</button>

      <div className="detail-layout">
        <div className="detail-img-wrap">
          <img src={property.image || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600"} alt="property" />
          <div className="ipfs-link">
            📄 Docs on IPFS: <code>{property.ipfs_hash}</code>
          </div>
        </div>

        <div className="detail-info">
          <h1>{property.location}</h1>

          <div className="detail-meta-grid">
            <div className="meta-item"><span>Asset ID (ASA)</span><strong>#{property.asset_id}</strong></div>
            <div className="meta-item"><span>App ID</span><strong>#{property.app_id}</strong></div>
            <div className="meta-item"><span>Property ID</span><strong>{property.property_id}</strong></div>
            <div className="meta-item"><span>Commission</span><strong>{property.commission_pct}%</strong></div>
            <div className="meta-item"><span>Status</span><strong style={{ textTransform: "capitalize" }}>{property.state.replace("_", " ")}</strong></div>
          </div>

          <div className="price-box">
            <span className="price-label">Price</span>
            <span className="price-value">{toAlgo(property.price_microalgo)} ALGO</span>
            <span className="price-micro">{property.price_microalgo.toLocaleString()} μALGO</span>
          </div>

          <div className="escrow-flow">
            <h3>How this transaction works:</h3>
            <div className="flow-steps">
              <div className="flow-step">You → Contract<br/><small>Payment locked</small></div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">Contract verifies<br/><small>Seller owns ASA?</small></div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">ASA → You<br/><small>ALGO → Seller</small></div>
            </div>
          </div>

          {property.state === "listed" && (
            <div className="buy-section">
              {step === "idle" && (
                <button className="btn-primary big" onClick={handleBuy} disabled={!account}>
                  {account ? "🔐 Buy with Pera Wallet" : "Connect wallet to buy"}
                </button>
              )}
              {stepLabel[step] && (
                <div className="status-msg">
                  <div className="spinner" />
                  {stepLabel[step]}
                </div>
              )}
              {step === "done" && (
                <div className="success-box">
                  <div>✅ {stepLabel.done}</div>
                  <div className="txid">TxID: <code>{txid}</code></div>
                  <a href={`https://lora.algokit.io/testnet/tx/${txid}`} target="_blank" rel="noreferrer" className="explorer-link">
                    View on AlgoExplorer →
                  </a>
                </div>
              )}
              {step === "error" && (
                <div className="error-box">❌ {error}</div>
              )}
            </div>
          )}

          {property.state === "in_escrow" && (
            <div className="status-banner yellow">⏳ This property is currently in escrow.</div>
          )}
          {property.state === "sold" && (
            <div className="status-banner red">🔒 This property has been sold.</div>
          )}
        </div>
      </div>
    </div>
  );
}