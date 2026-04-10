import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Upload, CheckCircle, Clock, XCircle,
  User, FileText, Camera, AlertCircle, ArrowRight, Zap
} from 'lucide-react'
import { useWallet } from '../context/WalletContext'

const KYC_STEPS = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'selfie', label: 'Selfie Check', icon: Camera },
  { id: 'review', label: 'Review', icon: CheckCircle },
]

const STATUS_CONFIG = {
  none:     { icon: AlertCircle, color: 'gray',    label: 'Not Started',  bg: 'var(--clr-gray-100)' },
  pending:  { icon: Clock,       color: 'warning',  label: 'Under Review', bg: 'var(--clr-warning-bg)' },
  verified: { icon: CheckCircle, color: 'success',  label: 'Verified',     bg: 'var(--clr-success-bg)' },
  rejected: { icon: XCircle,     color: 'error',    label: 'Rejected',     bg: 'var(--clr-error-bg)' },
}

export default function KYC() {
  const { wallet, updateKyc } = useWallet()
  const navigate = useNavigate()
  const [kycState, setKycState] = useState(wallet?.kyc_status || 'none')
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    dob: '', gender: '', address: '', city: '', state: '', pincode: '',
    doc_type: 'aadhaar', doc_number: '', pan: '',
    aadhaar_front: null, aadhaar_back: null, selfie: null,
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const kycStatus = kycState
  const cfg = STATUS_CONFIG[kycStatus]
  if (!wallet) return <div className="p-40 text-center">Please connect wallet.</div>

  const handleSubmit = async () => {
    setSubmitting(true)
    // mock api call
    await new Promise(r => setTimeout(r, 2000))
    setSubmitting(false)
    setKycState('pending')
    updateKyc('pending')
  }

  // Effect to simulate admin approval 5 seconds after pending
  useEffect(() => {
    if (kycState === 'pending') {
      const t = setTimeout(() => {
        setKycState('verified')
        updateKyc('verified')
      }, 5000)
      return () => clearTimeout(t)
    }
  }, [kycState, updateKyc])

  if (submitted || kycStatus === 'pending') {
    return (
      <div className="kyc-page">
        <div className="container-sm">
          <div className="kyc-status-card animate-fade">
            <div className="kyc-status-icon pending"><Clock size={32} /></div>
            <h2>KYC Under Review</h2>
            <p>Your documents have been submitted. Our team will verify within 24–48 hours. You'll be notified via email.</p>
            <div className="kyc-timeline">
              <div className="kyt-step done"><CheckCircle size={14} /> Documents Submitted</div>
              <div className="kyt-step active"><Clock size={14} /> Under Verification</div>
              <div className="kyt-step"><Shield size={14} /> Identity Confirmed</div>
              <div className="kyt-step"><Zap size={14} /> Ready to Trade</div>
            </div>
            <button className="btn btn-outline" onClick={() => navigate('/activity')}>Go to Activity</button>
          </div>
        </div>
      </div>
    )
  }

  if (kycStatus === 'verified') {
    return (
      <div className="kyc-page">
        <div className="container-sm">
          <div className="kyc-status-card animate-fade">
            <div className="kyc-status-icon verified"><CheckCircle size={32} /></div>
            <h2>KYC Verified ✓</h2>
            <p>Your identity has been verified. You can now list properties, buy, and participate in escrow transactions.</p>
            <div className="kyc-perms">
              <span className="kyc-perm"><CheckCircle size={13} /> List Properties</span>
              <span className="kyc-perm"><CheckCircle size={13} /> Request Purchase</span>
              <span className="kyc-perm"><CheckCircle size={13} /> Escrow Transactions</span>
              <span className="kyc-perm"><CheckCircle size={13} /> Token Transfers</span>
            </div>
            <div className="flex gap-12">
              <button className="btn btn-primary" onClick={() => navigate('/sell')}>
                <Zap size={15} /> List a Property
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/properties')}>Browse Properties</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (kycStatus === 'rejected') {
    return (
      <div className="kyc-page">
        <div className="container-sm">
          <div className="kyc-status-card animate-fade">
            <div className="kyc-status-icon rejected"><XCircle size={32} /></div>
            <h2>KYC Rejected</h2>
            <p>Your KYC submission was rejected. Reason: Documents were unclear or incomplete. Please resubmit with clear, valid documents.</p>
            <button className="btn btn-danger" onClick={() => updateKyc('none')}>Resubmit KYC</button>
          </div>
        </div>
      </div>
    )
  }

  // Show KYC form (status === 'none')
  return (
    <div className="kyc-page">
      <div className="container-sm">
        <div className="kyc-header">
          <h1>KYC Verification</h1>
          <p>Complete identity verification to unlock all D‑LAND features</p>
        </div>

        {/* Progress steps */}
        <div className="kyc-steps animate-fade">
          {KYC_STEPS.map(({ id, label, icon: StepIcon }, i) => (
            <div key={id} className={`kyc-step-item ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="kyc-step-circle">
                {i < step ? <CheckCircle size={16} /> : <StepIcon size={16} />}
              </div>
              <span className="kyc-step-label">{label}</span>
              {i < KYC_STEPS.length - 1 && <div className={`kyc-step-line ${i < step ? 'done' : ''}`} />}
            </div>
          ))}
        </div>

        {/* Step panels */}
        <div className="kyc-panel card animate-fade">
          <div className="card-body">
            {step === 0 && (
              <div className="kyc-form-step">
                <h3>Personal Information</h3>
                <p className="kyc-step-desc">Provide your basic personal details as per government ID.</p>
                <div className="kyc-fields">
                  <div className="grid-2" style={{ gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Date of Birth <span>*</span></label>
                      <input type="date" className="form-input" value={form.dob} onChange={e => set('dob', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gender <span>*</span></label>
                      <select className="form-input form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                        <option value="">Select gender</option>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Residential Address <span>*</span></label>
                    <textarea className="form-input" rows={2} placeholder="House/Flat no, Street, Area" value={form.address} onChange={e => set('address', e.target.value)} />
                  </div>
                  <div className="grid-3" style={{ gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input type="text" className="form-input" placeholder="Mumbai" value={form.city} onChange={e => set('city', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State</label>
                      <input type="text" className="form-input" placeholder="Maharashtra" value={form.state} onChange={e => set('state', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pincode</label>
                      <input type="text" className="form-input" placeholder="400001" value={form.pincode} onChange={e => set('pincode', e.target.value)} maxLength={6} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="kyc-form-step">
                <h3>Identity Documents</h3>
                <p className="kyc-step-desc">Upload clear photos of your government-issued ID and PAN card.</p>
                <div className="kyc-fields">
                  <div className="form-group">
                    <label className="form-label">Document Type <span>*</span></label>
                    <div className="doc-type-tabs">
                      {['aadhaar', 'passport', 'voter_id', 'driving_license'].map(t => (
                        <button
                          key={t} type="button"
                          className={`doc-tab ${form.doc_type === t ? 'active' : ''}`}
                          onClick={() => set('doc_type', t)}
                        >
                          {t === 'aadhaar' ? 'Aadhaar' : t === 'voter_id' ? 'Voter ID' : t === 'driving_license' ? "Driving Licence" : 'Passport'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Document Number <span>*</span></label>
                    <input
                      type="text" className="form-input"
                      placeholder={form.doc_type === 'aadhaar' ? '1234 5678 9012' : 'Enter document number'}
                      value={form.doc_number} onChange={e => set('doc_number', e.target.value)}
                    />
                  </div>
                  <div className="grid-2" style={{ gap: 14 }}>
                    <UploadBox label={`${form.doc_type === 'aadhaar' ? 'Aadhaar' : 'Document'} — Front`} field="aadhaar_front" form={form} set={set} />
                    <UploadBox label={`${form.doc_type === 'aadhaar' ? 'Aadhaar' : 'Document'} — Back`} field="aadhaar_back" form={form} set={set} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PAN Card Number <span>*</span></label>
                    <input type="text" className="form-input" placeholder="ABCDE1234F" value={form.pan} onChange={e => set('pan', e.target.value.toUpperCase())} maxLength={10} />
                    <span className="form-hint">Required for financial compliance</span>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="kyc-form-step">
                <h3>Selfie Verification</h3>
                <p className="kyc-step-desc">Take a clear selfie in good lighting. Your face must be clearly visible and match your ID.</p>
                <div className="selfie-guide">
                  <div className="selfie-box">
                    {form.selfie ? (
                      <div className="selfie-done"><CheckCircle size={40} color="var(--clr-success)" /></div>
                    ) : (
                      <>
                        <Camera size={40} opacity={0.3} />
                        <span>Upload selfie</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="selfie-input" onChange={e => set('selfie', e.target.files[0])} />
                  </div>
                  <div className="selfie-tips">
                    <h4>Tips for a valid selfie:</h4>
                    <ul>
                      <li><CheckCircle size={12} /> Good lighting, no shadows on face</li>
                      <li><CheckCircle size={12} /> Look directly at camera</li>
                      <li><CheckCircle size={12} /> No glasses or hats</li>
                      <li><CheckCircle size={12} /> Neutral background</li>
                      <li><CheckCircle size={12} /> File size under 5MB</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="kyc-form-step">
                <h3>Review & Submit</h3>
                <p className="kyc-step-desc">Please review your information before submitting.</p>
                <div className="review-grid">
                  <ReviewRow label="Full Name" value={wallet.name} />
                  <ReviewRow label="Email" value={wallet.email} />
                  <ReviewRow label="Phone" value="+91 9876543210" />
                  <ReviewRow label="Date of Birth" value={form.dob || '—'} />
                  <ReviewRow label="Gender" value={form.gender || '—'} />
                  <ReviewRow label="Address" value={form.address ? `${form.address}, ${form.city}` : '—'} />
                  <ReviewRow label="Document Type" value={form.doc_type} />
                  <ReviewRow label="Document No." value={form.doc_number || '—'} />
                  <ReviewRow label="PAN" value={form.pan || '—'} />
                  <ReviewRow label="Documents" value={form.aadhaar_front ? '✓ Uploaded' : 'Not uploaded'} ok={!!form.aadhaar_front} />
                  <ReviewRow label="Selfie" value={form.selfie ? '✓ Uploaded' : 'Not uploaded'} ok={!!form.selfie} />
                </div>
                <div className="alert alert-info" style={{ marginTop: 16 }}>
                  <AlertCircle size={16} />
                  By submitting, you confirm all information is accurate and consent to identity verification.
                </div>
              </div>
            )}

            {/* Step navigation */}
            <div className="kyc-nav">
              {step > 0 && (
                <button className="btn btn-outline" onClick={() => setStep(s => s - 1)}>Back</button>
              )}
              <div style={{ flex: 1 }} />
              {step < KYC_STEPS.length - 1 ? (
                <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
                  Continue <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                  id="btn-submit-kyc"
                >
                  {submitting ? <><div className="spinner" /> Submitting…</> : <><Shield size={15} /> Submit KYC</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UploadBox({ label, field, form, set }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <label className={`upload-box ${form[field] ? 'has-file' : ''}`}>
        {form[field] ? (
          <><CheckCircle size={20} color="var(--clr-success)" /><span>{form[field].name}</span></>
        ) : (
          <><Upload size={20} /><span>Click to upload</span><small>JPG, PNG up to 5MB</small></>
        )}
        <input type="file" accept="image/*,.pdf" hidden onChange={e => set(field, e.target.files[0])} />
      </label>
    </div>
  )
}

function ReviewRow({ label, value, ok }) {
  return (
    <div className="review-row">
      <span className="review-label">{label}</span>
      <span className={`review-value ${ok === false ? 'bad' : ok ? 'good' : ''}`}>{value}</span>
    </div>
  )
}
