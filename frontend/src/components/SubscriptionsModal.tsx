import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { ALL_PRODUCTS } from '../store/products';
import { useUserStore } from '../store/useUserStore';

// 🔥 1. Правильно описываем то, что реально присылает Питон
interface Subscription {
  id: number;
  type: string;       // Бэкенд шлет type (например "VIP Pass")
  status: string;
  start_date: string; // Бэкенд шлет start_date
  end_date: string;
}

interface SubscriptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToShop: () => void;
}

export function SubscriptionsModal({ isOpen, onClose, onGoToShop }: SubscriptionsModalProps) {
  const { tgId } = useUserStore();
  // 🔥 2. Используем наш правильный интерфейс
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Делаем запрос только если модалка открыта и есть tgId
    if (isOpen && tgId) {
      const fetchSubscriptions = async () => {
        setIsLoading(true);
        try {
          // 🔥 Тот самый новый путь
          const response = await fetch(`${import.meta.env.VITE_FRONTEND_URL}/api/shop/subscriptions`, {
            headers: {
              "ngrok-skip-browser-warning": "true"
            }
          });
          
          if (!response.ok) throw new Error("Ошибка сети");
          
          const result = await response.json();
          if (result.status === "success") {
            setSubscriptions(result.data);
          } else {
            setSubscriptions([]);
          }
        } catch (error) {
          console.error("Ошибка при загрузке подписок:", error);
          setSubscriptions([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchSubscriptions();
    }
  }, [isOpen, tgId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Затемнение фона */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
          />

          {/* Сама шторка */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              maxHeight: '85vh', minHeight: '50vh', overflowY: 'auto', zIndex: 101,
              backgroundColor: '#0a0a0a', borderTop: '1px solid rgba(6, 182, 212, 0.3)', // Циановый цвет
              borderRadius: '24px 24px 0 0', padding: '24px', boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Полоска-хваталка вверху */}
            <div style={{ width: '40px', height: '4px', backgroundColor: '#374151', borderRadius: '2px', margin: '0 auto 24px' }} />

            {/* Заголовок */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap color="#06b6d4" size={24} /> Active Access
              </h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: '4px' }}>
                <X size={26} />
              </button>
            </div>

            {/* Разделитель */}
            <div style={{width: '100%', height: '1px', background: 'linear-gradient(90deg, rgba(6,182,212,0) 0%, rgba(6,182,212,0.5) 50%, rgba(6,182,212,0) 100%)', marginBottom: '20px'}}></div>

            {/* Контент */}
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#06b6d4', fontWeight: 'bold' }}>
                Loading subscriptions...
              </div>
            ) : subscriptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0 20px' }}>
                <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <ShieldCheck size={32} color="#06b6d4" />
                </div>
                <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '8px' }}>No active subscriptions</h3>
                <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '32px' }}>Upgrade your account to get VIP perks.</p>
                <motion.button 
                  whileTap={{ scale: 0.95 }} onClick={onGoToShop} 
                  style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.5)', padding: '14px 24px', borderRadius: '12px', color: '#06b6d4', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', cursor: 'pointer' }}
                >
                  View Plans <ArrowRight size={18} />
                </motion.button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px' }}>
                {subscriptions.map(sub => {
                  // 🔥 3. Ищем картинку в базе ALL_PRODUCTS по названию (type), так как product_id тут нет
                  const matchedProduct = ALL_PRODUCTS.find(p => p.title === sub.type);
                  const imageUrl = matchedProduct ? matchedProduct.image : '/pass.webp'; // дефолтная картинка, если не нашли

                  return (
                    <motion.div 
                      key={sub.id} 
                      style={{ backgroundColor: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '18px', padding: '18px', display: 'flex', alignItems: 'center', gap: '16px' }}
                    >
                      <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#1a1a1a', flexShrink: 0 }}>
                          <img 
                            src={imageUrl} 
                            alt={sub.type} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                      </div>
                      <div style={{ flex: 1 }}>
                          {/* 🔥 4. Выводим sub.type вместо sub.name */}
                          <h4 style={{ color: '#ffffff', margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600 }}>{sub.type}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', color: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '4px 8px', borderRadius: '6px', fontWeight: 800 }}>{sub.status}</span>
                              {/* 🔥 5. Выводим sub.start_date вместо sub.date */}
                              {sub.start_date && (
                                <span style={{ fontSize: '11px', color: '#6b7280' }}>Since {sub.start_date}</span>
                              )}
                          </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}