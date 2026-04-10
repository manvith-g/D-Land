import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Search, Zap, Building2, MapPin, ArrowRight
} from 'lucide-react'
import { PROPERTIES } from '../data/mockData'
import PropertyCard from '../components/PropertyCard'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const featured = PROPERTIES.slice(0, 3)

  const handleSearch = (e) => {
    e.preventDefault()
    navigate('/marketplace')
  }

  return (
    <div className="home-page">
      {/* ── Hero Section ── */}
      <section className="hero-section">
        <div className="container hero-inner">
          <div className="hero-content anim-fade-1">
            <div className="hero-badge">
              <span className="live-dot" /> D-LAND is Live on Algorand
            </div>
            <h1 className="hero-title">
              Buy and Sell <span>Verified</span> Properties on Blockchain
            </h1>
            <p className="hero-subtitle">
              India's premier real estate marketplace. Tokenized flats and lands,
              verified ownership, and secure atomic escrow settlement.
            </p>

            <div className="hero-actions">
              <Link to="/marketplace" className="btn btn-primary btn-lg">
                Explore Properties
              </Link>
              <Link to="/sell" className="btn btn-outline btn-lg">
                Sell Property
              </Link>
            </div>

            <div className="hero-stats">
              <div className="hs-item">
                <div className="hs-val">₹120Cr+</div>
                <div className="hs-lbl">Total Volume</div>
              </div>
              <div className="hs-item">
                <div className="hs-val">450+</div>
                <div className="hs-lbl">Tokenized Assets</div>
              </div>
              <div className="hs-item">
                <div className="hs-val">0</div>
                <div className="hs-lbl">Escrow Frauds</div>
              </div>
            </div>
          </div>

          <div className="hero-visual anim-fade-2">
            <div className="search-mock card">
              <div className="card-body">
                <h3>Quick Search</h3>
                <form className="sm-form" onSubmit={handleSearch}>
                  <div className="form-group">
                    <label className="form-label">Location or RERA ID</label>
                    <div className="input-with-icon">
                      <MapPin size={16} className="icon" />
                      <input type="text" className="form-input" placeholder="e.g. Bandra West or P519..." />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Property Type</label>
                    <select className="form-input form-select">
                      <option>All Types</option>
                      <option>Flats & Apartments</option>
                      <option>Land Parcels</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-blue w-full btn-lg" style={{ marginTop: 8 }}>
                    <Search size={16} /> Search Properties
                  </button>
                </form>
              </div>
            </div>
            
            {/* Background decors */}
            <div className="decor-circle dc-1"></div>
            <div className="decor-circle dc-2"></div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="section bg-light">
        <div className="container">
          <div className="text-center anim-fade">
            <h2 className="section-title">How D-LAND Works</h2>
            <p className="section-sub">A unified platform to verify, list, and trade real estate securely without middlemen.</p>
          </div>

          <div className="grid-4 mt-12 anim-fade-1" style={{ marginTop: 48 }}>
            <div className="process-card card card-hover">
              <div className="card-body text-center">
                <div className="pc-icon">1</div>
                <h4>Complete KYC</h4>
                <p>Connect your Algorand wallet and complete identity verification to unlock trading.</p>
              </div>
            </div>
            <div className="process-card card card-hover">
              <div className="card-body text-center">
                <div className="pc-icon">2</div>
                <h4>Verify Property</h4>
                <p>Check government records instantly. Flats via RERA ID, land via Survey Number.</p>
              </div>
            </div>
            <div className="process-card card card-hover">
              <div className="card-body text-center">
                <div className="pc-icon">3</div>
                <h4>List or Buy</h4>
                <p>List your property as an Algorand ASA, or send a purchase request for listed ones.</p>
              </div>
            </div>
            <div className="process-card card card-hover">
              <div className="card-body text-center">
                <div className="pc-icon">4</div>
                <h4>Secure Settlement</h4>
                <p>Atomic escrow smart contracts ensure tokens and funds swap instantly and safely.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Properties ── */}
      <section className="section">
        <div className="container">
          <div className="flex items-center justify-between mb-8" style={{ marginBottom: 32 }}>
            <div>
              <h2 className="section-title">Featured Properties</h2>
              <p className="section-sub">Explore some of our premium verified listings.</p>
            </div>
            <Link to="/marketplace" className="btn btn-outline">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid-3 anim-fade-1">
            {featured.map(prop => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Trust Us ── */}
      <section className="section bg-light border-y">
        <div className="container container-sm text-center anim-fade">
          <div className="section-chip"><ShieldCheck size={14} /> Built on Trust</div>
          <h2 className="section-title">Why Trust D-LAND?</h2>
          <p className="section-sub" style={{ marginBottom: 40 }}>
            Real estate transactions are historically slow and prone to fraud. We use web3 technology to solve this.
          </p>

          <div className="trust-grid">
            <div className="trust-item card">
              <div className="card-body">
                <Building2 size={24} className="trust-icon" />
                <h4>Verified Ownership</h4>
                <p>Every property is cross-checked with Indian Government RERA and Land Revenue records before allowing a listing.</p>
              </div>
            </div>
            <div className="trust-item card">
              <div className="card-body">
                <Zap size={24} className="trust-icon" />
                <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                  Atomic Escrow <span className="badge badge-success">Live</span>
                </h4>
                <p>Algorand smart contracts hold buyer payment and seller asset token. They are swapped simultaneously. Zero middleman risk.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="section cta-section">
        <div className="container text-center anim-fade">
          <h2>Ready to transform your real estate experience?</h2>
          <p>Join the thousands of users already trading properties securely on D-LAND.</p>
          <div className="flex justify-center gap-12 mt-12" style={{ marginTop: 24 }}>
            <Link to="/sell" className="btn btn-primary btn-lg">List Your Property</Link>
            <Link to="/ownership-check" className="btn btn-outline btn-lg" style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>Verify an Ownership</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
