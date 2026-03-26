import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, Copy, Check, Package, Zap, MapPin, Settings, 
  LogOut, Image as ImageIcon, Hexagon, ChevronRight, AlertTriangle 
} from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useDisconnect, useWeb3Modal, useWeb3ModalAccount } from '@web3modal/ethers/react';
import { OrdersModal } from '../components/OrdersModal';

// Mock data для демонстрации
const mockOrders = [
  { id: 1, name: 'Nexus Hoodie', date: '2024-03-05', status: 'Shipped', tracking: 'TRACK123' },
  { id: 2, name: 'VIP Pass', date: '2024-02-28', status: 'Delivered', tracking: 'TRACK124' },
];


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function Profile({ onTabChange }: { onTabChange?: (tab: string) => void }) {const { tgId, walletAddress, disconnectWallet, connectWallet } = useUserStore();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();
  const { address, isConnected } = useWeb3ModalAccount();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

  
  // Добавь вот эту строчку, чтобы увидеть ТИП переменной:
  console.log("🔥 РЕНДЕР ПРОФИЛЯ | Значение:", walletAddress, "| Тип:", typeof walletAddress);

  useEffect(() => {
    // Если Web3Modal говорит, что кошелек подключен, и мы знаем его адрес,
    // НО в нашем глобальном сторе (и в Питоне) его еще нет:
    if (isConnected && address && walletAddress !== address) {
      console.log("🌐 Кошелек обнаружен! Отправляем в Питон:", address);
      connectWallet(address); // Сохраняем в Zustand и отправляем в БД
    }
  }, [isConnected, address, walletAddress, connectWallet]);

  // Mock wallet address
  const shortAddress = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` 
    : '';

  const handleDisconnect = async () => {
    // Шаг А: СНАЧАЛА отключаем кошелек в браузере (Web3Modal). 
    // Это вырубит нашего "шпиона" (isConnected станет false)
    disconnect(); 

    // Шаг Б: Теперь спокойно удаляем кошелек из Питона и Zustand
    const isSuccess = await disconnectWallet();

    if (isSuccess) {
      console.log("Кошелек успешно отвязан локально и удален из БД!");
    } else {
      console.error("Ошибка связи с сервером при удалении.");
    }
  };

  const handleCopyAddress = () => {
    if (!walletAddress) return; // Защита
    navigator.clipboard.writeText(walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Generate gradient based on wallet address
  const generateAvatarGradient = (address: string) => {
    const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = (hash % 360);
    return `hsl(${hue}, 100%, 45%)`;
  };

  // === НОВЫЙ БЛОК: ЗАЩИТА ОТ ПОТЕРИ СВЯЗИ С TELEGRAM ===
  if (!tgId) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          minHeight: '100vh',
          backgroundColor: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          paddingBottom: '112px'
        }}
      >
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '24px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '320px',
          boxShadow: '0 0 30px rgba(239, 68, 68, 0.1)'
        }}>
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AlertTriangle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
          </motion.div>
          <h2 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
            Identity Not Found
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.6' }}>
            Сбой связи с протоколом Telegram. Мы не смогли получить ваш ID. 
            Пожалуйста, закройте это окно и запустите Web App заново.
          </p>
        </div>
      </motion.div>
    );
  }
  // === КОНЕЦ НОВОГО БЛОКА ===

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        paddingTop: '32px',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingBottom: '112px'
      }}
    >
      {/* 👤 Identity Header */}
      <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Avatar */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'relative',
              width: '80px',
              height: '80px',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '2px solid #06b6d4',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)'
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(135deg, ${generateAvatarGradient(walletAddress ? walletAddress : '')}, #a855f7)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>
                {walletAddress ? walletAddress[2].toUpperCase() : ''}
              </span>
            </div>
          </motion.div>

          {/* User Info */}
          <div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#ffffff',
                fontFamily: 'monospace',
                marginBottom: '8px'
              }}
            >
              {tgId}
            </h2>

            {/* VIP Badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: walletAddress ? 'rgba(168, 85, 247, 0.15)' : 'rgba(64, 64, 64, 0.4)',
                border: walletAddress ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                paddingLeft: '10px',
                paddingRight: '10px',
                paddingTop: '6px',
                paddingBottom: '6px',
                width: 'fit-content',
                boxShadow: walletAddress ? '0 0 15px rgba(168, 85, 247, 0.2)' : 'none'
              }}
            >
              {walletAddress && <Hexagon size={14} style={{ color: '#c084fc' }} />}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: walletAddress ? '#c084fc' : '#9ca3af',
                  letterSpacing: '0.5px'
                }}
              >
                {walletAddress ? 'Level 4: Nexus VIP' : 'Level 1: Nomad'}
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ⚡ Smart Contract Hub */}
      {walletAddress && (
        <motion.div
          variants={itemVariants}
          style={{
            backgroundColor: 'rgba(23, 23, 23, 0.6)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '24px',
            padding: '20px',
            marginBottom: '32px'
          }}
        >
          {/* Wallet Address */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '12px',
              marginBottom: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Wallet Address</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', fontFamily: 'monospace' }}>
                {shortAddress}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleCopyAddress}
              style={{
                background: 'none',
                border: 'none',
                color: copiedAddress ? '#22c55e' : '#9ca3af',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s'
              }}
            >
              {copiedAddress ? <Check size={18} /> : <Copy size={18} />}
            </motion.button>
          </motion.div>

          {/* NFT Status */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '12px',
              border: '1px solid rgba(168, 85, 247, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={16} style={{ color: '#a855f7' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Nexus Pass</span>
            </div>
            <motion.span
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#22c55e',
                letterSpacing: '0.5px'
              }}
            >
              ✓ Verified
            </motion.span>
          </motion.div>
        </motion.div>
      )}

      {/* 📋 Command Menu */}
      <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
        {/* Order History */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          whileHover={{ backgroundColor: 'rgba(23, 23, 23, 0.8)' }}
          onClick={() => setIsOrdersOpen(true)} // 🔥 ДОБАВИТЬ ЭТО
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            backgroundColor: 'rgba(23, 23, 23, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            marginBottom: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package size={20} style={{ color: '#a855f7' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
              Orders
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {mockOrders.length > 0 && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#06b6d4',
                  borderRadius: '50%'
                }}
              />
            )}
            <ChevronRight size={16} style={{ color: '#9ca3af' }} />
          </div>
        </motion.button>

        {/* Active Subscriptions */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          whileHover={{ backgroundColor: 'rgba(23, 23, 23, 0.8)' }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            backgroundColor: 'rgba(23, 23, 23, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            marginBottom: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Zap size={20} style={{ color: '#06b6d4' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
              Active Subscriptions
            </span>
          </div>
          <ChevronRight size={16} style={{ color: '#9ca3af' }} />
        </motion.button>

        {/* Delivery Coordinates */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          whileHover={{ backgroundColor: 'rgba(23, 23, 23, 0.8)' }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            backgroundColor: 'rgba(23, 23, 23, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            marginBottom: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MapPin size={20} style={{ color: '#d1d5db' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
              Delivery Coordinates
            </span>
          </div>
          <ChevronRight size={16} style={{ color: '#9ca3af' }} />
        </motion.button>

        {/* App Settings */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          whileHover={{ backgroundColor: 'rgba(23, 23, 23, 0.8)' }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            backgroundColor: 'rgba(23, 23, 23, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            marginBottom: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.5 }}
            >
              <Settings size={20} style={{ color: '#9ca3af' }} />
            </motion.div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
              App Settings
            </span>
          </div>
          <ChevronRight size={16} style={{ color: '#9ca3af' }} />
        </motion.button>
      </motion.div>

      
      {/* 🚀 Link Web3 Identity Zone */}
      {!walletAddress && (
        <motion.div
          variants={itemVariants}
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '24px',
            marginTop: '24px'
          }}
        >
          {/* Главная кнопка-контейнер */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => open()} // 🔥 ВОТ ОНА, МАГИЯ МГНОВЕННОГО КЛИКА!
            style={{
              width: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'row', 
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px', 
              padding: '14px 16px', 
              backgroundColor: 'rgba(6, 182, 212, 0.05)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '12px', 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.6)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Иконка */}
            <Wallet size={16} style={{ color: '#06b6d4' }} />
            
            {/* Текст */}
            <span style={{ 
              fontSize: '14px', 
              fontWeight: 700, 
              color: '#ffffff', 
              letterSpacing: '0.5px' 
            }}>
              Link Web3 Wallet
            </span>

            {/* Мы ПОЛНОСТЬЮ УДАЛИЛИ прозрачный <WalletConnect /> отсюда! */}
          </motion.button>
        </motion.div>
      )}
      
      {/* 🚨 Danger Zone */}
      {walletAddress && (
        <motion.div
          variants={itemVariants}
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '24px',
            marginTop: '24px'
          }}
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDisconnect}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px 16px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              borderRadius: '12px',
              color: '#ef4444',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
          >
            <LogOut size={16} />
            <span>Disconnect Wallet</span>
          </motion.button>
        </motion.div>
      )}
      {/* 🔥 НАША НОВАЯ МОДАЛКА В САМОМ НИЗУ */}
      <OrdersModal 
        isOpen={isOrdersOpen} 
        onClose={() => setIsOrdersOpen(false)} 
        orders={mockOrders} // Передаем фейковые заказы сверху файла (можешь очистить массив, чтобы проверить пустой дизайн)
        onGoToCart={() => {
          setIsOrdersOpen(false); // Закрываем модалку
          onTabChange?.('cart');  // Перекидываем юзера в корзину
        }} 
      />
    </motion.div>
  );
}
