import { useState } from 'react'
import {
  Search, ShieldCheck, CheckCircle, AlertCircle, MapPin, Minimize, FileText, Zap, Building2, Landmark
} from 'lucide-react'
import { PROPERTIES } from '../data/mockData'
import './OwnershipCheck.css'

export default function OwnershipCheck() {
  const [tab, setTab] = useState('flat')
  const [inputVal, setInputVal] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    if (!inputVal.trim()) return

    setLoading(true)
    setSearched(false)
    setResult(null)

    setTimeout(() => {
      setLoading(false)
      setSearched(true)
      // Mock lookup
      const sq = inputVal.toLowerCase()
      const found = PROPERTIES.find(p => 
        (tab === 'flat' && p.type === 'flat' && (p.rera_id?.toLowerCase().includes(sq) || p.unit_no?.toLowerCase().includes(sq))) ||
        (tab === 'land' && p.type === 'land' && p.survey_no?.toLowerCase().includes(sq))
      )
      setResult(found || null)
    }, 1500)
  }

  return (
    <div className="own-page pb-80">
      <div className="mk-header pb-80">
        <div className="container text-center anim-fade">
          <div className="inline-flex items-center gap-8 mb-16 text-primary-dark font-bold bg-primary-muted px-16 py-8 rounded-full border border-primary-dark">
            <ShieldCheck size={18} /> Official Govt. Record Sync
          </div>
          <h1>Verify Property Ownership</h1>
          <p className="max-w-md mx-auto">Check the legal owner of any property in India. Real-time fetch from RERA & Land Revenue records.</p>
        </div>
      </div>

      <div className="container container-sm anim-fade-1 mt-min-40">
        
        <div className="card shadow-xl">
          <div className="tabs p-4 m-24">
            <button 
              className={`tab-btn text-lg py-12 ${tab === 'flat' ? 'active' : ''}`}
              onClick={() => { setTab('flat'); setResult(null); setSearched(false); setInputVal('') }}
            >
              <Building2 size={16} className="inline mr-1" /> Check Flat
            </button>
            <button 
              className={`tab-btn text-lg py-12 ${tab === 'land' ? 'active' : ''}`}
              onClick={() => { setTab('land'); setResult(null); setSearched(false); setInputVal('') }}
            >
              <Landmark size={16} className="inline mr-1" /> Check Land
            </button>
          </div>

          <div className="card-body pt-0 pb-32 px-32">
            <form onSubmit={handleSearch} className="flex gap-12 text-lg">
              <div className="flex-1 input-with-icon">
                <Search size={18} className="icon" />
                <input 
                  type="text" 
                  className="form-input text-lg py-12 pl-40" 
                  placeholder={tab === 'flat' ? "Enter RERA ID or Flat Number..." : "Enter Survey Number..."}
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg px-32" disabled={loading}>
                {loading ? <div className="spinner border-dark" /> : 'Search Records'}
              </button>
            </form>
          </div>
        </div>

        {searched && (
          <div className="mt-40 anim-fade">
            {result ? (
              <div className="card border-2 border-success-border">
                <div className="bg-success-muted px-32 py-16 flex items-center justify-between border-b border-success-border">
                  <div className="flex items-center gap-12 text-success font-bold text-lg">
                    <CheckCircle size={24} /> Ownership Verified
                  </div>
                  <span className="text-xs text-gray mono">Fetched: {new Date().toLocaleString()}</span>
                </div>
                
                <div className="card-body p-32">
                  <div className="grid-2 gap-32">
                    
                    {/* Owner Info */}
                    <div>
                      <h4 className="text-gray uppercase text-xs mb-16">Current Title Holder</h4>
                      <div className="bg-surface-2 p-16 rounded-md border border-border">
                        <div className="font-display font-bold text-2xl mb-4">{result.owner_name}</div>
                        
                        {result.kyc_verified ? (
                          <div className="flex items-center gap-6 text-sm text-success font-bold mt-8">
                            <ShieldCheck size={14} /> KYC Verified Identity
                          </div>
                        ) : (
                          <div className="flex items-center gap-6 text-sm text-warning font-bold mt-8">
                            <AlertCircle size={14} /> Unverified Identity
                          </div>
                        )}
                        
                        {result.owner_wallet && result.kyc_verified && (
                          <div className="mt-12 pt-12 border-t border-border">
                            <div className="text-xs text-gray mb-4">Linked Algorand Wallet</div>
                            <div className="mono text-sm">{result.owner_wallet}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Property Info */}
                    <div>
                      <h4 className="text-gray uppercase text-xs mb-16">Property Details</h4>
                      <div className="flex flex-col gap-12">
                        <div className="flex items-start gap-12">
                          <MapPin size={16} className="text-gray mt-4 flex-shrink-0" />
                          <div>
                            <div className="font-bold text-sm">{result.location.locality}</div>
                            <div className="text-xs text-gray">{result.location.city}, {result.location.state} {result.location.pincode}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-12">
                           <FileText size={16} className="text-gray mt-4 flex-shrink-0" />
                           <div className="text-sm font-bold mono">
                             {result.type === 'flat' ? `RERA: ${result.rera_id}` : `Survey: ${result.survey_no}`}
                           </div>
                        </div>
                        <div className="flex items-start gap-12">
                           <Minimize size={16} className="text-gray mt-4 flex-shrink-0" />
                           <div className="text-sm font-bold">
                             {result.area} {result.area_unit}
                           </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Blockchain Status */}
                  <div className="mt-32 p-16 rounded-lg bg-gray-100 border border-border flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm mb-4 flex items-center gap-6">
                        <Zap size={14} className="text-primary-dark" /> Blockchain Status
                      </div>
                      {result.token_id ? (
                         <div className="text-xs text-gray">Asset tokenized as ASA #{result.token_id} on Algorand mainnet.</div>
                      ) : (
                         <div className="text-xs text-gray">Property is not yet tokenized on the blockchain.</div>
                      )}
                    </div>
                    {result.status === 'listed' && (
                      <span className="badge badge-success">Listed for Sale</span>
                    )}
                    {result.status === 'escrow' && (
                      <span className="badge badge-warning">Currently in Escrow</span>
                    )}
                  </div>

                </div>
              </div>
            ) : (
              <div className="card p-40 text-center border-warning-border">
                <AlertCircle size={48} className="text-warning mx-auto mb-16" />
                <h3 className="mb-8">No Records Found</h3>
                <p className="text-gray">We could not find any official records matching "{inputVal}". Please completely check the {tab === 'flat' ? 'RERA ID' : 'Survey Number'} and try again.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
