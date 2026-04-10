import { useState } from "react";

const BACKEND = "http://localhost:5000/api";

export default function VerifyPage() {
  const [search, setSearch]   = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleVerify() {
    if (!search.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res  = await fetch(`${BACKEND}/verify/${search.trim()}`);
      const data = await res.json();
      if (!data.found) {
        setError("Property not found. Check the Property ID or ASA ID.");
      } else {
        setResult(data);
      }
    } catch (e) {
      setError("Could not connect to backend.");
    }
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter") handleVerify();
  }

  return (
    <div className="verify-page">

      {/* Header */}
      <div className="verify-hero">
        <div className="hero-badge">Public Verification</div>
        <h1 className="hero-title">Verify Property <span className="accent">Ownership</span></h1>
        <p className="hero-sub">
          Anyone can verify who owns a property — no wallet needed.
          Search by Property ID or ASA ID to see real-time ownership status.
        </p>
      </div>

      {/* Search */}
      <div className="verify-search-box">
        <input
          className="verify-input"
          placeholder="Enter Property ID (e.g. MNG-001) or ASA ID (e.g. 758561743)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKey}
        />
        <button className="btn-primary" onClick={handleVerify} disabled={loading}>
          {loading ? "Searching..." : "🔍 Verify"}
        </button>
      </div>

      {/* Error */}
      {error && <div className="error-box">{error}</div>}

      {/* Result */}
      {result && (
        <div className="verify-result">

          {/* Status Banner */}
          <div className={`ownership-banner ${result.is_sold ? "sold" : "available"}`}>
            <span className="ownership-icon">{result.is_sold ? "🔴" : "🟢"}</span>
            <span className="ownership-status">
              {result.is_sold ? "SOLD — This property has been transferred" : "AVAILABLE — This property is listed for sale"}
            </span>
          </div>

          {/* Property Details */}
          <div className="verify-grid">
            <div className="verify-card">
              <h3>Property Details</h3>
              <div className="verify-row"><span>Property ID</span><strong>{result.property_id}</strong></div>
              <div className="verify-row"><span>Location</span><strong>{result.location}</strong></div>
              <div className="verify-row"><span>Price</span><strong>{result.price_algo} ALGO</strong></div>
              <div className="verify-row"><span>ASA ID</span><strong className="mono">{result.asset_id}</strong></div>
              <div className="verify-row"><span>App ID</span><strong className="mono">{result.app_id}</strong></div>
              <div className="verify-row"><span>IPFS Docs</span><strong className="mono">{result.ipfs_hash}</strong></div>
              <a href={result.explorer_url} target="_blank" rel="noreferrer" className="explorer-link">
                View on Algorand Explorer →
              </a>
            </div>

            <div className="verify-card">
              <h3>Ownership</h3>
              <div className="verify-row"><span>Original Seller</span></div>
              <div className="addr-box">{result.seller_address}</div>

              <div className="verify-row" style={{ marginTop: "1rem" }}><span>Current Owner</span></div>
              <div className={`addr-box ${result.is_sold ? "highlight" : ""}`}>
                {result.current_owner || "Checking blockchain..."}
              </div>

              {result.is_sold && (
                <div className="sold-note">
                  ⚠️ This property has been sold. The current owner is different from the original seller.
                </div>
              )}

              {!result.is_sold && (
                <div className="available-note">
                  ✅ The property is still with the original seller. Not yet sold.
                </div>
              )}
            </div>
          </div>

          {/* Transaction History */}
          {result.transaction_history && result.transaction_history.length > 0 && (
            <div className="tx-history">
              <h3>Transaction History</h3>
              <div className="tx-table">
                <div className="tx-header">
                  <span>TxID</span>
                  <span>From</span>
                  <span>To</span>
                  <span>Round</span>
                </div>
                {result.transaction_history.map((tx) => (
                  <div key={tx.txid} className="tx-row">
                    <a
                      href={`https://lora.algokit.io/testnet/tx/${tx.txid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="tx-link"
                    >
                      {tx.txid.slice(0, 8)}...
                    </a>
                    <span className="mono">{tx.from.slice(0, 8)}...</span>
                    <span className="mono">{tx.to.slice(0, 8)}...</span>
                    <span>{tx.round}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* How it works note */}
      {!result && !error && (
        <div className="verify-info">
          <h3>How does this work?</h3>
          <p>Every property on BlockEstate is a unique token (ASA) on the Algorand blockchain. The token can only be held by one wallet at a time — making it impossible to sell the same property twice. This page reads directly from the blockchain to show you the real owner.</p>
        </div>
      )}

    </div>
  );
}