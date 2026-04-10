export default function HomePage({ navigate }) {
  const stats = [
    { label: "Properties Listed", value: "0 Double-Sells" },
    { label: "Blockchain", value: "Algorand" },
    { label: "Trust", value: "100% On-Chain" },
  ];

  return (
    <div className="home">
      <div className="hero">
        <div className="hero-badge">Powered by Algorand ASA</div>
        <h1 className="hero-title">
          Real Estate.<br />
          <span className="accent">Without the Fraud.</span>
        </h1>
        <p className="hero-sub">
          Every property is a unique blockchain asset. One owner. Zero brokers scamming you.
          Smart contracts handle everything.
        </p>
        <div className="hero-actions">
          <button onClick={() => navigate("listings")} className="btn-primary">
            Browse Properties →
          </button>
          <button onClick={() => navigate("register")} className="btn-secondary">
            List Your Property
          </button>
        </div>
      </div>

      <div className="stats-row">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          {[
            { icon: "🏠", title: "Property → ASA", desc: "Each property becomes a unique Algorand Standard Asset. 1 unit. Non-duplicable." },
            { icon: "🔐", title: "Escrow Contract", desc: "Smart contract holds both payment and the asset. No trust needed." },
            { icon: "✅", title: "Atomic Transfer", desc: "ALGO goes to seller. Property token goes to buyer. In one transaction." },
            { icon: "📊", title: "On-Chain Broker", desc: "Commission split handled by contract. No shady middlemen." },
          ].map((step) => (
            <div key={step.title} className="step-card">
              <div className="step-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}