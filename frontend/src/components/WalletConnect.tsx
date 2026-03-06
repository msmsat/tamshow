import { Wallet } from 'lucide-react';
import { useStore } from '../store/useStore';

export function WalletConnect() {
  const { walletAddress, connectWallet, disconnectWallet } = useStore();

  const handleConnect = async () => {
    // Симуляция подключения кошелька
    connectWallet('0x742d...4581');
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  if (walletAddress) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px',
        color: '#22c55e'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#22c55e',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }} />
        {walletAddress}
        <button
          onClick={handleDisconnect}
          style={{
            marginLeft: '8px',
            background: 'none',
            border: 'none',
            color: '#22c55e',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'transparent',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        borderRadius: '8px',
        padding: '8px 12px',
        color: '#c084fc',
        fontSize: '12px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.1)';
        e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
      }}
    >
      <Wallet size={14} />
      Connect Wallet
    </button>
  );
}
