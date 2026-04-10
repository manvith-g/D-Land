/**
 * LandingPage — Hero + How It Works + CTA
 */
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const HOW_IT_WORKS = [
  {
    icon: '🪪',
    title: 'Complete KYC',
    desc: 'Verify your identity once with Aadhaar + PAN. Your data is hashed — never stored in plain text.',
  },
  {
    icon: '🏛',
    title: 'Verify Property',
    desc: 'Enter your Survey Number or RERA ID. We cross-match it with government land records to confirm ownership.',
  },
  {
    icon: '⬡',
    title: 'Mint on Algorand',
    desc: 'Once verified, the platform mints an ASA (Algorand Standard Asset) representing your property token.',
  },
  {
    icon: '🤝',
    title: 'Buy & Sell',
    desc: 'Buyers browse the marketplace, send offers, and complete purchases. Tokens transfer automatically on settlement.',
  },
];

const STATS = [
  { label: 'Verified Properties', value: '200+' },
  { label: 'Built on Algorand',   value: '⬡'    },
  { label: 'Transaction Fees',    value: '< ₹1'  },
  { label: 'Settlement Time',     value: '~4s'   },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { wallet, connectWallet, walletLoading, setShowKYCModal, isVerified } = useAuth();

  const handleCTA = async () => {
    if (!wallet) {
      await connectWallet();
    } else if (!isVerified) {
      setShowKYCModal(true);
    } else {
      navigate('/marketplace');
    }
  };

  return (
    <div className="landing page-enter">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-glow" />
        <div className="container landing-hero-inner">
          <div className="landing-hero-badge">
            <span className="badge badge-verified" style={{ fontSize:'0.8rem' }}>⬡ Built on Algorand</span>
          </div>

          <h1 className="display-1">
            Real Estate,<br />
            <span className="gradient-text">Tokenized on Chain.</span>
          </h1>

          <p className="subtitle" style={{ maxWidth:560, margin:'20px 0 36px' }}>
            Buy and sell verified land parcels as Algorand tokens. Every listing is KYC-verified,
            government-record backed, and settled on-chain in seconds.
          </p>

          <div className="landing-hero-cta">
            <button className="btn btn-primary btn-lg" id="landing-cta-primary"
              onClick={handleCTA} disabled={walletLoading}>
              {walletLoading
                ? <><span className="spinner" /> Connecting...</>
                : !wallet ? '⚡ Connect & Start'
                : !isVerified ? '🪪 Complete KYC'
                : '🏘 Browse Properties'}
            </button>
            <button className="btn btn-ghost btn-lg" id="landing-cta-secondary"
              onClick={() => navigate('/marketplace')}>
              View Marketplace →
            </button>
          </div>

          {/* Stats row */}
          <div className="landing-stats">
            {STATS.map(s => (
              <div key={s.label} className="landing-stat">
                <div className="landing-stat-val">{s.value}</div>
                <div className="landing-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="landing-how">
        <div className="container">
          <div className="text-center" style={{ marginBottom:48 }}>
            <h2 className="display-2">How It Works</h2>
            <p className="subtitle" style={{ marginTop:8 }}>
              From KYC to on-chain ownership in 4 simple steps.
            </p>
          </div>

          <div className="landing-steps">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="landing-step-card">
                <div className="landing-step-num">{i + 1}</div>
                <div className="landing-step-icon">{step.icon}</div>
                <h3 className="landing-step-title">{step.title}</h3>
                <p className="landing-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Algorand ─────────────────────────────────────── */}
      <section className="landing-why">
        <div className="container">
          <div className="landing-why-card">
            <div className="landing-why-left">
              <h2 className="display-2">Why <span className="accent-text">Algorand</span>?</h2>
              <ul className="landing-why-list">
                {[
                  ['⚡', 'Instant finality', '~3.7s block time, no forks'],
                  ['💸', 'Micro fees',        '<0.001 ALGO per transaction'],
                  ['🔒', 'Carbon-neutral',    'Pure proof-of-stake chain'],
                  ['🪙', 'Native ASA',        'First-class tokenization standard'],
                ].map(([icon, title, desc]) => (
                  <li key={title} className="landing-why-item">
                    <span className="landing-why-item-icon">{icon}</span>
                    <div>
                      <strong>{title}</strong>
                      <span style={{ color:'#94a3b8', marginLeft:8, fontSize:'0.85rem' }}>{desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="landing-why-right">
              <div className="landing-chain-visual">
                <div className="landing-chain-block">⬡<br /><span>Block N</span></div>
                <div className="landing-chain-arrow">→</div>
                <div className="landing-chain-block active">⬡<br /><span>Property ASA</span></div>
                <div className="landing-chain-arrow">→</div>
                <div className="landing-chain-block">⬡<br /><span>Block N+1</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="landing-final-cta">
        <div className="container text-center">
          <h2 className="display-2">Ready to tokenize your land?</h2>
          <p className="subtitle" style={{ marginTop:8, marginBottom:32 }}>
            Join the future of real estate — transparent, instant, borderless.
          </p>
          <div style={{ display:'flex', justifyContent:'center', gap:14, flexWrap:'wrap' }}>
            <button className="btn btn-primary btn-lg" id="landing-final-seller"
              onClick={() => navigate('/seller')}>
              🏛 List a Property
            </button>
            <button className="btn btn-ghost btn-lg" id="landing-final-buyer"
              onClick={() => navigate('/marketplace')}>
              🛒 Browse Listings
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
