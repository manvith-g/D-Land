import { useState } from 'react'
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Mail,
  Key,
  CreditCard,
} from 'lucide-react'

// ✅ Mock wallet (must include address)
const useWallet = () => ({
  wallet: {
    name: 'Demo User',
    email: 'user@example.com',
    kyc_status: 'none',
    address: 'ALGO_DEMO_WALLET_123456', // ✅ IMPORTANT
  },
  updateKyc: (status) => console.log('KYC status updated to:', status),
})

const useNavigate = () => (path) => console.log('Navigated to:', path)

export default function KYC() {
  const { wallet, updateKyc } = useWallet()
  const navigate = useNavigate()

  const [kycState, setKycState] = useState(wallet?.kyc_status || 'none')
  const [step, setStep] = useState('pan_input')
  const [pan, setPan] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [userEmail, setUserEmail] = useState('')

  if (!wallet) return <div className="p-40 text-center">Please connect wallet.</div>

  const maskEmail = (email) => {
    const [namePart, domainPart] = email.split('@')
    if (!namePart || !domainPart) return email
    return (
      namePart.substring(0, 2) +
      '*'.repeat(Math.max(namePart.length - 2, 3)) +
      '@' +
      domainPart
    )
  }

  // ---------------- SEND OTP ----------------
  const handleSendOtp = async () => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/

    if (!panRegex.test(pan)) {
      setError('Please enter a valid PAN (ABCDE1234F)')
      return
    }

    try {
      setError('')
      setLoading(true)

      // 1. Verify PAN
      const panRes = await fetch(
        `http://localhost:5000/verify-pan?pan=${encodeURIComponent(pan)}`
      )

      const panData = await panRes.json()

      if (!panRes.ok || !panData.exists) {
        setError(panData.message || 'PAN not found')
        setLoading(false)
        return
      }

      const email = panData.email

      // 2. Send OTP
      const otpRes = await fetch('http://localhost:5000/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const otpData = await otpRes.json()

      if (!otpRes.ok) {
        setError(otpData.error || 'Failed to send OTP')
        setLoading(false)
        return
      }

      setUserEmail(email)
      setMaskedEmail(maskEmail(email))
      setStep('otp_verify')
      setLoading(false)
    } catch (err) {
      console.error(err)
      setError('Error sending OTP')
      setLoading(false)
    }
  }

  // ---------------- VERIFY OTP ----------------
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Enter valid 6-digit OTP')
      return
    }

    const walletAddress = wallet?.address

    if (!walletAddress) {
      setError('Wallet address not found')
      return
    }

    try {
      setError('')
      setLoading(true)

      const res = await fetch(
        `http://localhost:5000/verify-otp?email=${encodeURIComponent(userEmail)}&wallet_address=${encodeURIComponent(walletAddress)}&otp=${encodeURIComponent(otp)}`
      )

      const data = await res.json()

      if (!res.ok || !data.valid) {
        setError(data.message || 'Invalid OTP')
        setLoading(false)
        return
      }

      setKycState('verified')
      updateKyc('verified')
      setLoading(false)
    } catch (err) {
      console.error(err)
      setError('Error verifying OTP')
      setLoading(false)
    }
  }

  const handleBack = () => {
    setStep('pan_input')
    setOtp('')
    setError('')
  }

  return (
    <div className="kyc-page">
      {kycState === 'verified' ? (
        <div className="container-sm">
          <div className="kyc-status-card">
            <CheckCircle size={40} />
            <h2>KYC Verified</h2>
            <p>You now have full access.</p>

            <button onClick={() => navigate('/sell')}>
              <Zap /> Sell Property
            </button>
          </div>
        </div>
      ) : (
        <div className="container-sm">
          <h2>KYC Verification</h2>

          {step === 'pan_input' && (
            <>
              <input
                placeholder="ABCDE1234F"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
              />

              {error && <p style={{ color: 'red' }}>{error}</p>}

              <button onClick={handleSendOtp} disabled={loading}>
                {loading ? 'Sending...' : 'Get OTP'}
              </button>
            </>
          )}

          {step === 'otp_verify' && (
            <>
              <p>OTP sent to {maskedEmail}</p>

              <input
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              {error && <p style={{ color: 'red' }}>{error}</p>}

              <button onClick={handleVerifyOtp} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button onClick={handleBack}>Back</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}