import { useState, useEffect } from "react";

const BACKEND = "http://localhost:5000/api";

const STATUS_COLOR = {
  pending:  "#f59e0b",
  approved: "#22c55e",
  rejected: "#ef4444",
};

export default function AdminPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(null); // listing id being processed

  async function fetchListings() {
    setLoading(true);
    const res  = await fetch(`${BACKEND}/admin/listings`);
    const data = await res.json();
    setListings(data.listings);
    setLoading(false);
  }

  useEffect(() => { fetchListings(); }, []);

  async function handleApprove(id) {
    setActing(id);
    try {
      const res  = await fetch(`${BACKEND}/admin/approve/${id}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Approved!\nASA ID: ${data.asset_id}\nApp ID: ${data.app_id}`);
        fetchListings();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (e) {
      alert(`❌ Failed: ${e.message}`);
    }
    setActing(null);
  }

  async function handleReject(id) {
    setActing(id);
    await fetch(`${BACKEND}/admin/reject/${id}`, { method: "POST" });
    fetchListings();
    setActing(null);
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>🛡️ Admin Panel</h1>
        <p className="sub">Review and approve property submissions</p>
        <button className="btn-secondary" onClick={fetchListings}>↻ Refresh</button>
      </div>

      {loading && <div className="empty">Loading...</div>}

      {!loading && listings.length === 0 && (
        <div className="empty">No submissions yet.</div>
      )}

      <div className="admin-grid">
        {listings.map((l) => (
          <div key={l.id} className="admin-card">
            <div className="admin-card-header">
              <span className="prop-id">#{l.property_id}</span>
              <span
                className="admin-status-badge"
                style={{ background: STATUS_COLOR[l.status] }}
              >
                {l.status}
              </span>
            </div>

            <div className="admin-card-body">
              <div className="admin-row"><span>Location</span><strong>{l.location}</strong></div>
              <div className="admin-row"><span>Price</span><strong>{(l.price_microalgo / 1_000_000).toFixed(2)} ALGO</strong></div>
              <div className="admin-row"><span>Commission</span><strong>{l.commission_pct}%</strong></div>
              <div className="admin-row"><span>Seller</span><strong className="mono">{l.seller_address?.slice(0, 10)}...</strong></div>
              <div className="admin-row"><span>Broker</span><strong className="mono">{l.broker_address?.slice(0, 10)}...</strong></div>
              <div className="admin-row"><span>IPFS</span><strong className="mono">{l.ipfs_hash}</strong></div>

              {l.status === "approved" && (
                <>
                  <div className="admin-row success-row"><span>ASA ID</span><strong>{l.asset_id}</strong></div>
                  <div className="admin-row success-row"><span>App ID</span><strong>{l.app_id}</strong></div>
                  <a
                    href={`https://lora.algokit.io/testnet/asset/${l.asset_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="explorer-link"
                  >
                    View on Explorer →
                  </a>
                </>
              )}
            </div>

            {l.status === "pending" && (
              <div className="admin-actions">
                <button
                  className="btn-approve"
                  onClick={() => handleApprove(l.id)}
                  disabled={acting === l.id}
                >
                  {acting === l.id ? "Processing..." : "✅ Approve"}
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleReject(l.id)}
                  disabled={acting === l.id}
                >
                  ❌ Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}