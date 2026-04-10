/**
 * KYCModal — full-screen KYC gate shown on first visit
 * Multi-step: 1) Connect Wallet → 2) Identity → 3) Aadhaar → 4) PAN → 5) Done
 */
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitKYC } from '../utils/api';
import './KYCModal.css';

const STEPS = ['Wallet', 'Identity', 'Aadhaar', 'PAN & Phone', 'Verified'];

export default function KYCModal({ onClose }) {
  const { wallet, connectWallet, walletLoading, refetchKYC } = useAuth();
  const [step, setStep]       = useState(wallet ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({
    full_name: '', dob: '',
    aadhaar: '',
    pan: '', phone: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleConnect = async () => {
    const addr = await connectWallet();
    if (addr) setStep(1);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await submitKYC({
        wallet_address: wallet,
        full_name: form.full_name,
        aadhaar:   form.aadhaar.replace(/\s/g, ''),
        pan:       form.pan.toUpperCase(),
        phone:     form.phone,
        dob:       form.dob,
      });
      await refetchKYC();
      setStep(4);
    } catch (err) {
      setError(err?.response?.data?.error || 'Verification failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kyc-overlay">
      <div className="kyc-modal">
        {/* Header */}
        <div className="kyc-header">
          <div className="kyc-logo">
            <span className="kyc-logo-icon">🏛</span>
            <span>D-Land KYC</span>
          </div>
          <p className="kyc-subtitle">Verify your identity to access the marketplace</p>

          {/* Step indicator */}
          <div className="kyc-steps">
            {STEPS.map((s, i) => (
              <div key={s} className={`kyc-step ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                <div className="kyc-step-dot">
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="kyc-step-label hide-mobile">{s}</span>
                {i < STEPS.length - 1 && <div className="kyc-step-line" />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="kyc-body">
          {error && <div className="kyc-error">{error}</div>}

          {/* Step 0: Connect Wallet */}
          {step === 0 && (
            <div className="kyc-step-content page-enter">
              <div className="kyc-step-icon">🔗</div>
              <h2>Connect Your Wallet</h2>
              <p>Connect your Algorand wallet to get started. Your wallet address will be linked to your identity.</p>
              <button className="btn btn-primary btn-lg w-full" onClick={handleConnect} disabled={walletLoading} id="kyc-connect-wallet">
                {walletLoading ? <><span className="spinner" /> Connecting...</> : '⚡ Connect Algorand Wallet'}
              </button>
              <p className="kyc-hint">Supports Pera Wallet, Defly & AlgoSigner</p>
            </div>
          )}

          {/* Step 1: Full Name + DOB */}
          {step === 1 && (
            <div className="kyc-step-content page-enter">
              <div className="kyc-step-icon">👤</div>
              <h2>Personal Details</h2>
              <p>Enter your details exactly as they appear on your Aadhaar card.</p>
              <div className="kyc-form">
                <div className="input-group">
                  <label className="input-label">Full Name (as on Aadhaar)</label>
                  <input id="kyc-full-name" className="input" placeholder="e.g. Ramesh Kumar Gowda"
                    value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Date of Birth</label>
                  <input id="kyc-dob" className="input" type="date"
                    value={form.dob} onChange={e => set('dob', e.target.value)} />
                </div>
              </div>
              <button className="btn btn-primary btn-lg w-full" id="kyc-next-identity"
                disabled={!form.full_name.trim()}
                onClick={() => setStep(2)}>
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Aadhaar */}
          {step === 2 && (
            <div className="kyc-step-content page-enter">
              <div className="kyc-step-icon">🪪</div>
              <h2>Aadhaar Verification</h2>
              <p>Enter your 12-digit Aadhaar number. We store only a secure hash — never the raw number.</p>
              <div className="kyc-form">
                <div className="input-group">
                  <label className="input-label">Aadhaar Number</label>
                  <input id="kyc-aadhaar" className="input" placeholder="1234 5678 9012"
                    maxLength={14}
                    value={form.aadhaar}
                    onChange={e => {
                      const v = e.target.value.replace(/[^\d]/g, '');
                      const formatted = v.match(/.{1,4}/g)?.join(' ') || v;
                      set('aadhaar', formatted);
                    }} />
                </div>
                <div className="kyc-privacy-note">
                  🔒 Your Aadhaar is hashed with SHA-256 and never stored in plain text.
                </div>
              </div>
              <div className="kyc-actions">
                <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary btn-lg" id="kyc-next-aadhaar"
                  disabled={form.aadhaar.replace(/\s/g,'').length !== 12}
                  onClick={() => setStep(3)}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: PAN + Phone */}
          {step === 3 && (
            <div className="kyc-step-content page-enter">
              <div className="kyc-step-icon">📋</div>
              <h2>PAN & Phone</h2>
              <p>Required for property transaction compliance.</p>
              <div className="kyc-form">
                <div className="input-group">
                  <label className="input-label">PAN Number</label>
                  <input id="kyc-pan" className="input" placeholder="ABCDE1234F"
                    maxLength={10} style={{ textTransform: 'uppercase' }}
                    value={form.pan} onChange={e => set('pan', e.target.value.toUpperCase())} />
                </div>
                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <input id="kyc-phone" className="input" placeholder="+91 9876543210" type="tel"
                    value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>
              <div className="kyc-actions">
                <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-primary btn-lg" id="kyc-submit"
                  disabled={form.pan.length !== 10 || form.phone.length < 10 || loading}
                  onClick={handleSubmit}>
                  {loading ? <><span className="spinner" /> Verifying...</> : '✅ Verify & Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="kyc-step-content page-enter">
              <div className="kyc-success-animation">
                <div className="kyc-success-ring" />
                <div className="kyc-step-icon">✅</div>
              </div>
              <h2>KYC Verified!</h2>
              <p>Your identity has been verified. You can now list properties and send buy requests.</p>
              <div className="kyc-wallet-display">
                <span className="label">Connected Wallet</span>
                <code className="kyc-address">{wallet?.slice(0,16)}...{wallet?.slice(-8)}</code>
              </div>
              <button className="btn btn-accent btn-lg w-full" id="kyc-enter-marketplace" onClick={onClose}>
                🚀 Enter Marketplace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
