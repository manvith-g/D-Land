/**
 * Navbar — top navigation with wallet connect, KYC badge, dashboard links
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import KYCStatusBadge from './KYCStatusBadge';
import './Navbar.css';

export default function Navbar() {
  const { wallet, connectWallet, disconnectWallet, walletLoading, setShowKYCModal, isVerified } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleGetStarted = () => {
    if (!wallet) {
      connectWallet();
    } else if (!isVerified) {
      setShowKYCModal(true);
    }
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo" id="nav-logo">
          <span className="navbar-logo-icon">⬡</span>
          <span className="navbar-logo-text">D<span className="navbar-logo-accent">Land</span></span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="navbar-links hide-mobile">
          <Link to="/marketplace" className={`navbar-link ${isActive('/marketplace') ? 'active' : ''}`} id="nav-marketplace">
            Marketplace
          </Link>
          {wallet && isVerified && (
            <>
              <Link to="/seller" className={`navbar-link ${isActive('/seller') ? 'active' : ''}`} id="nav-seller">
                List Property
              </Link>
              <Link to="/buyer" className={`navbar-link ${isActive('/buyer') ? 'active' : ''}`} id="nav-buyer">
                My Purchases
              </Link>
            </>
          )}
          <Link to="/about" className={`navbar-link ${isActive('/about') ? 'active' : ''}`} id="nav-about">
            About
          </Link>
        </div>

        {/* Right side */}
        <div className="navbar-right">
          {wallet && <KYCStatusBadge />}

          {!wallet ? (
            <button className="btn btn-primary" id="nav-connect-wallet"
              onClick={handleGetStarted} disabled={walletLoading}>
              {walletLoading ? <span className="spinner" /> : '⚡ Connect Wallet'}
            </button>
          ) : (
            <div className="navbar-wallet" id="nav-wallet-display">
              <span className="navbar-wallet-addr">
                {wallet.slice(0, 6)}...{wallet.slice(-4)}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={disconnectWallet} id="nav-disconnect">
                Disconnect
              </button>
            </div>
          )}

          {/* Hamburger */}
          <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)} id="nav-menu-toggle">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          <Link to="/marketplace" onClick={() => setMenuOpen(false)} className="navbar-mobile-link">Marketplace</Link>
          {wallet && isVerified && (
            <>
              <Link to="/seller" onClick={() => setMenuOpen(false)} className="navbar-mobile-link">List Property</Link>
              <Link to="/buyer"  onClick={() => setMenuOpen(false)} className="navbar-mobile-link">My Purchases</Link>
            </>
          )}
          <Link to="/about" onClick={() => setMenuOpen(false)} className="navbar-mobile-link">About</Link>
        </div>
      )}
    </nav>
  );
}
