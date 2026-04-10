/**
 * KYCStatusBadge — shows in navbar, shows KYC state
 */
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  verified:    { label: '✓ KYC Verified',  cls: 'badge-verified'  },
  pending:     { label: '⏳ KYC Pending',   cls: 'badge-pending'   },
  rejected:    { label: '✕ KYC Rejected',  cls: 'badge-rejected'  },
  not_started: { label: '⚠ Complete KYC',  cls: 'badge-pending'   },
};

export default function KYCStatusBadge({ onClick }) {
  const { kycStatus, setShowKYCModal } = useAuth();
  const config = STATUS_CONFIG[kycStatus] || STATUS_CONFIG.not_started;

  const handleClick = () => {
    if (kycStatus !== 'verified') setShowKYCModal(true);
    onClick?.();
  };

  return (
    <span
      className={`badge ${config.cls}`}
      style={{ cursor: kycStatus !== 'verified' ? 'pointer' : 'default' }}
      onClick={handleClick}
      id="kyc-status-badge"
      title={kycStatus !== 'verified' ? 'Click to complete KYC' : 'KYC verified'}
    >
      {config.label}
    </span>
  );
}
