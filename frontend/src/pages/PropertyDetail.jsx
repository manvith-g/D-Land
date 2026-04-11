import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  MapPin, CheckCircle, ShieldCheck, FileText, Maximize, Zap,
  AlertCircle, History, ExternalLink, User, Building2, Landmark
} from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import { PROPERTIES, formatPrice, getStatusBadge, STATUS_LABEL } from '../data/mockData'
import './PropertyDetail.css'

export default function PropertyDetail() {
  const { id } = useParams()
  const { wallet, isConnected } = useWallet()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [property, setProperty] = useState(null)
  const [fetchLoading, setFetchLoading] = useState(true)

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/listings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const raw = data.data.find(x => x.id === id)
          if (raw) {
            const rera = raw.rera_records || {}
            const isFlat = rera.no_of_flats > 0
            setProperty({
              id: raw.id,
              type: isFlat ? 'flat' : 'land',
              status: raw.status || 'listed',
              title: `${isFlat ? 'Flat' : 'Land'} in ${rera.location_village || 'Unknown'}`,
              location: {
                locality: rera.location_village || 'Locality',
                city: rera.location_district || 'City',
                state: rera.location_state || 'State',
                pincode: rera.location_pincode || '000000'
              },
              price: Number(raw.price),
              description: raw.description || `Beautiful ${isFlat ? 'flat' : 'land'} located in ${rera.location_village || 'the area'}. Fully verified by government records.`,
              area: rera.property_area || 1000,
              area_unit: isFlat ? 'sq.ft' : 'sq.m',
              bedrooms: isFlat ? 2 : 0,
              bathrooms: isFlat ? 2 : 0,
              floor: 1,
              total_floors: 4,
              amenities: ['Verified Asset', 'Clear Title', 'Smart Contract Ready'],
              owner_wallet: raw.seller_wallet,
              owner_name: rera.promoter_name || 'Promoter',
              token_id: raw.asset_id,
              ipfs_cid: 'bafyreiautr...',
              rera_id: rera.rera_id,
              survey_no: rera.survey_no || 'N/A',
              kyc_verified: true
            })
          }
        }
      })
      .catch(console.error)
      .finally(() => setFetchLoading(false))
  }, [id])

  if (fetchLoading) {
    return <div className="container text-center section"><div className="spinner mt-24"></div></div>
  }
  
  if (!property) {
    return (
      <div className="container text-center section">
        <h2>Property not found</h2>
        <Link to="/marketplace" className="btn btn-primary mt-12">Back to Marketplace</Link>
      </div>
    )
  }

  const isFlat = property.type === 'flat'
  const isOwner = isConnected && wallet?.address === property.owner_wallet
  const canBuy = isConnected && !isOwner && property.status === 'listed'

  const handleInterest = async () => {
    if (!isConnected) return navigate('/')
    try {
      setLoading(true)
      const res = await fetch('http://127.0.0.1:5000/api/buy-request', {
        method: 'POST',
        body: JSON.stringify({
          listing_id: property.id,
          buyer_wallet: wallet.address,
          buyer_name: wallet.name || 'Anonymous',
          amount: property.price
        })
      })
      const data = await res.json()
      if (data.success) {
        setSuccessMsg('Purchase request sent securely to the owner!')
      } else {
        alert("Could not send request: " + data.error)
      }
    } catch (e) {
      console.error(e)
      alert("Network error.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pd-page">
      {/* Top Banner Area */}
      <div className="pd-banner">
        <div className="container">
          <div className="pd-breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <Link to="/marketplace">Marketplace</Link>
            <span className="sep">/</span>
            <span className="cur">{property.title}</span>
          </div>
        </div>
      </div>

      <div className="container pd-main anim-fade">
        <div className="pd-grid">
          {/* Left Column */}
          <div className="pd-left">
            <div className="pd-hero-img card">
              <div className="pd-hero-emoji">{isFlat ? '🏢' : '🌾'}</div>
              <div className="pd-badges">
                <span className={`badge badge-${getStatusBadge(property.status)}`}>
                  {STATUS_LABEL[property.status]}
                </span>
                <span className="badge badge-gray mx-top">
                  {isFlat ? <Building2 size={11} className="mr-1" /> : <Landmark size={11} className="mr-1" />}
                  {isFlat ? 'Flat' : 'Land'}
                </span>
              </div>
            </div>

            <div className="pd-content mt-12">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="pd-title">{property.title}</h1>
                  <div className="pd-location">
                    <MapPin size={16} />
                    {property.location.locality}, {property.location.city}, {property.location.state} — {property.location.pincode}
                  </div>
                </div>
                <div className="pd-price-lg">{formatPrice(property.price)}</div>
              </div>

              <div className="divider my-24" />

              <h3 className="section-title" style={{ fontSize:'1.4rem' }}>Overview</h3>
              <p className="pd-desc">{property.description}</p>
              
              <div className="pd-specs-grid mt-12">
                <div className="pd-spec-box">
                  <div className="pd-spec-icon"><Maximize size={18} /></div>
                  <div>
                    <div className="pd-spec-lbl">Area</div>
                    <div className="pd-spec-val">{property.area} {property.area_unit}</div>
                  </div>
                </div>
                {isFlat && (
                  <>
                    <div className="pd-spec-box">
                      <div className="pd-spec-icon">🛏️</div>
                      <div>
                        <div className="pd-spec-lbl">Bedrooms</div>
                        <div className="pd-spec-val">{property.bedrooms} Bed</div>
                      </div>
                    </div>
                    <div className="pd-spec-box">
                      <div className="pd-spec-icon">🚿</div>
                      <div>
                        <div className="pd-spec-lbl">Bathrooms</div>
                        <div className="pd-spec-val">{property.bathrooms} Bath</div>
                      </div>
                    </div>
                    <div className="pd-spec-box">
                      <div className="pd-spec-icon">🏢</div>
                      <div>
                        <div className="pd-spec-lbl">Floor</div>
                        <div className="pd-spec-val">{property.floor} out of {property.total_floors}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <h3 className="section-title mt-24" style={{ fontSize:'1.4rem', marginTop: 32 }}>Features & Amenities</h3>
              <div className="pd-amenities">
                {property.amenities.map(a => (
                  <div key={a} className="pd-amenity-chip"><CheckCircle size={14} /> {a}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column / Sidebar */}
          <div className="pd-sidebar">
            {/* Blockchain Verifications Box */}
            <div className="card pd-verify-card mb-24">
              <div className="cv-head"><ShieldCheck size={18} /> Transparent Verification</div>
              <div className="card-body">
                
                <div className="vr-row">
                  <div className="vr-lbl">Govt. ID</div>
                  <div className="vr-val mono">
                    {isFlat ? `RERA: ${property.rera_id}` : `Survey: ${property.survey_no}`}
                    <CheckCircle size={12} className="vr-icon-ok" />
                  </div>
                </div>

                <div className="vr-row">
                  <div className="vr-lbl">On-Chain Asset</div>
                  <div className="vr-val">
                    {property.token_id ? (
                      <span className="flex items-center gap-4 text-primary-dark font-bold">
                        <Zap size={14} /> ASA {property.token_id}
                        <ExternalLink size={12} className="ml-1" />
                      </span>
                    ) : (
                      <span className="text-gray italic">Not Tokenized</span>
                    )}
                  </div>
                </div>

                <div className="vr-row">
                  <div className="vr-lbl">IPFS Metadata</div>
                  <div className="vr-val mono text-xs">
                    {property.ipfs_cid ? (
                     <a href={`https://ipfs.io/ipfs/${property.ipfs_cid}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 text-blue">
                       {property.ipfs_cid.slice(0, 10)}... <ExternalLink size={12} />
                     </a>
                    ) : 'Pending'}
                  </div>
                </div>

                <Link to="/ownership-check" className="btn btn-outline w-full mt-12 text-sm justify-center">
                  <FileText size={14} /> Run Full Govt Ownership Check
                </Link>

              </div>
            </div>

            {/* Seller Box */}
            <div className="card mb-24">
              <div className="card-body">
                <h4 className="flex items-center gap-8 mb-16"><User size={16} /> Listed By</h4>
                <div className="flex items-center gap-12">
                  <div className="avatar avatar-lg">{property.owner_name.charAt(0)}</div>
                  <div>
                    <div className="font-bold">{property.owner_name}</div>
                    <div className="text-sm text-gray mono mt-4">{property.owner_wallet}</div>
                    {property.kyc_verified && (
                      <div className="flex items-center gap-4 text-success text-xs font-bold mt-4">
                        <CheckCircle size={12} /> KYC VERIFIED
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Box */}
            <div className="card pd-action-card">
              <div className="card-body">
                <div className="font-display font-bold text-2xl mb-8">{formatPrice(property.price)}</div>
                
                {isOwner ? (
                  <div className="alert alert-info mb-16">
                    <AlertCircle size={16} /> You own this listing.
                  </div>
                ) : property.status === 'escrow' ? (
                  <div className="alert alert-warning mb-16">
                    <Lock size={16} /> This property is currently locked in an active escrow.
                  </div>
                ) : property.status === 'sold' ? (
                  <div className="alert alert-gray mb-16">
                    <CheckCircle size={16} /> This property has been sold.
                  </div>
                ) : null}

                {successMsg ? (
                  <div className="alert alert-success">
                    <CheckCircle size={16} /> {successMsg}
                  </div>
                ) : canBuy ? (
                  <>
                    <button 
                      className="btn btn-primary btn-lg w-full justify-center"
                      onClick={handleInterest}
                      disabled={loading}
                    >
                      {loading ? <><div className="spinner border-dark" /> Sending…</> : 'Request to Buy'}
                    </button>
                    <p className="text-xs text-gray text-center mt-12 line-height-tight">
                      By submitting a buy request, the owner will receive your offer via the smart contract Escrow generator. No funds are moved until escrow is initiated.
                    </p>
                  </>
                ) : !isConnected ? (
                  <button className="btn btn-blue w-full justify-center" onClick={() => alert('Connect via top right button')}>
                    Connect Wallet to Buy
                  </button>
                ) : null}

                <div className="divider my-16" />

                <button className="btn btn-ghost w-full justify-center text-sm">
                  <History size={16} /> View Transaction History
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
