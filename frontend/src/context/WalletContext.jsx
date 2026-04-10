import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { PeraWalletConnect } from '@perawallet/connect'

const WalletContext = createContext(null)

const peraWallet = new PeraWalletConnect({
  chainId: 416002, // Algorand TestNet (use 416001 for MainNet)
})

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const isConnectedRef = useRef(false)

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null

  // Build a wallet-like object for backwards compatibility with the rest of the app
  const wallet = address
    ? {
        address,
        short: shortAddress,
        algo_balance: 0,
        kyc_status: 'none',
        name: shortAddress,
        email: null,
      }
    : null

  const isConnected = !!address

  const handleDisconnectEvent = useCallback(() => {
    setAddress(null)
    isConnectedRef.current = false
  }, [])

  // Reconnect on page load if the user was previously connected
  useEffect(() => {
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        peraWallet.connector?.on('disconnect', handleDisconnectEvent)

        if (accounts.length) {
          setAddress(accounts[0])
          isConnectedRef.current = true
        }
      })
      .catch(() => {
        // No previous session — do nothing
      })
  }, [handleDisconnectEvent])

  const connect = useCallback(async () => {
    setConnecting(true)
    try {
      const accounts = await peraWallet.connect()
      peraWallet.connector?.on('disconnect', handleDisconnectEvent)

      if (accounts.length) {
        setAddress(accounts[0])
        isConnectedRef.current = true
      }
    } catch (error) {
      // User closed the modal or rejected — do nothing
      if (error?.data?.type !== 'CONNECT_MODAL_CLOSED') {
        console.error('Pera Wallet connect error:', error)
      }
    } finally {
      setConnecting(false)
    }
  }, [handleDisconnectEvent])

  const disconnect = useCallback(async () => {
    try {
      await peraWallet.disconnect()
    } catch {
      // ignore
    }
    setAddress(null)
    isConnectedRef.current = false
  }, [])

  const updateKyc = useCallback((status) => {
    // KYC is managed separately — this is a no-op placeholder for compatibility
  }, [])

  const kycVerified = wallet?.kyc_status === 'verified'

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connecting,
        connect,
        disconnect,
        updateKyc,
        isConnected,
        kycVerified,
        peraWallet, // expose for signing transactions later
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be inside WalletProvider')
  return ctx
}
