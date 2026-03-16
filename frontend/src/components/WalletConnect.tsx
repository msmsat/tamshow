import { Wallet } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useEffect } from 'react';

// Компонент для подключения кошелька и отображения его статуса
import { useWeb3Modal, useWeb3ModalAccount, useDisconnect } from '@web3modal/ethers/react';

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
  const tgId = "620994031"; // Заглушка для теста, потом заменим на реальный ID из Телеграма

  // 1. Достаем функции из Web3Modal
  const { open } = useWeb3Modal(); 
  const { address, isConnected } = useWeb3ModalAccount();
  const { disconnect } = useDisconnect(); // <-- ШОКЕР ДЛЯ WEB3MODAL

  // 2. ВОТ ЗДЕСЬ МЫ ВЫЗЫВАЕМ ПРОВЕРКУ!
  // Этот код сработает ровно один раз, когда кнопка появится на экране
  useEffect(() => {
    checkVipOnBackend(tgId); // Передаем ID в функцию проверки
  }, [checkVipOnBackend]);

  // 2. Ваша функция теперь просто вызывает красивое окно!
  const handleConnect = () => {
    open(); 
  };

  // 2. ЕДИНСТВЕННЫЙ КОНТРОЛЛЕР (Без дублирования!)
  useEffect(() => {
    const handleWeb3ModalConnection = async () => {
      // Если кошелек подключен в браузере, но Питон о нем еще не знает
      if (isConnected && address && !walletAddress && tgId) {
        
        console.log("🦊 Web3Modal дал адрес. Спрашиваем Питона...");
        
        // Отправляем Питону. Питон проверяет Alchemy -> Блокчейн -> Баланс USDC
        const isApprovedByBackend = await connectWallet(tgId, address);
        
        if (!isApprovedByBackend) {
          console.log("❌ Питон отказал (нет 1 USDC)! Стираем память Web3Modal.");
          disconnect(); // Выкидываем кошелек, чтобы юзер не прошел
        } else {
          console.log("✅ Питон одобрил! Кошелек привязан.");
        }
      }
    };

    handleWeb3ModalConnection();
  }, [isConnected, address, walletAddress, tgId, connectWallet, disconnect]);

  // 3. ОТКЛЮЧЕНИЕ КОШЕЛЬКА (Крестик)
  const handleDisconnect = async () => {
    if (tgId) {
      const isDisconnectedOnBackend = await disconnectWallet(tgId);
      
      if (isDisconnectedOnBackend) {
        disconnect(); // Стираем кэш браузера только если Питон разрешил
        console.log("🔌 Кошелек полностью отвязан!");
      } else {
        alert("Ошибка связи с сервером. Не удалось отвязать кошелек.");
      }
    }
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
