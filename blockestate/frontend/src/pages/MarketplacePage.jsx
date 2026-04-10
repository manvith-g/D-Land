/**
 * MarketplacePage — OLX-style property browsing for buyers
 */
import { useState, useEffect, useMemo } from 'react';
import { getListings } from '../utils/api';
import PropertyCard from '../components/PropertyCard';
import KYCModal from '../components/KYCModal';
import { useAuth } from '../context/AuthContext';
import './MarketplacePage.css';

const LAND_TYPES = ['All', 'Residential', 'Agricultural', 'Commercial', 'Industrial'];

export default function MarketplacePage() {
  const { isVerified, showKYCModal, setShowKYCModal } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy]     = useState('newest');

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      const res = await getListings();
      setListings(res.listings || []);
    } catch {
      setError('Failed to load listings. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let out = listings.filter(l => l.state !== 'cancelled');

    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(l =>
        l.title?.toLowerCase().includes(q) ||
        l.land_record?.location?.village?.toLowerCase().includes(q) ||
        l.land_record?.location?.district?.toLowerCase().includes(q) ||
        l.land_record?.survey_number?.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== 'All') {
      out = out.filter(l => l.land_record?.land_type === typeFilter);
    }

    out.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price_microalgo - b.price_microalgo;
      if (sortBy === 'price-desc') return b.price_microalgo - a.price_microalgo;
      return new Date(b.created_at) - new Date(a.created_at); // newest
    });

    return out;
  }, [listings, search, typeFilter, sortBy]);

  const availableCount = listings.filter(l => l.state === 'listed').length;

  return (
    <div className="marketplace page-enter">
      {showKYCModal && <KYCModal onClose={() => setShowKYCModal(false)} />}

      {/* Hero bar */}
      <div className="marketplace-hero">
        <div className="container">
          <h1 className="display-2">
            Find Your <span className="gradient-text">Property</span>
          </h1>
          <p className="subtitle">
            {availableCount} verified properties on-chain. Every listing backed by an Algorand ASA.
          </p>
          {/* Search */}
          <div className="marketplace-search-wrap">
            <span className="marketplace-search-icon">🔍</span>
            <input
              id="marketplace-search"
              className="marketplace-search-input"
              placeholder="Search by location, survey number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="marketplace-search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        </div>
      </div>

      <div className="container marketplace-body">
        {/* Filters row */}
        <div className="marketplace-filters">
          <div className="marketplace-type-tabs">
            {LAND_TYPES.map(t => (
              <button
                key={t}
                id={`filter-${t.toLowerCase()}`}
                className={`marketplace-type-tab ${typeFilter === t ? 'active' : ''}`}
                onClick={() => setTypeFilter(t)}
              >{t}</button>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:'0.82rem', color:'#64748b', whiteSpace:'nowrap' }}>Sort by</span>
            <select
              id="marketplace-sort"
              className="input"
              style={{ width:'auto', padding:'8px 12px', fontSize:'0.85rem' }}
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        {!loading && !error && (
          <div className="marketplace-count">
            Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? 'property' : 'properties'}
            {typeFilter !== 'All' && ` · ${typeFilter}`}
            {search && ` · "${search}"`}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="marketplace-loading">
            <span className="spinner spinner-lg" />
            <p>Loading properties...</p>
          </div>
        ) : error ? (
          <div className="marketplace-error">
            <span style={{ fontSize:'2rem' }}>⚠</span>
            <p>{error}</p>
            <button className="btn btn-ghost" onClick={loadListings}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="marketplace-empty">
            <span style={{ fontSize:'3rem' }}>🏘</span>
            <h3>No properties found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid-auto-fill-300">
            {filtered.map(l => <PropertyCard key={l.id} listing={l} />)}
          </div>
        )}

        {/* KYC prompt for non-verified users */}
        {!isVerified && !loading && filtered.length > 0 && (
          <div className="marketplace-kyc-prompt">
            <span>🔒</span>
            <div>
              <strong>Complete KYC to send buy requests</strong>
              <p>Verify your identity to interact with listings.</p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              id="marketplace-kyc-cta"
              onClick={() => setShowKYCModal(true)}
            >Complete KYC</button>
          </div>
        )}
      </div>
    </div>
  );
}
