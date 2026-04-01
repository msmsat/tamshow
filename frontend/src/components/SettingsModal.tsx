import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Wallet, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { tgId, walletAddress, shippingAddress, internalBalance } = useUserStore();

  const InfoRow = ({ icon: Icon, label, value, color }: any) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
      backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div style={{ backgroundColor: `${color}15`, padding: '10px', borderRadius: '12px' }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{ color: '#9ca3af', fontSize: '11px', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
        <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }}>
          {value || 'Not linked'}
        </p>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              maxHeight: '85vh', minHeight: '50vh', overflowY: 'auto', zIndex: 201,
              backgroundColor: '#0f0f0f', borderRadius: '28px',
              border: '1px solid rgba(168,85,247,0.3)', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ width: '40px', height: '4px', backgroundColor: '#374151', borderRadius: '2px', margin: '0 auto 24px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: 0 }}>System Settings</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <InfoRow icon={User} label="Telegram ID" value={tgId} color="#a855f7" />
              <InfoRow icon={Wallet} label="Web3 Wallet" value={walletAddress} color="#06b6d4" />
              <InfoRow icon={MapPin} label="Delivery Point" value={shippingAddress} color="#f59e0b" />
              
              <div style={{ 
                marginTop: '12px', padding: '20px', borderRadius: '20px', 
                background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(6,182,212,0.1) 100%)',
                border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center'
              }}>
                <CreditCard size={24} color="#fff" style={{ marginBottom: '8px' }} />
                <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 4px 0' }}>Available Balance</p>
                <h3 style={{ color: '#fff', fontSize: '28px', fontWeight: 900, margin: 0 }}>${internalBalance.toFixed(2)}</h3>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: '#22c55e', fontSize: '12px' }}>
              <ShieldCheck size={14} /> <span>End-to-end encrypted identity</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}