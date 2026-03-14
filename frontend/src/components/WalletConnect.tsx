import { Wallet } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useEffect } from 'react';

interface WalletConnectProps {
  color?: string; // Значок "?" означает, что цвет можно не передавать
  borderColor?: string;
  mouseEnterColor?: string;
  mouseLeaveColor?: string;
  mouseEnterBorderColor?: string;
  mouseLeaveBorderColor?: string;
}

export function WalletConnect({ color = '#c084fc', borderColor = 'rgba(168, 85, 247, 0.3)', mouseEnterColor = 'rgba(168, 85, 247, 0.5)', mouseLeaveColor = 'rgba(168, 85, 247, 0.3)', mouseEnterBorderColor = 'rgba(168, 85, 247, 0.5)', mouseLeaveBorderColor = 'rgba(168, 85, 247, 0.3)' }: WalletConnectProps) {
  const { walletAddress, connectWallet, disconnectWallet, checkVipOnBackend } = useUserStore();

  // 2. ВОТ ЗДЕСЬ МЫ ВЫЗЫВАЕМ ПРОВЕРКУ!
  // Этот код сработает ровно один раз, когда кнопка появится на экране
  useEffect(() => {
    checkVipOnBackend();
  }, [checkVipOnBackend]);

  const handleConnect = async () => {
    // Симуляция подключения кошелька
    connectWallet('0x742d...4581');
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  console.log('Matviko')
  console.log(walletAddress)
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
        border: borderColor,
        borderRadius: '8px',
        padding: '8px 12px',
        color: color,
        fontSize: '12px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = mouseEnterColor;
        e.currentTarget.style.borderColor = mouseEnterBorderColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = mouseLeaveColor;
        e.currentTarget.style.borderColor = mouseLeaveBorderColor;
      }}
    >
      <Wallet size={14} />
      Connect Wallet
    </button>
  );
}
