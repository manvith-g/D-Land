import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Wallet, ChevronDown, Menu, X, BadgeCheck, LogOut,
  LayoutList, ShoppingBag, ShieldCheck, Activity, Zap
} from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import './Navbar.css'

const NAV = [
  { to: '/',                label: 'Home' },
  { to: '/marketplace',    label: 'Marketplace' },
  { to: '/ownership-check',label: 'Check Ownership' },
  { to: '/sell',           label: 'Sell Property' },
  { to: '/activity',       label: 'My Activity' },
]

export default function Navbar() {
  const { wallet, connecting, connect, disconnect, isConnected } = useWallet()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const handleDisconnect = async () => {
    await disconnect()
    setDropOpen(false)
    navigate('/')
  }

  return (
    <nav className="navbar" id="main-navbar">
      <div className="container navbar-inner">
        {/* Logo */}
        <Link to="/" className="nav-logo" onClick={() => setMobileOpen(false)}>
          {/* <div className="nav-logo-mark">D</div> */}
          <span className="nav-logo-text">D‑LAND</span>
        </Link>

        {/* Center links */}
        <ul className="nav-links">
          {NAV.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={`nav-link ${isActive(to) ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {label}
                {isActive(to) && <span className="nav-active-dot" />}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right — wallet */}
        <div className="nav-right">
          {!isConnected ? (
            <button
              id="btn-connect-wallet"
              className="btn btn-blue"
              onClick={connect}
              disabled={connecting}
            >
              {connecting
                ? <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Connecting…</>
                : <><Wallet size={15} /> Connect Wallet</>}
            </button>
          ) : (
            <div className="wallet-menu" ref={dropRef}>
              <button
                className="wallet-trigger"
                onClick={() => setDropOpen(o => !o)}
                id="btn-wallet-menu"
              >
                <div className="wallet-dot" />
                <span className="wallet-short">{wallet.short}</span>
                {wallet.kyc_status === 'verified' && (
                  <BadgeCheck size={14} className="kyc-tick" />
                )}
                <ChevronDown size={13} className={`drop-caret ${dropOpen ? 'open' : ''}`} />
              </button>

              {dropOpen && (
                <div className="wallet-dropdown anim-fade">
                  {/* Header */}
                  <div className="wdrop-head">
                    <div className="avatar">{wallet.name?.charAt(0)}</div>
                    <div>
                      <div className="wdrop-name">{wallet.name}</div>
                      <div className="wdrop-addr">{wallet.short}</div>
                    </div>
                    {wallet.kyc_status === 'verified' && (
                      <span className="badge badge-success"><BadgeCheck size={9} /> KYC</span>
                    )}
                  </div>

                  {wallet.algo_balance > 0 && (
                    <div className="wdrop-balance">
                      <Zap size={12} />
                      <span>{wallet.algo_balance.toLocaleString()} ALGO</span>
                    </div>
                  )}

                  <div className="divider my-8" />

                  <Link to="/activity?tab=listings" className="wdrop-item" onClick={() => setDropOpen(false)}>
                    <LayoutList size={14} /> My Listings
                  </Link>
                  <Link to="/activity?tab=requests" className="wdrop-item" onClick={() => setDropOpen(false)}>
                    <ShoppingBag size={14} /> Purchase Requests
                  </Link>
                  <Link to="/activity?tab=kyc" className="wdrop-item" onClick={() => setDropOpen(false)}>
                    <ShieldCheck size={14} /> KYC Status
                  </Link>

                  <div className="divider my-8" />

                  <button className="wdrop-item danger" onClick={handleDisconnect}>
                    <LogOut size={14} /> Disconnect
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hamburger */}
          <button
            className="nav-hamburger btn btn-ghost btn-icon"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="nav-mobile anim-fade">
          <div className="container">
            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`mobile-link ${isActive(to) ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="divider my-16" />
            {!isConnected ? (
              <button className="btn btn-blue w-full" onClick={() => { connect(); setMobileOpen(false) }}>
                <Wallet size={15} /> Connect Wallet
              </button>
            ) : (
              <button className="btn btn-danger w-full" onClick={() => { handleDisconnect(); setMobileOpen(false) }}>
                <LogOut size={15} /> Disconnect
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
