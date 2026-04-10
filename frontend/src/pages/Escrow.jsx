import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  Lock, CheckCircle, ArrowRight, Zap, Shield, AlertCircle,
  Clock, Building2, ArrowLeft, ExternalLink, RefreshCw
} from 'lucide-react'
import algosdk from 'algosdk'
import { Buffer } from 'buffer'
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
  const { wallet, isConnected, peraWallet } = useWallet()
  const navigate = useNavigate()
  const [escrow, setEscrow] = useState(null)
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionDone, setActionDone] = useState('')

  useEffect(() => {
    if (!id) return;
    fetch(`http://127.0.0.1:5000/api/escrow/detail/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEscrow(data.data)
          setProperty(data.data.property)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id, actionDone])

  if (!isConnected) { navigate('/'); return null }
  if (loading && !escrow) return <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}><div className="spinner mt-40" /></div>

  const isBuyer  = wallet?.address === escrow?.buyer_wallet
  const isSeller = wallet?.address === escrow?.seller_wallet
  const currentStage = STAGE_INDEX[escrow?.status] ?? 0

  const action = async (type) => {
    setLoading(true)
    try {
      if (type === 'token') {
        // Server-side action: backend holds the ASA in the creator wallet,
        // so it transfers the ASA to escrow without needing seller's Pera signature.
        const res = await fetch(`http://127.0.0.1:5000/api/escrow/lock-token/${id}`, {
          method: 'POST'
        })
        const data = await res.json()
        if (data.success) {
          setActionDone(type)
        } else {
          alert(`Failed to lock token: ${data.error}`)
        }
      } else {
        // Payment happens via the Buyer's Pera Wallet
        // 1. Fetch the raw, unsigned transaction from the backend
        const res = await fetch(`http://127.0.0.1:5000/api/escrow/build-lock-payment-tx/${id}`)
        const d = await res.json()
        if(!d.success) throw new Error(d.error)

        // 2. Decode the backend's msgpack Base64 array into algosdk Txns
        // We now receive an array containing [OptInTxn, PaymentTxn] grouped
        const txnArray = d.data.map(b64Str => {
          const binaryString = window.atob(b64Str)
          const txnBytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            txnBytes[i] = binaryString.charCodeAt(i)
          }
          return algosdk.decodeUnsignedTransaction(txnBytes)
        })

        // 3. Prompt Pera Wallet to sign BOTH locally exactly for this correct user
        // They must be provided within the same outer array to signify they are a group!
        const signParam = txnArray.map(txn => ({ txn: txn, signers: [wallet.address] }))
        const signedTxnGroup = await peraWallet.signTransaction([ signParam ])
        
        // 4. Submit cryptographically signed msgpacks to backend
        // Combine the Uint8Arrays from each signature so Algorand can unwrap the group
        let totalLength = 0;
        signedTxnGroup.forEach(arr => totalLength += arr.byteLength);
        
        const combinedBytes = new Uint8Array(totalLength);
        let offset = 0;
        signedTxnGroup.forEach(arr => {
          combinedBytes.set(arr, offset);
          offset += arr.byteLength;
        });

        let binaryResult = ''
        for (let i = 0; i < combinedBytes.byteLength; i++) {
          binaryResult += String.fromCharCode(combinedBytes[i])
        }
        const signedB64 = window.btoa(binaryResult)
        
        const submitRes = await fetch(`http://127.0.0.1:5000/api/escrow/submit-signed-lock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ escrow_id: id, signed_b64: signedB64, type })
        })
        
        const submitData = await submitRes.json()
        if(submitData.success) {
          setActionDone(type)
        } else {
          throw new Error(submitData.error)
        }
      }
    } catch(e) {
      console.error(e)
      if (e?.data?.type === 'CONNECT_MODAL_CLOSED') {
        alert("Wallet signature cancelled.")
      } else {
        alert("Error processing lock: " + (e.message || e))
      }
    } finally {
      setLoading(false)
    }
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
                              {/* Stage 0 (Initiated): Lock Token needed */}
                              {sid === 'initiated' && !actionDone && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => action('token')}
                                  disabled={loading}
                                  id="btn-lock-token"
                                >
                                  {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Locking…</>
                                    : <><Lock size={13} /> Lock Property Token {!isSeller && '(Seller Action)'}</>}
                                </button>
                              )}

                              {/* Stage 1 (Token Locked): Lock Payment needed */}
                              {sid === 'token_locked' && !actionDone && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => action('payment')}
                                  disabled={loading}
                                  id="btn-lock-payment"
                                >
                                  {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Processing…</>
                                    : <><Zap size={13} /> Lock Payment {!isBuyer && '(Buyer Action)'}</>}
                                </button>
                              )}

                              {actionDone && (
                                <div className="alert alert-success" style={{ marginTop: 0 }}>
                                  <CheckCircle size={14} />
                                  Action signed and submitted!
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
                  <LogEntry time={new Date(escrow.created_at).toLocaleString()} txn="N/A" event="Escrow contract deployed" type="info" />
                  {escrow.token_locked && <LogEntry time={new Date(escrow.updated_at).toLocaleString()} txn="Algorand" event={`Property token (ASA ${escrow.asset_id}) locked in escrow`} type="success" />}
                  {escrow.payment_locked && <LogEntry time={new Date(escrow.updated_at).toLocaleString()} txn="Algorand" event={`Payment of ${escrow.amount} ALGO locked by buyer`} type="success" />}
                  {!escrow.token_locked && <LogEntry time="Pending" txn="Pending" event="Waiting for seller to lock token..." type="pending" />}
                  {!escrow.payment_locked && escrow.token_locked && <LogEntry time="Pending" txn="Pending" event="Waiting for buyer payment..." type="pending" />}
                  {escrow.status === 'settled' && <LogEntry time={new Date(escrow.updated_at).toLocaleString()} txn="Algorand" event="Atomic swap settled and funds distributed" type="success" />}
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
                {escrow ? (
                  <>
                    <div className="escrow-prop-img">
                      <span>{escrow.property_title?.includes('Flat') ? '🏢' : '🌾'}</span>
                    </div>
                    <div className="escrow-prop-name">{escrow.property_title}</div>
                    <div className="escrow-prop-price">{formatPrice(escrow.amount)}</div>
                    <Link to={`/properties/${escrow.property_id}`} className="btn btn-outline btn-sm w-full" style={{ marginTop: 12 }}>
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
                <div className="party-row" style={{ overflow: 'hidden' }}>
                  <div className="party-role">Buyer</div>
                  <div className="party-info">
                    <div className="avatar avatar-sm">B</div>
                    <div style={{ overflow: 'hidden' }}>
                      <div className="party-name mono text-xs" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{escrow.buyer_wallet}</div>
                      <div className="party-status"><CheckCircle size={10} color="var(--clr-success)" /> KYC Verified</div>
                    </div>
                  </div>
                </div>
                <div className="divider divider-sm" />
                <div className="party-row" style={{ overflow: 'hidden' }}>
                  <div className="party-role">Seller</div>
                  <div className="party-info">
                    <div className="avatar avatar-sm">S</div>
                    <div style={{ overflow: 'hidden' }}>
                      <div className="party-name mono text-xs" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{escrow.seller_wallet}</div>
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
