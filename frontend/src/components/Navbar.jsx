import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Wallet, ChevronDown, Menu, X, BadgeCheck, LogOut,
  LayoutList, ShoppingBag, ShieldCheck, Zap
} from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import './Navbar.css'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/ownership-check', label: 'Check Ownership' },
  { to: '/sell', label: 'Sell Property' },
  { to: '/activity', label: 'My Activity' },
]

export default function Navbar() {
  const {
    wallet,
    connecting,
    connect,
    disconnect,
    isConnected,
    setWallet,
  } = useWallet()

  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false)
      }
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

  const handleConnect = async () => {
    try {
      const connectedWallet = await connect()

      const walletAddress =
        connectedWallet?.address ||
        connectedWallet?.wallet_address ||
        wallet?.address ||
        wallet?.wallet_address

      if (!walletAddress) {
        console.error('Wallet address not found after connect')
        return
      }

      const res = await fetch('http://localhost:5000/add-new-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error(data.error || 'Failed to add/update user')
        return
      }

      const updatedWallet = {
        ...(connectedWallet || wallet || {}),
        address: walletAddress,
        wallet_address: walletAddress,
        short:
          connectedWallet?.short ||
          wallet?.short ||
          `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        name: connectedWallet?.name || wallet?.name || 'User',
        algo_balance: connectedWallet?.algo_balance ?? wallet?.algo_balance ?? 0,
        kyc_status: data.kyc_status || connectedWallet?.kyc_status || wallet?.kyc_status || 'none',
      }

      if (typeof setWallet === 'function') {
        setWallet(updatedWallet)
      }

      setMobileOpen(false)
    } catch (error) {
      console.error('Connect failed:', error)
    }
  }

  return (
    <nav className="navbar" id="main-navbar">
      <div className="container navbar-inner">
        <Link to="/" className="nav-logo" onClick={() => setMobileOpen(false)}>
          <span className="nav-logo-text">D-LAND</span>
        </Link>

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

        <div className="nav-right">
          {!isConnected ? (
            <button
              id="btn-connect-wallet"
              className="btn btn-blue"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? (
                <>
                  <div className="spinner" style={{ borderTopColor: '#fff' }} />
                  Connecting…
                </>
              ) : (
                <>
                  <Wallet size={15} />
                  Connect Wallet
                </>
              )}
            </button>
          ) : (
            <div className="wallet-menu" ref={dropRef}>
              <button
                className="wallet-trigger"
                onClick={() => setDropOpen((o) => !o)}
                id="btn-wallet-menu"
              >
                <div className="wallet-dot" />
                <span className="wallet-short">
                  {wallet?.short || `${wallet?.address?.slice(0, 6)}...${wallet?.address?.slice(-4)}`}
                </span>
                {wallet?.kyc_status === 'verified' && (
                  <BadgeCheck size={14} className="kyc-tick" />
                )}
                <ChevronDown size={13} className={`drop-caret ${dropOpen ? 'open' : ''}`} />
              </button>

              {dropOpen && (
                <div className="wallet-dropdown anim-fade">
                  <div className="wdrop-head">
                    <div className="avatar">{wallet?.name?.charAt(0) || 'U'}</div>
                    <div>
                      <div className="wdrop-name">{wallet?.name || 'User'}</div>
                      <div className="wdrop-addr">
                        {wallet?.short || wallet?.address || wallet?.wallet_address}
                      </div>
                    </div>
                    {wallet?.kyc_status === 'verified' && (
                      <span className="badge badge-success">
                        <BadgeCheck size={9} /> KYC
                      </span>
                    )}
                  </div>

                  {(wallet?.algo_balance ?? 0) > 0 && (
                    <div className="wdrop-balance">
                      <Zap size={12} />
                      <span>{wallet.algo_balance.toLocaleString()} ALGO</span>
                    </div>
                  )}

                  <div className="divider my-8" />

                  <Link
                    to="/activity?tab=listings"
                    className="wdrop-item"
                    onClick={() => setDropOpen(false)}
                  >
                    <LayoutList size={14} /> My Listings
                  </Link>

                  <Link
                    to="/activity?tab=requests"
                    className="wdrop-item"
                    onClick={() => setDropOpen(false)}
                  >
                    <ShoppingBag size={14} /> Purchase Requests
                  </Link>

                  <Link
                    to="/activity?tab=kyc"
                    className="wdrop-item"
                    onClick={() => setDropOpen(false)}
                  >
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

          <button
            className="nav-hamburger btn btn-ghost btn-icon"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

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
              <button
                className="btn btn-blue w-full"
                onClick={handleConnect}
                disabled={connecting}
              >
                <Wallet size={15} />
                {connecting ? 'Connecting…' : 'Connect Wallet'}
              </button>
            ) : (
              <button
                className="btn btn-danger w-full"
                onClick={() => {
                  handleDisconnect()
                  setMobileOpen(false)
                }}
              >
                <LogOut size={15} />
                Disconnect
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}