/**
 * PropertyCard — OLX-style listing card for the marketplace grid
 */
import { useNavigate } from 'react-router-dom';
import './PropertyCard.css';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80';

const STATE_BADGE = {
  listed:    { label: 'Available',   cls: 'badge-listed',  dot: '#6c63ff' },
  in_escrow: { label: 'In Escrow',   cls: 'badge-escrow',  dot: '#f59e0b' },
  sold:      { label: 'Sold',        cls: 'badge-sold',    dot: '#ef4444' },
  cancelled: { label: 'Cancelled',   cls: 'badge-rejected',dot: '#64748b' },
};

const LAND_TYPE_ICON = {
  Residential: '🏠',
  Agricultural: '🌾',
  Commercial: '🏢',
  Industrial: '🏭',
};

export default function PropertyCard({ listing }) {
  const navigate = useNavigate();
  const { land_record: lr, images } = listing;

  const displayImage = (images && images[0]) || FALLBACK_IMAGE;
  const state  = STATE_BADGE[listing.state]  || STATE_BADGE.listed;
  const typeIcon = LAND_TYPE_ICON[lr?.land_type] || '📍';

  const priceAlgo = (listing.price_microalgo / 1_000_000).toLocaleString('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
  const priceInr = listing.price_inr
    ? `₹${(listing.price_inr / 100000).toFixed(1)}L`
    : null;

  return (
    <div
      className="property-card"
      id={`property-card-${listing.id}`}
      onClick={() => navigate(`/property/${listing.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/property/${listing.id}`)}
    >
      {/* Image */}
      <div className="property-card-img-wrap">
        <img
          src={displayImage}
          alt={listing.title}
          className="property-card-img"
          loading="lazy"
          onError={e => { e.target.src = FALLBACK_IMAGE; }}
        />
        <div className="property-card-state-badge">
          <span className={`badge ${state.cls}`}>
            <span className="badge-dot" style={{ background: state.dot }} />
            {state.label}
          </span>
        </div>
        {lr?.encumbrance_status === 'mortgaged' && (
          <div className="property-card-warning-badge">⚠ Mortgaged</div>
        )}
      </div>

      {/* Body */}
      <div className="property-card-body">
        <div className="property-card-type">
          <span>{typeIcon}</span>
          <span>{lr?.land_type || 'Property'}</span>
          {lr?.area_sqft && <span className="property-card-area">{lr.area_sqft.toLocaleString()} sqft</span>}
        </div>

        <h3 className="property-card-title">{listing.title || `Property at ${lr?.location?.village}`}</h3>

        <div className="property-card-location">
          <span>📍</span>
          <span>{[lr?.location?.village, lr?.location?.district].filter(Boolean).join(', ') || 'Karnataka'}</span>
        </div>

        {lr?.survey_number && (
          <div className="property-card-survey">
            Survey: <code>{lr.survey_number}</code>
          </div>
        )}

        <div className="property-card-footer">
          <div className="property-card-price">
            <span className="property-card-price-algo">{priceAlgo} ALGO</span>
            {priceInr && <span className="property-card-price-inr">{priceInr}</span>}
          </div>
          <div className="property-card-kyc-chip">
            <span className="badge badge-verified" style={{ fontSize: '0.7rem' }}>✓ KYC Seller</span>
          </div>
        </div>
      </div>
    </div>
  );
}
