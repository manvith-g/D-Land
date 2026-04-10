/**
 * AuthContext — combines KYC state + Algorand wallet state
 * Provides: { user, kycStatus, wallet, connectWallet, disconnectWallet, refetchKYC }
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getKYCStatus } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [wallet, setWallet]       = useState(null);   // Algorand address string
  const [user, setUser]           = useState(null);   // KYC user object from backend
  const [kycStatus, setKycStatus] = useState('not_started'); // 'not_started'|'pending'|'verified'|'rejected'
  const [walletLoading, setWalletLoading] = useState(false);
  const [kycLoading, setKycLoading]       = useState(false);
  const [showKYCModal, setShowKYCModal]   = useState(false);

  // Persist wallet across page refreshes
  useEffect(() => {
    const saved = localStorage.getItem('dland_wallet');
    if (saved) {
      setWallet(saved);
      fetchKYC(saved);
    }
  }, []);

  const fetchKYC = useCallback(async (addr) => {
    if (!addr) return;
    setKycLoading(true);
    try {
      const res = await getKYCStatus(addr);
      setKycStatus(res.kyc_status || 'not_started');
      setUser(res.user || null);
    } catch {
      setKycStatus('not_started');
    } finally {
      setKycLoading(false);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setWalletLoading(true);
    try {
      // Try Pera Wallet first, fallback to prompt
      if (window.AlgoSigner) {
        await window.AlgoSigner.connect();
        const accounts = await window.AlgoSigner.accounts({ ledger: 'TestNet' });
        if (accounts?.length) {
          const addr = accounts[0].address;
          setWallet(addr);
          localStorage.setItem('dland_wallet', addr);
          await fetchKYC(addr);
          return addr;
        }
      }
      // Fallback: prompt for address (dev mode)
      const addr = prompt(
        'Enter your Algorand testnet wallet address:\n\n' +
        'Example: 55Z442ILPALNXXQF23EUTJQK54HBOQNEPYVBVNDUDZ3AM33C2VYM6KO4FQ'
      );
      if (addr && addr.trim().length > 10) {
        const clean = addr.trim();
        setWallet(clean);
        localStorage.setItem('dland_wallet', clean);
        await fetchKYC(clean);
        return clean;
      }
    } catch (err) {
      console.error('Wallet connect error:', err);
    } finally {
      setWalletLoading(false);
    }
    return null;
  }, [fetchKYC]);

  const disconnectWallet = useCallback(() => {
    setWallet(null);
    setUser(null);
    setKycStatus('not_started');
    localStorage.removeItem('dland_wallet');
  }, []);

  const refetchKYC = useCallback(() => {
    if (wallet) fetchKYC(wallet);
  }, [wallet, fetchKYC]);

  const value = {
    wallet,
    user,
    kycStatus,
    kycLoading,
    walletLoading,
    showKYCModal,
    setShowKYCModal,
    connectWallet,
    disconnectWallet,
    refetchKYC,
    isVerified: kycStatus === 'verified',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
