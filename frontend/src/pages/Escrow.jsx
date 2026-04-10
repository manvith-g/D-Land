import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import {
  Lock, CheckCircle, ArrowRight, Zap, Shield, AlertCircle,
  Clock, Building2, ArrowLeft, ExternalLink, RefreshCw
} from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import { ESCROW_RECORDS, PROPERTIES, formatPrice } from '../data/mockData'
import './Escrow.css'

const ESCROW_STAGES = [
  { id: 'initiated',     label: 'Escrow Initiated',    icon: Shield,       desc: 'Buyer request accepted. Escrow contract deployed on Algorand.' },
  { id: 'token_locked',  label: 'Token Locked',         icon: Lock,         desc: 'Seller transferred property token to escrow wallet. Token is locked.' },
  { id: 'payment_locked',label: 'Payment Locked',       icon: Zap,          desc: 'Buyer transferred full payment to escrow wallet. Funds are locked.' },
  { id: 'settled',       label: 'Settlement Complete',  icon: CheckCircle,  desc: 'Atomic swap executed. Token sent to buyer, payment sent to seller.' },
]

const STAGE_INDEX = { initiated: 0, token_locked: 1, payment_locked: 2, settled: 3 }

export default function Escrow() {
  const { id } = useParams()
  const { wallet, isConnected } = useWallet()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [actionDone, setActionDone] = useState('')

  if (!isConnected) { navigate('/'); return null }

  const escrow   = ESCROW_RECORDS.find(e => e.id === id) || ESCROW_RECORDS[0]
  const property = PROPERTIES.find(p => p.id === escrow?.property_id)
  const isBuyer  = wallet?.address === escrow?.buyer_wallet
  const isSeller = wallet?.address === escrow?.seller_wallet || true // mock — show both actions

  const currentStage = STAGE_INDEX[escrow?.status] ?? 0

  const action = async (type) => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1800))
    setLoading(false)
    setActionDone(type)
  }

  if (!escrow) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2>Escrow not found</h2>
        <Link to="/activity" className="btn btn-primary" style={{ marginTop: 16 }}>Go to Activity</Link>
      </div>
    )
  }

  return (
    <div className="escrow-page">
      <div className="container">
        <div className="escrow-breadcrumb">
          <Link to="/activity?tab=escrow" className="btn btn-ghost btn-sm"><ArrowLeft size={14} /> Back to Activity</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-cur">Escrow #{escrow.id.slice(-6).toUpperCase()}</span>
        </div>

        <div className="escrow-page-header animate-fade">
          <div>
            <h1>Escrow Tracker</h1>
            <p>Atomic escrow contract on Algorand</p>
          </div>
          <div className="escrow-id-chip">
            <Zap size={13} />
            {escrow.escrow_address}
            <button className="btn btn-ghost btn-sm"><ExternalLink size={12} /></button>
          </div>
        </div>

        <div className="escrow-layout">
          {/* Timeline */}
          <div className="escrow-main">
            <div className="escrow-timeline card animate-fade">
              <div className="card-body">
                <h3>Transaction Lifecycle</h3>
                <div className="et-stages">
                  {ESCROW_STAGES.map(({ id: sid, label, icon: Icon, desc }, i) => {
                    const done   = i < currentStage
                    const active = i === currentStage
                    return (
                      <div key={sid} className={`et-stage ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
                        <div className="et-stage-left">
                          <div className="et-dot">
                            {done ? <CheckCircle size={16} /> : <Icon size={16} />}
                          </div>
                          {i < ESCROW_STAGES.length - 1 && (
                            <div className={`et-vline ${done ? 'done' : ''}`} />
                          )}
                        </div>
                        <div className="et-stage-content">
                          <div className="et-stage-header">
                            <span className="et-stage-label">{label}</span>
                            {done && <span className="badge badge-success">Complete</span>}
                            {active && <span className="badge badge-warning" style={{ animation: 'pulse 1.5s infinite' }}>In Progress</span>}
                          </div>
                          <p className="et-stage-desc">{desc}</p>

                          {/* Action buttons */}
                          {active && (
                            <div className="et-actions">
                              {sid === 'token_locked' && (isSeller || true) && !actionDone && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => action('token')}
                                  disabled={loading}
                                  id="btn-lock-token"
                                >
                                  {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Locking…</>
                                    : <><Lock size={13} /> Lock Property Token</>}
                                </button>
                              )}
                              {sid === 'payment_locked' && (isBuyer || true) && !actionDone && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => action('payment')}
                                  disabled={loading}
                                  id="btn-lock-payment"
                                >
                                  {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Processing…</>
                                    : <><Zap size={13} /> Lock Payment</>}
                                </button>
                              )}
                              {actionDone && (
                                <div className="alert alert-success" style={{ marginTop: 0 }}>
                                  <CheckCircle size={14} />
                                  {actionDone === 'token' ? 'Token locked in escrow!' : 'Payment locked in escrow!'}
                                  {' '}Waiting for the other party...
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Blockchain log */}
            <div className="escrow-log card animate-fade" style={{ marginTop: 20 }}>
              <div className="card-body">
                <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                  <h3>Blockchain Log</h3>
                  <button className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Refresh</button>
                </div>
                <div className="log-entries">
                  <LogEntry time="09 Apr 2026 14:32" txn="KL7X…P9QR" event="Escrow contract deployed" type="info" />
                  <LogEntry time="09 Apr 2026 14:50" txn="MN2A…W4TU" event="Property token (ASA 4500125) transferred to escrow" type="success" />
                  <LogEntry time="10 Apr 2026 09:15" txn="Pending" event="Waiting for buyer payment…" type="pending" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="escrow-side">
            {/* Property */}
            <div className="card animate-fade">
              <div className="card-body">
                <h4 style={{ marginBottom: 14 }}><Building2 size={15} /> Property</h4>
                {property ? (
                  <>
                    <div className="escrow-prop-img">
                      <span>{property.type === 'flat' ? '🏢' : '🌾'}</span>
                    </div>
                    <div className="escrow-prop-name">{property.title}</div>
                    <div className="escrow-prop-loc">{property.location.city}, {property.location.state}</div>
                    <div className="escrow-prop-price">{formatPrice(property.price)}</div>
                    <Link to={`/properties/${property.id}`} className="btn btn-outline btn-sm w-full" style={{ marginTop: 12 }}>
                      View Property <ExternalLink size={12} />
                    </Link>
                  </>
                ) : <p>Property details unavailable</p>}
              </div>
            </div>

            {/* Parties */}
            <div className="card animate-fade" style={{ marginTop: 16 }}>
              <div className="card-body">
                <h4 style={{ marginBottom: 14 }}>Parties</h4>
                <div className="party-row">
                  <div className="party-role">Buyer</div>
                  <div className="party-info">
                    <div className="avatar avatar-sm">A</div>
                    <div>
                      <div className="party-name">You (Arjun Sharma)</div>
                      <div className="party-status"><CheckCircle size={10} color="var(--clr-success)" /> KYC Verified</div>
                    </div>
                  </div>
                </div>
                <div className="divider divider-sm" />
                <div className="party-row">
                  <div className="party-role">Seller</div>
                  <div className="party-info">
                    <div className="avatar avatar-sm">D</div>
                    <div>
                      <div className="party-name">Deepa Krishnan</div>
                      <div className="party-status"><CheckCircle size={10} color="var(--clr-success)" /> KYC Verified</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Escrow details */}
            <div className="card animate-fade" style={{ marginTop: 16 }}>
              <div className="card-body">
                <h4 style={{ marginBottom: 14 }}>Escrow Details</h4>
                <div className="esc-detail-rows">
                  <div className="esc-row"><span>Amount</span><strong>{formatPrice(escrow.amount)}</strong></div>
                  <div className="esc-row"><span>Token Locked</span><span className={escrow.token_locked ? 'ok' : 'pending-txt'}>{escrow.token_locked ? '✓ Yes' : 'Pending'}</span></div>
                  <div className="esc-row"><span>Payment Locked</span><span className={escrow.payment_locked ? 'ok' : 'pending-txt'}>{escrow.payment_locked ? '✓ Yes' : 'Pending'}</span></div>
                  <div className="esc-row"><span>Created</span><span>{escrow.created_at}</span></div>
                  <div className="esc-row"><span>Updated</span><span>{escrow.updated_at}</span></div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="escrow-security animate-fade">
              <Shield size={14} />
              <p>Funds and tokens are held in a non-custodial Algorand smart contract. No party (including D‑LAND) can access them until both sides fulfill their obligations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LogEntry({ time, txn, event, type }) {
  const colors = { info: 'info', success: 'success', pending: 'warning' }
  return (
    <div className="log-entry">
      <div className={`log-dot ${type}`} />
      <div className="log-content">
        <div className="log-event">{event}</div>
        <div className="log-meta">
          <Clock size={10} /> {time}
          {txn !== 'Pending' && (
            <><span className="mono" style={{ fontSize: '0.72rem' }}> · TXN: {txn}</span>
              <ExternalLink size={10} /></>
          )}
        </div>
      </div>
    </div>
  )
}
