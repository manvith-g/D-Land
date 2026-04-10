/**
 * SellerDashboard — List a property, manage listings, handle buy requests
 * Tabs: List Property | My Listings | Incoming Requests
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  lookupLandRecord, verifyOwnership, createListing,
  getSellerListings, getSellerRequests, getAllLandRecords
} from '../utils/api';
import SellerRequestCard from '../components/SellerRequestCard';
import './SellerDashboard.css';

const TABS = [
  { id: 'list',     label: '➕ List Property'      },
  { id: 'listings', label: '🏘 My Listings'         },
  { id: 'requests', label: '📬 Incoming Requests'   },
];

export default function SellerDashboard() {
  const { wallet, isVerified, setShowKYCModal } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('list');

  // Guard
  if (!wallet) return (
    <div className="dash-guard">
      <div>🔗</div><h2>Connect your wallet first</h2>
      <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
    </div>
  );
  if (!isVerified) return (
    <div className="dash-guard">
      <div>🪪</div><h2>KYC required to list properties</h2>
      <button className="btn btn-primary" onClick={() => setShowKYCModal(true)}>Complete KYC</button>
    </div>
  );

  return (
    <div className="dash page-enter">
      <div className="container">
        <div className="dash-header">
          <h1 className="heading-1">Seller Dashboard</h1>
          <p className="subtitle">List, manage, and sell tokenized properties on Algorand.</p>
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          {TABS.map(t => (
            <button key={t.id} id={`seller-tab-${t.id}`}
              className={`dash-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'list'     && <ListPropertyTab wallet={wallet} />}
        {tab === 'listings' && <MyListingsTab   wallet={wallet} />}
        {tab === 'requests' && <RequestsTab    wallet={wallet} />}
      </div>
    </div>
  );
}


// ── Tab 1: List Property ──────────────────────────────────────────────
function ListPropertyTab({ wallet }) {
  const STAGES = { idle:0, lookup:1, found:2, verified:3, form:4, submitted:5 };
  const [stage, setStage]           = useState(STAGES.idle);
  const [identifier, setIdentifier] = useState('');
  const [landRecord, setLandRecord] = useState(null);
  const [ownerMatch, setOwnerMatch] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [form, setForm]             = useState({
    title:'', description:'', price_microalgo:'', price_inr:'', token_count:1,
    commission_pct:2, images:[], ipfs_hash:''
  });
  // MUST be declared before any early returns (Rules of Hooks)
  const [allRecords, setAllRecords] = useState([]);

  useEffect(() => {
    getAllLandRecords().then(r => setAllRecords(r.records || [])).catch(() => {});
  }, []);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLookup = async () => {
    if (!identifier.trim()) return;
    setError(''); setLoading(true);
    try {
      const res = await lookupLandRecord(identifier);
      setLandRecord(res.record);
      setStage(STAGES.found);
    } catch (err) {
      setError(err?.response?.data?.message || 'No record found for this identifier.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError(''); setLoading(true);
    try {
      const res = await verifyOwnership(wallet, landRecord.id);
      setOwnerMatch(res);
      if (res.match) {
        setStage(STAGES.verified);
        setF('title', `Property at ${landRecord.location.village}`);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Ownership verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      await createListing({
        seller_wallet:    wallet,
        land_record_id:   landRecord.id,
        title:            form.title,
        description:      form.description,
        price_microalgo:  parseInt(form.price_microalgo) || 0,
        price_inr:        parseInt(form.price_inr) || 0,
        token_count:      form.token_count,
        commission_pct:   form.commission_pct,
        ipfs_hash:        form.ipfs_hash,
        images:           form.images,
      });
      setStage(STAGES.submitted);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to submit listing.');
    } finally {
      setLoading(false);
    }
  };

  if (stage === STAGES.submitted) return (
    <div className="dash-success">
      <div className="dash-success-icon">🎉</div>
      <h2>Listing Minted & Deployed!</h2>
      <p>Your property token (ASA) has been automatically minted and locked in its Algorand Escrow Contract. It is now live on the marketplace!</p>
      <button className="btn btn-primary" onClick={() => { setStage(STAGES.idle); setIdentifier(''); setLandRecord(null); setOwnerMatch(null); }}>
        List Another
      </button>
    </div>
  );


  return (
    <div className="seller-list-tab">
      {/* Step 1: Identifier input */}
      <div className={`seller-step-card ${stage >= STAGES.idle ? 'active' : ''}`}>
        <div className="seller-step-num">1</div>
        <div className="seller-step-content">
          <h3>Enter Property Identifier</h3>
          <p>Enter your Survey Number or RERA ID to fetch official government records.</p>
          <div className="seller-lookup-row">
            <input id="seller-identifier-input" className="input" style={{ flex:1 }}
              placeholder="e.g. KA-BLR-042-127 or PRM/KA/RERA/..."
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
            />
            <button className="btn btn-primary" id="seller-lookup-btn"
              onClick={handleLookup} disabled={!identifier.trim() || loading}>
              {loading ? <span className="spinner" /> : 'Lookup'}
            </button>
          </div>
          {error && stage === STAGES.idle && <div className="kyc-error" style={{ marginTop:8 }}>{error}</div>}

          {/* Browse all records from database */}
          {allRecords.length > 0 && stage === STAGES.idle && (
            <div style={{ marginTop: 16 }}>
              <div className="label" style={{ marginBottom: 8 }}>Available Government Records ({allRecords.length})</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:10 }}>
                {allRecords.map(rec => (
                  <div key={rec.survey_number}
                    onClick={() => { setIdentifier(rec.survey_number); }}
                    style={{
                      background: identifier === rec.survey_number ? 'rgba(108,99,255,0.15)' : 'var(--clr-bg-3)',
                      border: identifier === rec.survey_number ? '1px solid var(--clr-primary)' : '1px solid var(--clr-border)',
                      borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--clr-primary)'}
                    onMouseLeave={e => { if(identifier !== rec.survey_number) e.currentTarget.style.borderColor = 'var(--clr-border)'; }}
                  >
                    <div style={{ fontWeight:600, fontSize:'0.9rem', color:'var(--clr-primary)' }}>{rec.survey_number}</div>
                    <div style={{ fontSize:'0.8rem', color:'var(--clr-text-2)', marginTop:2 }}>
                      {rec.owner_name} | {rec.location_village}, {rec.location_district}
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'var(--clr-text-3)', marginTop:2 }}>
                      {rec.area_sqft} sqft | {rec.land_type} | {rec.encumbrance_status === 'clear' ? 'Clear' : 'Encumbered'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Record found */}
      {stage >= STAGES.found && landRecord && (
        <div className="seller-step-card active">
          <div className="seller-step-num">2</div>
          <div className="seller-step-content">
            <h3>Government Record Found</h3>
            <div className="land-record-card">
              <div className="land-record-grid">
                <RecordField label="Survey Number" value={landRecord.survey_number} />
                <RecordField label="RERA ID"       value={landRecord.reraid || 'N/A'} />
                <RecordField label="Registered Owner" value={landRecord.owner_name} highlight />
                <RecordField label="Location"      value={`${landRecord.location.village}, ${landRecord.location.district}`} />
                <RecordField label="Area"          value={`${landRecord.area_sqft.toLocaleString()} sqft`} />
                <RecordField label="Land Type"     value={landRecord.land_type} />
                <RecordField label="Govt. Valuation" value={`₹${(landRecord.govt_valuation_inr/100000).toFixed(1)}L`} />
                <RecordField label="Encumbrance"   value={landRecord.encumbrance_status}
                  cls={landRecord.encumbrance_status === 'clear' ? 'badge-verified' : 'badge-rejected'} />
              </div>
            </div>
            {landRecord.encumbrance_status !== 'clear' && (
              <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
                borderRadius:10, padding:'10px 14px', fontSize:'0.83rem', color:'#ef4444', marginTop:8 }}>
                ⚠ This property has an encumbrance. You may still submit but admin will review carefully.
              </div>
            )}
            <button className="btn btn-primary" id="seller-verify-ownership-btn"
              onClick={handleVerify} disabled={loading} style={{ marginTop:12 }}>
              {loading ? <><span className="spinner" /> Verifying...</> : '🪪 Verify My Ownership'}
            </button>
            {ownerMatch && !ownerMatch.match && (
              <div className="kyc-error" style={{ marginTop:8 }}>
                ❌ {ownerMatch.reason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Listing form */}
      {stage >= STAGES.verified && (
        <div className="seller-step-card active">
          <div className="seller-step-num">3</div>
          <div className="seller-step-content">
            <h3>✅ Ownership Verified — Create Your Listing</h3>
            <div className="seller-form-grid">
              <div className="input-group" style={{ gridColumn:'1/-1' }}>
                <label className="input-label">Listing Title</label>
                <input id="seller-title" className="input" value={form.title}
                  onChange={e => setF('title', e.target.value)} placeholder="e.g. 2BHK Plot near Sarjapura" />
              </div>
              <div className="input-group" style={{ gridColumn:'1/-1' }}>
                <label className="input-label">Description</label>
                <textarea className="input" rows={3} value={form.description}
                  onChange={e => setF('description', e.target.value)}
                  placeholder="Describe the property..." style={{ resize:'vertical' }} />
              </div>
              <div className="input-group">
                <label className="input-label">Price (ALGO in microALGO)</label>
                <input id="seller-price-algo" className="input" type="number"
                  value={form.price_microalgo} onChange={e => setF('price_microalgo', e.target.value)}
                  placeholder="e.g. 1000000 = 1 ALGO" />
              </div>
              <div className="input-group">
                <label className="input-label">Price (INR — for display)</label>
                <input id="seller-price-inr" className="input" type="number"
                  value={form.price_inr} onChange={e => setF('price_inr', e.target.value)}
                  placeholder="e.g. 8500000" />
              </div>
              <div className="input-group">
                <label className="input-label">Commission % (platform fee)</label>
                <input className="input" type="number" min={0} max={10}
                  value={form.commission_pct} onChange={e => setF('commission_pct', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">IPFS Hash (property docs)</label>
                <input className="input" value={form.ipfs_hash}
                  onChange={e => setF('ipfs_hash', e.target.value)}
                  placeholder="QmXxx... (optional)" />
              </div>
            </div>
            {error && <div className="kyc-error" style={{ marginTop:8 }}>{error}</div>}
            <button className="btn btn-primary btn-lg" id="seller-submit-listing"
              onClick={handleSubmit} disabled={!form.price_microalgo || loading} style={{ marginTop:16 }}>
              {loading ? <><span className="spinner" /> Submitting...</> : '🚀 Submit for Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordField({ label, value, highlight, cls }) {
  return (
    <div className="record-field">
      <div className="record-field-label">{label}</div>
      {cls
        ? <span className={`badge ${cls}`}>{value}</span>
        : <div className={`record-field-value ${highlight ? 'highlight' : ''}`}>{value}</div>
      }
    </div>
  );
}


// ── Tab 2: My Listings ────────────────────────────────────────────────
function MyListingsTab({ wallet }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getSellerListings(wallet).then(r => setListings(r.listings || [])).finally(() => setLoading(false));
  }, [wallet]);

  if (loading) return <div className="dash-loading"><span className="spinner spinner-lg" /></div>;
  if (!listings.length) return (
    <div className="dash-empty">
      <span>🏘</span><p>You haven't listed any properties yet.</p>
    </div>
  );

  return (
    <div className="my-listings-grid">
      {listings.map(l => (
        <div key={l.id} className="card my-listing-card" id={`my-listing-${l.id}`}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontWeight:600, color:'#e8eaf6' }}>{l.title || 'Untitled'}</div>
              <div style={{ fontSize:'0.8rem', color:'#64748b', marginTop:2 }}>
                {l.land_record?.location?.village || ''}, {l.land_record?.location?.district || ''}
              </div>
            </div>
            <StatusBadge status={l.status} state={l.state} />
          </div>
          <div style={{ display:'flex', gap:16, marginTop:8, fontSize:'0.82rem', color:'#94a3b8' }}>
            <span>💰 {(l.price_microalgo/1_000_000).toFixed(2)} ALGO</span>
            {l.asset_id && <span>🔑 ASA: {l.asset_id}</span>}
            {l.app_id   && <span>📜 App: {l.app_id}</span>}
          </div>
          {l.asset_id && (
            <a href={`https://lora.algokit.io/testnet/asset/${l.asset_id}`}
              target="_blank" rel="noreferrer"
              className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-start', marginTop:8 }}>
              View on Explorer ↗
            </a>
          )}
        </div>
      ))}
    </div>
  );
}


// ── Tab 3: Incoming Requests ──────────────────────────────────────────
function RequestsTab({ wallet }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getSellerRequests(wallet).then(r => setRequests(r.requests || [])).finally(() => setLoading(false));
  }, [wallet]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="dash-loading"><span className="spinner spinner-lg" /></div>;
  if (!requests.length) return (
    <div className="dash-empty">
      <span>📬</span><p>No buy requests yet. Once buyers send requests, they'll appear here.</p>
    </div>
  );

  return (
    <div className="requests-grid">
      {requests.map(r => <SellerRequestCard key={r.id} req={r} onRefresh={load} />)}
    </div>
  );
}


function StatusBadge({ status, state }) {
  const m = {
    pending:   { label:'Pending Review', cls:'badge-pending'   },
    approved:  { label: state === 'in_escrow' ? 'In Escrow' : state === 'sold' ? 'Sold' : 'Listed', cls: state === 'sold' ? 'badge-sold' : state === 'in_escrow' ? 'badge-escrow' : 'badge-listed' },
    rejected:  { label:'Rejected',   cls:'badge-rejected'  },
    cancelled: { label:'Cancelled',  cls:'badge-rejected'  },
  };
  const s = m[status] || m.pending;
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}
