import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Wallet, Copy, Check, Package, Zap, MapPin, Settings, 
  LogOut, Image as ImageIcon, Hexagon, ChevronRight
} from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

// Mock data для демонстрации
const mockOrders = [
  { id: 1, name: 'Nexus Hoodie', date: '2024-03-05', status: 'Shipped', tracking: 'TRACK123' },
  { id: 2, name: 'VIP Pass', date: '2024-02-28', status: 'Delivered', tracking: 'TRACK124' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

export function Profile() {
  const { isVip } = useUserStore();
  const [walletConnected, setWalletConnected] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Mock wallet address
  const mockWalletAddress = '0x1234567890abcdef1234567890abcdef12345678';
  const shortAddress = `${mockWalletAddress.slice(0, 6)}...${mockWalletAddress.slice(-4)}`;

  const handleConnectWallet = () => {
    setWalletConnected(true);
  };

  const handleDisconnect = () => {
    setWalletConnected(false);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(mockWalletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Generate gradient based on wallet address
  const generateAvatarGradient = (address: string) => {
    const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = (hash % 360);
    return `hsl(${hue}, 100%, 45%)`;
  };

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
          {walletConnected ? (
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
                  background: `linear-gradient(135deg, ${generateAvatarGradient(mockWalletAddress)}, #a855f7)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>
                  {mockWalletAddress[2].toUpperCase()}
                </span>
              </div>
            </motion.div>
          ) : (
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '16px',
                backgroundColor: '#404040',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <User size={40} style={{ color: '#9ca3af' }} />
            </div>
          )}

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
              {walletConnected ? shortAddress : 'Guest Protocol'}
            </h2>

            {/* VIP Badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: walletConnected && isVip ? 'rgba(168, 85, 247, 0.15)' : 'rgba(64, 64, 64, 0.4)',
                border: walletConnected && isVip ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                paddingLeft: '10px',
                paddingRight: '10px',
                paddingTop: '6px',
                paddingBottom: '6px',
                width: 'fit-content',
                boxShadow: walletConnected && isVip ? '0 0 15px rgba(168, 85, 247, 0.2)' : 'none'
              }}
            >
              {walletConnected && isVip && <Hexagon size={14} style={{ color: '#c084fc' }} />}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: walletConnected && isVip ? '#c084fc' : '#9ca3af',
                  letterSpacing: '0.5px'
                }}
              >
                {walletConnected && isVip ? 'Level 4: Nexus VIP' : 'Level 1: Nomad'}
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ⚡ Smart Contract Hub */}
      {!walletConnected ? (
        <motion.div
          variants={itemVariants}
          style={{
            backgroundColor: 'rgba(23, 23, 23, 0.6)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '24px',
            padding: '32px',
            textAlign: 'center',
            marginBottom: '32px'
          }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ marginBottom: '16px' }}
          >
            <Wallet
              size={48}
              style={{
                color: 'rgba(6, 182, 212, 0.6)',
                margin: '0 auto',
                display: 'block',
                filter: 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.3))'
              }}
            />
          </motion.div>

          <h3
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '8px'
            }}
          >
            Connect your Web3 Identity
          </h3>

          <p
            style={{
              fontSize: '13px',
              color: '#9ca3af',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}
          >
            Hold Nexus NFT to unlock 20% discount, premium AI access, and exclusive drops.
          </p>

          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={handleConnectWallet}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: 'rgba(6, 182, 212, 0.9)',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
              transition: 'all 0.3s ease',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 30px rgba(6, 182, 212, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.4)';
            }}
          >
            Connect Wallet
          </motion.button>
        </motion.div>
      ) : (
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
                {mockWalletAddress}
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
      {walletConnected && (
        <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
          {/* Order History */}
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
              <Package size={20} style={{ color: '#a855f7' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                Logistics & Orders
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
      )}

      {/* 🚨 Danger Zone */}
      {walletConnected && (
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
    </motion.div>
  );
}
