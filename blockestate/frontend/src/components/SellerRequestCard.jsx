/**
 * SellerRequestCard — shows an incoming buy request to the seller
 * with Accept / Reject actions
 */
import { useState } from 'react';
import { acceptRequest, rejectRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLE = {
  pending:   { label: 'Pending',   cls: 'badge-pending'   },
  accepted:  { label: 'Accepted',  cls: 'badge-accepted'  },
  rejected:  { label: 'Rejected',  cls: 'badge-rejected'  },
  completed: { label: 'Completed', cls: 'badge-verified'  },
  expired:   { label: 'Expired',   cls: 'badge-rejected'  },
};

export default function SellerRequestCard({ req, onRefresh }) {
  const { wallet } = useAuth();
  const [loading, setLoading] = useState(null); // 'accept' | 'reject' | null
  const [error, setError]     = useState('');

  const status = STATUS_STYLE[req.status] || STATUS_STYLE.pending;
  const priceAlgo = (req.offered_price_microalgo / 1_000_000).toLocaleString();
  const date = new Date(req.created_at + 'Z').toLocaleDateString('en-IN', {
    day:'2-digit', month:'short', year:'numeric'
  });

  const handle = async (action) => {
    setError('');
    setLoading(action);
    try {
      if (action === 'accept') {
        await acceptRequest(req.id, wallet);
      } else {
        await rejectRequest(req.id, wallet);
      }
      onRefresh?.();
    } catch (err) {
      setError(err?.response?.data?.error || `Failed to ${action} request.`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="card" style={{ display:'flex', flexDirection:'column', gap:12 }}
      id={`seller-req-${req.id}`}>
      {/* Header row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontWeight:600, fontSize:'0.9rem', color:'#e8eaf6', marginBottom:2 }}>
            {req.listing_title || 'Property Listing'}
          </div>
          <div style={{ fontSize:'0.78rem', color:'#64748b' }}>{date}</div>
        </div>
        <span className={`badge ${status.cls}`}>{status.label}</span>
      </div>

      {/* Buyer info */}
      <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'10px 14px' }}>
        <div style={{ fontSize:'0.8rem', color:'#94a3b8', marginBottom:4 }}>Buyer</div>
        <div style={{ fontWeight:600, fontSize:'0.92rem', display:'flex', alignItems:'center', gap:8 }}>
          {req.buyer_name || 'Anonymous'}
          {req.buyer_kyc_status === 'verified' && (
            <span className="badge badge-verified" style={{ fontSize:'0.68rem' }}>✓ KYC</span>
          )}
        </div>
        <code style={{ fontSize:'0.76rem', color:'#64748b' }}>
          {req.buyer_wallet?.slice(0,16)}...{req.buyer_wallet?.slice(-6)}
        </code>
      </div>

      {/* Offer */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ color:'#94a3b8', fontSize:'0.85rem' }}>Offer Price</span>
        <span style={{
          fontFamily:'Space Grotesk',
          fontWeight:700,
          background:'linear-gradient(135deg,#6c63ff,#8b5cf6)',
          WebkitBackgroundClip:'text',
          WebkitTextFillColor:'transparent',
          backgroundClip:'text',
        }}>{priceAlgo} ALGO</span>
      </div>

      {req.message && (
        <div style={{
          background:'rgba(108,99,255,0.06)', borderRadius:8,
          padding:'8px 12px', fontSize:'0.82rem', color:'#94a3b8',
          fontStyle:'italic'
        }}>
          "{req.message}"
        </div>
      )}

      {error && <div className="kyc-error" style={{ margin:0 }}>{error}</div>}

      {/* Actions */}
      {req.status === 'pending' && (
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-danger btn-sm" style={{ flex:1 }}
            id={`reject-req-${req.id}`}
            onClick={() => handle('reject')}
            disabled={loading !== null}>
            {loading === 'reject' ? <span className="spinner" /> : '✕ Reject'}
          </button>
          <button className="btn btn-accent btn-sm" style={{ flex:1 }}
            id={`accept-req-${req.id}`}
            onClick={() => handle('accept')}
            disabled={loading !== null}>
            {loading === 'accept' ? <span className="spinner" /> : '✓ Accept'}
          </button>
        </div>
      )}

      {req.status === 'accepted' && (
        <div style={{
          background:'rgba(0,212,170,0.08)', border:'1px solid rgba(0,212,170,0.2)',
          borderRadius:8, padding:'10px 12px', fontSize:'0.82rem', color:'#00d4aa'
        }}>
          ✅ Accepted — awaiting buyer payment to complete transfer.
        </div>
      )}

      {req.status === 'completed' && (
        <div style={{
          background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)',
          borderRadius:8, padding:'10px 12px', fontSize:'0.82rem', color:'#10b981'
        }}>
          🎉 Sold! Token transferred to buyer.
          {req.settlement_txid && (
            <a href={`https://lora.algokit.io/testnet/transaction/${req.settlement_txid}`}
              target="_blank" rel="noreferrer" style={{ color:'#6c63ff', marginLeft:8 }}>
              View on Explorer ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
