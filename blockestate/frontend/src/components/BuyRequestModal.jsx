/**
 * BuyRequestModal — buyer sends a buy request for a listing
 */
import { useState } from 'react';
import { sendBuyRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './BuyRequestModal.css';

export default function BuyRequestModal({ listing, onClose, onSuccess }) {
  const { wallet } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const priceAlgo = listing.price_microalgo / 1_000_000;

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await sendBuyRequest({
        listing_id:              listing.id,
        buyer_wallet:            wallet,
        token_count:             listing.token_count || 1,
        offered_price_microalgo: listing.price_microalgo,
        message,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box page-enter" id="buy-request-modal">
        <div className="modal-header">
          <h2>🤝 Send Buy Request</h2>
          <button className="modal-close" onClick={onClose} id="buy-modal-close">✕</button>
        </div>

        <div className="modal-body">
          {/* Property Summary */}
          <div className="buy-modal-summary">
            <div className="buy-modal-title">{listing.title}</div>
            <div className="buy-modal-location">
              📍 {[listing.land_record?.location?.village, listing.land_record?.location?.district]
                    .filter(Boolean).join(', ')}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="buy-modal-price-card">
            <div className="buy-modal-price-row">
              <span>Offer Price</span>
              <span className="buy-modal-price-val">{priceAlgo.toLocaleString()} ALGO</span>
            </div>
            {listing.price_inr > 0 && (
              <div className="buy-modal-price-row">
                <span>Approx. INR</span>
                <span>₹{listing.price_inr.toLocaleString()}</span>
              </div>
            )}
            <div className="buy-modal-price-row">
              <span>Platform Fee</span>
              <span>{listing.commission_pct || 2}%</span>
            </div>
            <div className="divider" style={{ margin: '10px 0' }} />
            <div className="buy-modal-price-row">
              <span style={{ fontWeight: 600 }}>You Pay</span>
              <span className="buy-modal-total">{priceAlgo.toLocaleString()} ALGO</span>
            </div>
          </div>

          {/* Note to seller */}
          <div className="input-group">
            <label className="input-label">Message to Seller (optional)</label>
            <textarea
              id="buy-modal-message"
              className="input"
              rows={3}
              placeholder="E.g. I'm interested. Please share more documents."
              value={message}
              onChange={e => setMessage(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Wallet display */}
          <div className="buy-modal-wallet">
            <span className="label">Your Wallet</span>
            <code>{wallet?.slice(0,16)}...{wallet?.slice(-8)}</code>
          </div>

          {error && <div className="kyc-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" id="buy-modal-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" /> Sending...</> : '🚀 Send Buy Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
