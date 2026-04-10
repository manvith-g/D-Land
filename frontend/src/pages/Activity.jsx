import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { LayoutList, ShoppingBag, Lock, ShieldCheck, Zap, ArrowRight, ExternalLink } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import { PROPERTIES, ESCROW_RECORDS, PURCHASE_REQUESTS, formatPrice, getStatusBadge } from '../data/mockData'
import './Activity.css'

export default function Activity() {
  const { wallet, isConnected } = useWallet()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'listings'

  if (!isConnected) {
    return (
      <div className="container section text-center">
        <h2>Please Connect Wallet</h2>
        <p className="text-gray mt-12 mb-24">Connect your wallet to view your activity.</p>
        <button className="btn btn-blue" onClick={() => alert('Use top right connect button')}>Connect Wallet</button>
      </div>
    )
  }

  // Mock data filtered for the current user
  const myListings = PROPERTIES.filter(p => true) // In a real app: p.owner_wallet === wallet.address
  const myRequests = PURCHASE_REQUESTS.filter(r => true)
  const myEscrow = ESCROW_RECORDS.filter(e => true)

  const TABS = [
    { id: 'listings', label: 'My Listings', icon: LayoutList, count: myListings.length },
    { id: 'requests', label: 'Purchase Requests', icon: ShoppingBag, count: myRequests.length },
    { id: 'escrow', label: 'Escrow Transactions', icon: Lock, count: myEscrow.length },
    { id: 'kyc', label: 'KYC Status', icon: ShieldCheck, count: null },
  ]

  const handleTabChange = (id) => {
    setSearchParams({ tab: id })
  }

  return (
    <div className="activity-page pb-80">
      <div className="mk-header pb-40">
        <div className="container anim-fade">
          <h1>My Activity</h1>
          <p>Manage your listings, track purchase requests, and monitor escrow settlements.</p>
        </div>
      </div>

      <div className="container mt-min-40">
        <div className="act-layout">
          
          {/* Sidebar Navigation */}
          <div className="act-sidebar card p-16 shadow-lg anim-fade">
            <div className="flex flex-col gap-4">
              {TABS.map(({ id, label, icon: Icon, count }) => (
                <button 
                  key={id}
                  className={`act-nav-item ${tab === id ? 'active' : ''}`}
                  onClick={() => handleTabChange(id)}
                >
                  <Icon size={16} />
                  <span className="flex-1 text-left font-weight-500">{label}</span>
                  {count !== null && (
                    <span className="act-badge">{count}</span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="divider my-16" />
            
            <div className="p-12 bg-primary-muted rounded-md border border-primary-dark">
              <div className="text-xs text-primary-deep font-bold flex items-center gap-6 mb-8 uppercase">
                <Zap size={14} /> Connected Wallet
              </div>
              <div className="mono text-sm font-bold text-dark mb-4">{wallet.short}</div>
              <div className="text-xs text-gray">{wallet.algo_balance.toLocaleString()} ALGO</div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="act-content anim-fade-1">
            
            {/* --- LISTINGS TAB --- */}
            {tab === 'listings' && (
              <div className="card shadow-lg mb-24">
                <div className="p-24 border-b border-border flex justify-between items-center">
                  <h3 className="flex items-center gap-8"><LayoutList size={20} className="text-primary-deep"/> My Listed Properties</h3>
                  <Link to="/sell" className="btn btn-primary btn-sm">List New Property</Link>
                </div>
                {myListings.length === 0 ? (
                  <div className="p-40 text-center text-gray">No properties listed yet.</div>
                ) : (
                  <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Property</th>
                          <th>Price</th>
                          <th>Status</th>
                          <th>Token ID</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {myListings.map(p => (
                          <tr key={p.id}>
                            <td>
                              <div className="font-bold text-sm text-dark">{p.title}</div>
                              <div className="text-xs text-gray mt-4">{p.location.city}</div>
                            </td>
                            <td className="font-bold">{formatPrice(p.price)}</td>
                            <td><span className={`badge badge-${getStatusBadge(p.status)}`}>{p.status.toUpperCase()}</span></td>
                            <td>
                              {p.token_id ? <span className="font-bold text-xs text-primary-deep flex items-center gap-4"><Zap size={10} /> {p.token_id}</span> : <span className="text-gray text-xs">—</span>}
                            </td>
                            <td className="text-right">
                              <Link to={`/properties/${p.id}`} className="btn btn-ghost btn-sm">View <ExternalLink size={12} className="ml-1" /></Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* --- REQUESTS TAB --- */}
            {tab === 'requests' && (
              <div className="card shadow-lg mb-24">
                <div className="p-24 border-b border-border">
                  <h3 className="flex items-center gap-8"><ShoppingBag size={20} className="text-primary-deep"/> Purchase Requests</h3>
                </div>
                {myRequests.length === 0 ? (
                  <div className="p-40 text-center text-gray">No purchase requests found.</div>
                ) : (
                  <div className="p-24 flex flex-col gap-16">
                    {myRequests.map(r => (
                      <div key={r.id} className="p-16 border border-border rounded-md bg-surface-2 flex items-center justify-between">
                        <div>
                           <div className="text-xs text-gray uppercase font-bold mb-8">Request on your listing</div>
                           <div className="font-bold text-dark">{r.property_title}</div>
                           <div className="text-sm mt-4">Buyer: {r.buyer_name} <span className="mono text-xs text-gray ml-4">({r.buyer_wallet})</span></div>
                        </div>
                        <div className="text-right">
                           <div className="font-display font-bold text-xl mb-8">{formatPrice(r.amount)}</div>
                           <div className="flex gap-8">
                             <button className="btn btn-primary btn-sm">Accept & Start Escrow</button>
                             <button className="btn btn-outline btn-sm">Decline</button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- ESCROW TAB --- */}
            {tab === 'escrow' && (
              <div className="card shadow-lg mb-24">
                <div className="p-24 border-b border-border">
                  <h3 className="flex items-center gap-8"><Lock size={20} className="text-primary-deep"/> Active Escrow Settlements</h3>
                </div>
                {myEscrow.length === 0 ? (
                  <div className="p-40 text-center text-gray">No active escrow records.</div>
                ) : (
                  <div className="p-24 flex flex-col gap-16">
                    {myEscrow.map(e => (
                      <div key={e.id} className="p-20 border border-border rounded-lg shadow-sm">
                        <div className="flex justify-between items-start mb-16 border-b border-border pb-16">
                          <div>
                            <div className="font-bold text-lg mb-4">{e.property_title}</div>
                            <div className="text-sm text-gray mono flex items-center gap-6"><Zap size={12}/> Contract: {e.escrow_address}</div>
                          </div>
                          <div className="text-right">
                            <span className="badge badge-warning mb-8">Token Locked</span>
                            <div className="font-bold">{formatPrice(e.amount)}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-0 mt-8 mb-16">
                           <div className={`flex-1 text-center py-8 text-xs font-bold rounded-l-md ${e.token_locked ? 'bg-success text-white' : 'bg-gray-200 text-gray'}`}>
                             1. Token Locked
                           </div>
                           <div className={`flex-1 text-center py-8 text-xs font-bold ${e.payment_locked ? 'bg-success text-white' : 'bg-warning-bg text-warning border-y border-warning-border'}`}>
                             2. Payment Locked
                           </div>
                           <div className="flex-1 text-center py-8 text-xs font-bold rounded-r-md bg-gray-200 text-gray">
                             3. Settled
                           </div>
                        </div>

                        <Link to={`/escrow/${e.id}`} className="btn btn-outline w-full justify-center">
                          Track & Manage Escrow <ArrowRight size={14} />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- KYC TAB --- */}
            {tab === 'kyc' && (
              <div className="card shadow-lg mb-24 p-40 text-center border-success-border">
                 <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success text-white mb-24 shadow-md">
                   <ShieldCheck size={40} />
                 </div>
                 <h2 className="mb-12">Identity Verified</h2>
                 <p className="text-gray mb-32 max-w-md mx-auto">
                   Your identity has been successfully verified. You have full access to list properties and initiate purchases on D-LAND.
                 </p>
                 <div className="inline-block text-left bg-surface-2 p-24 rounded-lg border border-border w-full max-w-md">
                   <div className="flex justify-between border-b border-border pb-12 mb-12">
                     <span className="text-gray text-sm">Full Name</span>
                     <span className="font-bold">{wallet.name}</span>
                   </div>
                   <div className="flex justify-between border-b border-border pb-12 mb-12">
                     <span className="text-gray text-sm">Connected Wallet</span>
                     <span className="font-bold mono text-sm">{wallet.short}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-gray text-sm">Status</span>
                     <span className="font-bold text-success flex items-center gap-4"><CheckCircle size={14}/> Verified</span>
                   </div>
                 </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
