import { useState, useEffect } from "react";
import { toAlgo } from "../utils/algorand";

const BACKEND = "http://localhost:5000/api";

const STATE_BADGE = {
  listed:    { label: "Available",  color: "#22c55e" },
  in_escrow: { label: "In Escrow",  color: "#f59e0b" },
  sold:      { label: "Sold",       color: "#ef4444" },
};

export default function ListingsPage({ navigate, account }) {
  const [listings, setListings] = useState([]);
  const [filter, setFilter]     = useState("all");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch(`${BACKEND}/listings`)
      .then(r => r.json())
      .then(d => { setListings(d.listings); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "all"
    ? listings
    : listings.filter((l) => l.state === filter);

  return (
    <div className="listings-page">
      <div className="page-header">
        <h1>Properties</h1>
        <div className="filter-tabs">
          {["all", "listed", "in_escrow", "sold"].map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : STATE_BADGE[f]?.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="empty">Loading properties...</div>}

      {!loading && filtered.length === 0 && (
        <div className="empty">No properties found.</div>
      )}

      <div className="listings-grid">
        {filtered.map((prop) => {
          const badge = STATE_BADGE[prop.state] || STATE_BADGE["listed"];
          return (
            <div key={prop.id} className="prop-card" onClick={() => navigate("detail", prop)}>
              <div className="prop-img-wrap">
                <img src={prop.image} alt={prop.location} className="prop-img" />
                <span className="state-badge" style={{ background: badge.color }}>
                  {badge.label}
                </span>
              </div>
              <div className="prop-info">
                <div className="prop-id">ASA #{prop.asset_id}</div>
                <div className="prop-location">📍 {prop.location}</div>
                <div className="prop-price">{toAlgo(prop.price_microalgo)} ALGO</div>
                <div className="prop-meta">
                  <span>Commission: {prop.commission_pct}%</span>
                  <span>ID: {prop.property_id}</span>
                </div>
                {prop.state === "listed" && (
                  <button className="btn-buy" onClick={(e) => { e.stopPropagation(); navigate("detail", prop); }}>
                    Buy Now
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}