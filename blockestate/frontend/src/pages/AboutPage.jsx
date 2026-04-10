export default function AboutPage() {
  return (
    <div className="about-page">

      {/* Hero */}
      <div className="about-hero">
        <div className="hero-badge">How It Works</div>
        <h1 className="hero-title">Real Estate.<br /><span className="accent">Reimagined on Blockchain.</span></h1>
        <p className="hero-sub">
          BlockEstate eliminates fraud, removes middlemen, and makes property ownership
          transparent, verifiable, and trustless — powered by Algorand.
        </p>
      </div>

      {/* Problem */}
      <section className="about-section">
        <h2>😤 The Problem</h2>
        <div className="problem-grid">
          {[
            { icon: "🏚️", title: "Double Selling", desc: "Brokers fraudulently sell the same property to multiple buyers, causing massive financial loss." },
            { icon: "📁", title: "Centralized Records", desc: "Ownership records stored in government databases are tamperable and prone to corruption." },
            { icon: "🤝", title: "Trust in Middlemen", desc: "Buyers and sellers are forced to trust brokers, lawyers, and banks — all of whom charge fees." },
            { icon: "🔍", title: "No Real-Time Verification", desc: "There's no easy way to verify property ownership instantly without going through bureaucracy." },
          ].map((p) => (
            <div key={p.title} className="problem-card">
              <div className="step-icon">{p.icon}</div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Solution */}
      <section className="about-section">
        <h2>💡 Our Solution</h2>
        <div className="solution-box">
          <p>
            BlockEstate converts each property into a unique <strong>Algorand Standard Asset (ASA)</strong> —
            a blockchain token with a total supply of exactly <strong>1</strong>.
            This makes it mathematically impossible to sell the same property twice.
            Smart contracts handle the entire transaction — no trust in humans required.
          </p>
        </div>
      </section>

      {/* Core Concepts */}
      <section className="about-section">
        <h2>🧠 Core Concepts</h2>
        <div className="concepts-grid">

          <div className="concept-card">
            <div className="concept-number">01</div>
            <h3>Property Tokenization (ASA)</h3>
            <p>Every property is minted as an Algorand Standard Asset with a supply of 1. Think of it as a digital title deed that lives on the blockchain.</p>
            <div className="concept-tag">Non-Fungible • Unique • Permanent</div>
          </div>

          <div className="concept-card">
            <div className="concept-number">02</div>
            <h3>Smart Contract Escrow</h3>
            <p>When a buyer initiates a purchase, the smart contract locks the payment. Neither party can cheat — the contract enforces all rules automatically.</p>
            <div className="concept-tag">Trustless • Automated • Immutable</div>
          </div>

          <div className="concept-card">
            <div className="concept-number">03</div>
            <h3>Atomic Transfer</h3>
            <p>The property token and payment swap happens atomically — either both happen or neither does. No partial transactions, no scams.</p>
            <div className="concept-tag">All-or-Nothing • Instant • Verified</div>
          </div>

          <div className="concept-card">
            <div className="concept-number">04</div>
            <h3>On-Chain Broker</h3>
            <p>Brokers register on the platform and earn commission automatically via smart contract. Their reputation score is tracked on-chain.</p>
            <div className="concept-tag">Transparent • Accountable • Fair</div>
          </div>

        </div>
      </section>

      {/* Flow */}
      <section className="about-section">
        <h2>🔄 Step-by-Step Flow</h2>

        <div className="flow-section">
          <h3>🏡 Property Registration</h3>
          <div className="flow-steps-vertical">
            {[
              { step: "1", text: "Seller submits property details + document hash (IPFS)" },
              { step: "2", text: "Admin verifies the submission" },
              { step: "3", text: "Admin approves → system automatically mints ASA on Algorand" },
              { step: "4", text: "Smart contract is deployed with escrow logic" },
              { step: "5", text: "Property goes live on the marketplace" },
            ].map((s) => (
              <div key={s.step} className="flow-step-v">
                <div className="flow-num">{s.step}</div>
                <div className="flow-text">{s.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flow-section">
          <h3>💰 Property Purchase</h3>
          <div className="flow-steps-vertical">
            {[
              { step: "1", text: "Buyer connects Pera Wallet" },
              { step: "2", text: "Buyer opts into the ASA (tells blockchain: I can receive this token)" },
              { step: "3", text: "Buyer sends ALGO payment → contract locks it in escrow" },
              { step: "4", text: "Contract verifies: seller owns the ASA ✅ payment is correct ✅" },
              { step: "5", text: "Seller confirms transfer → contract releases ASA to buyer + ALGO to seller + commission to broker" },
            ].map((s) => (
              <div key={s.step} className="flow-step-v">
                <div className="flow-num">{s.step}</div>
                <div className="flow-text">{s.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flow-section">
          <h3>🔍 Ownership Verification</h3>
          <div className="flow-steps-vertical">
            {[
              { step: "1", text: "Anyone can look up the ASA ID on Algorand Explorer" },
              { step: "2", text: "The current holder of the token = the legal owner" },
              { step: "3", text: "Full transaction history is public and permanent" },
            ].map((s) => (
              <div key={s.step} className="flow-step-v">
                <div className="flow-num">{s.step}</div>
                <div className="flow-text">{s.text}</div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* Tech Stack */}
      <section className="about-section">
        <h2>🛠️ Tech Stack</h2>
        <div className="tech-grid">
          {[
            { layer: "Blockchain",      tech: "Algorand Testnet",     why: "Fast, cheap, carbon-neutral" },
            { layer: "Token Standard",  tech: "ASA",                  why: "Built-in NFT standard on Algorand" },
            { layer: "Smart Contract",  tech: "PyTeal",               why: "Python-based Algorand contract language" },
            { layer: "Backend",         tech: "Flask + algosdk",      why: "Minting, deploying, reading contract state" },
            { layer: "Frontend",        tech: "React + algosdk",      why: "Wallet connect, transaction signing" },
            { layer: "Wallet",          tech: "Pera Wallet",          why: "Mobile Algorand wallet for signing txns" },
            { layer: "Storage",         tech: "IPFS",                 why: "Decentralized document storage" },
          ].map((t) => (
            <div key={t.layer} className="tech-card">
              <div className="tech-layer">{t.layer}</div>
              <div className="tech-name">{t.tech}</div>
              <div className="tech-why">{t.why}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Algorand */}
      <section className="about-section">
        <h2>🔗 Why Algorand?</h2>
        <div className="algo-grid">
          {[
            { icon: "⚡", title: "4 Second Finality", desc: "Transactions confirmed in 4 seconds. No waiting for block confirmations." },
            { icon: "💸", title: "Near-Zero Fees", desc: "0.001 ALGO per transaction. Real estate on blockchain is actually affordable." },
            { icon: "🌱", title: "Carbon Neutral", desc: "Algorand is the world's first carbon-negative blockchain." },
            { icon: "🔒", title: "Pure Proof of Stake", desc: "Mathematically secure consensus. No mining, no energy waste." },
          ].map((a) => (
            <div key={a.title} className="step-card">
              <div className="step-icon">{a.icon}</div>
              <h3>{a.title}</h3>
              <p>{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}