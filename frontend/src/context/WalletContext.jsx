import { createContext, useContext, useState, useCallback } from 'react'

const WalletContext = createContext(null)

// Simulated KYC/wallet state
const MOCK_WALLET = {
  address: 'ALGO7XKP2MNQR4UV8STJWZ3YNEXAMPLE',
  short: 'ALGO7XK…MPLE',
  algo_balance: 1245.80,
  kyc_status: 'verified', // 'none' | 'pending' | 'verified' | 'rejected'
  name: 'Arjun Sharma',
  email: 'arjun@example.com',
}

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null)
  const [connecting, setConnecting] = useState(false)

  const connect = useCallback(async () => {
    setConnecting(true)
    await new Promise(r => setTimeout(r, 1200))
    setWallet(MOCK_WALLET)
    setConnecting(false)
  }, [])

  const disconnect = useCallback(() => setWallet(null), [])

  const updateKyc = useCallback((status) => {
    setWallet(w => w ? { ...w, kyc_status: status } : w)
  }, [])

  const isConnected = !!wallet
  const kycVerified = wallet?.kyc_status === 'verified'

  return (
    <WalletContext.Provider value={{ wallet, connecting, connect, disconnect, updateKyc, isConnected, kycVerified }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be inside WalletProvider')
  return ctx
}
