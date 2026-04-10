/**
 * BuyerDashboard — My Requests + My Tokens (owned ASAs)
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getBuyerRequests } from '../utils/api';

const TABS = [
  { id: 'requests', label: '📨 My Requests'   },
  { id: 'tokens',   label: '🪙 My Tokens'     },
];

const STATUS_META = {
  pending:   { label:'Pending Response', cls:'badge-pending',  icon:'⏳' },
  accepted:  { label:'Accepted — Pay Now', cls:'badge-accepted', icon:'✅' },
  rejected:  { label:'Rejected by Seller', cls:'badge-rejected', icon:'❌' },
  completed: { label:'Purchase Complete',  cls:'badge-verified', icon:'🎉' },
  expired:   { label:'Expired',           cls:'badge-rejected', icon:'⌛' },
};

export default function BuyerDashboard() {
  const { wallet, isVerified, setShowKYCModal } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('requests');

  if (!wallet) return (
    <div className="dash-guard">
      <div>🔗</div><h2>Connect your wallet first</h2>
      <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
    </div>
  );
  if (!isVerified) return (
    <div className="dash-guard">
      <div>🪪</div><h2>KYC required to access dashboard</h2>
      <button className="btn btn-primary" onClick={() => setShowKYCModal(true)}>Complete KYC</button>
    </div>
  );

  return (
    <div className="dash page-enter">
      <div className="container">
        <div className="dash-header">
          <h1 className="heading-1">Buyer Dashboard</h1>
          <p className="subtitle">Track your buy requests and owned property tokens.</p>
        </div>

        <div className="dash-tabs">
          {TABS.map(t => (
            <button key={t.id} id={`buyer-tab-${t.id}`}
              className={`dash-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'requests' && <MyRequestsTab wallet={wallet} />}
        {tab === 'tokens'   && <MyTokensTab  wallet={wallet} />}
      </div>
    </div>
  );
}

function MyRequestsTab({ wallet }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    getBuyerRequests(wallet).then(r => setRequests(r.requests || [])).finally(() => setLoading(false));
  }, [wallet]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="dash-loading"><span className="spinner spinner-lg" /></div>;
  if (!requests.length) return (
    <div className="dash-empty">
      <span>📨</span>
      <p>You haven't sent any buy requests yet.</p>
      <button className="btn btn-primary" onClick={() => navigate('/marketplace')} id="buyer-browse-cta">
        Browse Properties
      </button>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {requests.map(r => {
        const s = STATUS_META[r.status] || STATUS_META.pending;
        const priceAlgo = (r.offered_price_microalgo / 1_000_000).toLocaleString();
        const date = new Date(r.created_at + 'Z').toLocaleDateString('en-IN', {
          day:'2-digit', month:'short', year:'numeric'
        });

        return (
          <div key={r.id} className="card" style={{ display:'flex', flexDirection:'column', gap:12 }}
            id={`buyer-req-${r.id}`}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontWeight:600, fontSize:'0.95rem', color:'#e8eaf6' }}>
                  {r.listing_title || 'Property'}
                </div>
                <div style={{ fontSize:'0.78rem', color:'#64748b', marginTop:2 }}>{date}</div>
              </div>
              <span className={`badge ${s.cls}`}>{s.icon} {s.label}</span>
            </div>

            <div style={{ display:'flex', gap:20, fontSize:'0.84rem', color:'#94a3b8' }}>
              <span>💰 Offer: {priceAlgo} ALGO</span>
              {r.asset_id && <span>🔑 ASA: {r.asset_id}</span>}
            </div>

            {r.status === 'accepted' && (
              <div style={{
                background:'rgba(0,212,170,0.08)', border:'1px solid rgba(0,212,170,0.2)',
                borderRadius:10, padding:'12px 16px', fontSize:'0.85rem'
              }}>
                <div style={{ color:'#00d4aa', fontWeight:600, marginBottom:4 }}>
                  ✅ Seller Accepted Your Offer!
                </div>
                <div style={{ color:'#94a3b8', lineHeight:1.6 }}>
                  Your tokens are reserved. The platform is processing the settlement.
                  Once confirmed, tokens will appear in your wallet automatically.
                </div>
              </div>
            )}

            {r.status === 'completed' && (
              <div style={{
                background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)',
                borderRadius:10, padding:'12px 16px', fontSize:'0.85rem'
              }}>
                <div style={{ color:'#10b981', fontWeight:600, marginBottom:4 }}>
                  🎉 Purchase Complete
                </div>
                {r.settlement_txid && (
                  <a href={`https://lora.algokit.io/testnet/transaction/${r.settlement_txid}`}
                    target="_blank" rel="noreferrer" style={{ color:'#6c63ff', fontSize:'0.82rem' }}>
                    View settlement transaction ↗
                  </a>
                )}
              </div>
            )}

            <button className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-start' }}
              onClick={() => navigate(`/property/${r.listing_id}`)}>
              View Property ↗
            </button>
          </div>
        );
      })}
    </div>
  );
}

function MyTokensTab({ wallet }) {
  return (
    <div className="dash-empty" style={{ minHeight:300 }}>
      <span>🪙</span>
      <h3 style={{ color:'#e8eaf6', fontFamily:'Space Grotesk' }}>Token portfolio coming soon</h3>
      <p>Connect Pera Wallet to view ASAs held in your account.</p>
      <a href={`https://lora.algokit.io/testnet/account/${wallet}`}
        target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
        View on Explorer ↗
      </a>
    </div>
  );
}
