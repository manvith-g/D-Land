/**
 * PropertyDetailPage — full property view with buy request button
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getListing } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import BuyRequestModal from '../components/BuyRequestModal';
import './PropertyDetailPage.css';

const FALLBACK = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { wallet, isVerified, setShowKYCModal } = useAuth();

  const [listing, setListing]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [showBuy, setShowBuy]   = useState(false);
  const [success, setSuccess]   = useState(false);

  useEffect(() => {
    getListing(id)
      .then(r => setListing(r.listing))
      .catch(() => setError('Property not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="prop-loading"><span className="spinner spinner-lg" /></div>;
  if (error || !listing) return (
    <div className="prop-loading" style={{ flexDirection:'column', gap:16 }}>
      <span style={{ fontSize:'2.5rem' }}>🏚</span>
      <p style={{ color:'#94a3b8' }}>{error || 'Not found'}</p>
      <button className="btn btn-ghost" onClick={() => navigate('/marketplace')}>← Marketplace</button>
    </div>
  );

  const { land_record: lr, images } = listing;
  const displayImage = (images && images[0]) || FALLBACK;
  const priceAlgo = (listing.price_microalgo / 1_000_000).toLocaleString('en-IN', { minimumFractionDigits:2 });
  const isSold   = listing.state === 'sold';
  const isOwner  = listing.seller_wallet === wallet;

  const handleBuyClick = () => {
    if (!wallet)      return setShowKYCModal(true);
    if (!isVerified)  return setShowKYCModal(true);
    if (isOwner)      return;
    setShowBuy(true);
  };

  return (
    <div className="prop-detail page-enter">
      <div className="container">
        <button className="btn btn-ghost btn-sm prop-back" onClick={() => navigate(-1)}>← Back</button>

        <div className="prop-grid">
          {/* Left: Image */}
          <div className="prop-image-col">
            <div className="prop-image-wrap">
              <img src={displayImage} alt={listing.title} className="prop-image"
                onError={e => { e.target.src = FALLBACK; }} />
              <div className="prop-state-overlay">
                {isSold
                  ? <span className="badge badge-sold">🔴 Sold</span>
                  : <span className="badge badge-listed">🟢 Available</span>}
              </div>
            </div>
            {listing.asset_id && (
              <a href={`https://lora.algokit.io/testnet/asset/${listing.asset_id}`}
                target="_blank" rel="noreferrer" className="prop-explorer-link">
                🔗 View on Algorand Explorer ↗
              </a>
            )}
          </div>

          {/* Right: Details */}
          <div className="prop-info-col">
            <div className="prop-breadcrumb">
              <span className="badge badge-verified" style={{ fontSize:'0.72rem' }}>✓ KYC Verified Seller</span>
            </div>

            <h1 className="prop-title">{listing.title}</h1>

            <div className="prop-location">
              📍 {[lr?.location?.village, lr?.location?.taluk, lr?.location?.district]
                    .filter(Boolean).join(', ')}
            </div>

            {listing.description && (
              <p style={{ color:'#94a3b8', fontSize:'0.9rem', lineHeight:1.7 }}>{listing.description}</p>
            )}

            {/* Metadata grid */}
            <div className="prop-meta-grid">
              <PropMeta label="Survey Number"  value={lr?.survey_number} mono />
              <PropMeta label="RERA ID"        value={lr?.reraid || 'N/A'} mono />
              <PropMeta label="Area"           value={`${lr?.area_sqft?.toLocaleString()} sqft`} />
              <PropMeta label="Land Type"      value={lr?.land_type} />
              <PropMeta label="Encumbrance"    value={lr?.encumbrance_status}
                highlight={lr?.encumbrance_status === 'clear' ? 'green' : 'red'} />
              <PropMeta label="Govt. Valuation" value={lr?.govt_valuation_inr ? `₹${(lr.govt_valuation_inr/100000).toFixed(1)}L` : 'N/A'} />
              {listing.asset_id && <PropMeta label="ASA Token ID" value={listing.asset_id} mono />}
              {listing.app_id   && <PropMeta label="Contract ID"  value={listing.app_id}   mono />}
            </div>

            {/* Price + CTA */}
            <div className="prop-cta-box">
              <div className="prop-price">
                <span className="prop-price-algo">{priceAlgo} ALGO</span>
                {listing.price_inr > 0 && (
                  <span className="prop-price-inr">≈ ₹{listing.price_inr.toLocaleString()}</span>
                )}
              </div>

              {isSold ? (
                <div className="prop-sold-msg">This property has been sold.</div>
              ) : isOwner ? (
                <div className="prop-owner-msg">You own this listing.</div>
              ) : success ? (
                <div style={{
                  background:'rgba(0,212,170,0.1)', border:'1px solid rgba(0,212,170,0.25)',
                  borderRadius:12, padding:'14px 18px', color:'#00d4aa', fontWeight:600
                }}>✅ Buy request sent! Awaiting seller response.</div>
              ) : (
                <button className="btn btn-accent btn-lg w-full" id="prop-buy-btn" onClick={handleBuyClick}>
                  🤝 Send Buy Request
                </button>
              )}

              {!wallet && (
                <p style={{ fontSize:'0.8rem', color:'#64748b', textAlign:'center', marginTop:8 }}>
                  Connect wallet + complete KYC to send a request
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showBuy && (
        <BuyRequestModal
          listing={listing}
          onClose={() => setShowBuy(false)}
          onSuccess={() => { setSuccess(true); setShowBuy(false); }}
        />
      )}
    </div>
  );
}

function PropMeta({ label, value, mono, highlight }) {
  const style = highlight === 'green'
    ? { color:'#10b981', fontWeight:600 }
    : highlight === 'red'
    ? { color:'#ef4444', fontWeight:600 }
    : {};
  return (
    <div className="prop-meta-item">
      <div className="record-field-label">{label}</div>
      <div className={`record-field-value ${mono ? 'prop-mono' : ''}`} style={style}>{value}</div>
    </div>
  );
}
