import { Link } from 'react-router-dom'
import { MapPin, Maximize, Zap, CheckCircle, Building2, Landmark } from 'lucide-react'
import { formatPrice, getStatusBadge, STATUS_LABEL } from '../data/mockData'
import './PropertyCard.css'

export default function PropertyCard({ property }) {
  const isFlat = property.type === 'flat'

  return (
    <div className="property-card card card-hover">
      {/* Image & Status */}
      <div className="pc-image-wrapper">
        <div className="pc-image">
          {isFlat ? '🏢' : '🌾'}
        </div>
        <div className="pc-badges">
          <span className={`badge badge-${getStatusBadge(property.status)}`}>
            {STATUS_LABEL[property.status]}
          </span>
          {property.kyc_verified && (
            <span className="badge badge-success kyc-badge" title="Owner KYC Verified">
              <CheckCircle size={10} /> Verified
            </span>
          )}
        </div>
        <div className="pc-type-tag">
          {isFlat ? <Building2 size={12} /> : <Landmark size={12} />}
          {isFlat ? 'Flat' : 'Land'}
        </div>
      </div>

      <div className="card-body">
        {/* ID/Token info */}
        <div className="pc-meta-top">
          <span className="pc-id-code">
            {isFlat ? `RERA: ${property.rera_id}` : `Survey: ${property.survey_no}`}
          </span>
          {property.token_id && (
            <span className="pc-token" title="Tokenized on Algorand">
              <Zap size={10} /> ASA {property.token_id}
            </span>
          )}
        </div>

        {/* Title & Location */}
        <h3 className="pc-title">{property.title}</h3>
        <div className="pc-location">
          <MapPin size={12} />
          {property.location.locality}, {property.location.city}
        </div>

        <div className="divider my-16" style={{ margin: '12px 0' }} />

        {/* Specs */}
        <div className="pc-specs">
          <div className="pc-spec">
            <Maximize size={14} />
            <span>{property.area} {property.area_unit}</span>
          </div>
          {isFlat && (
            <div className="pc-spec">
              <span>🛏️</span>
              <span>{property.bedrooms} Bed</span>
            </div>
          )}
        </div>

        <div className="divider my-16" style={{ margin: '12px 0' }} />

        {/* Price & Action */}
        <div className="pc-bottom">
          <div className="pc-price">{formatPrice(property.price)}</div>
          <Link to={`/properties/${property.id}`} className="btn btn-primary btn-sm">
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}
