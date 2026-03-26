import { motion, AnimatePresence } from 'framer-motion';
import { Package, X, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

// Описываем, как выглядит заказ
interface Order {
  id: number;
  name: string;
  date: string;
  status: string;
  tracking: string;
}

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onGoToCart: () => void;
}

export function OrdersModal({ isOpen, onClose, orders, onGoToCart }: OrdersModalProps) {
    const { tgId } = useUserStore();
    // 1. Создаем стейты для хранения заказов из БД и индикатора загрузки
  const [fetchedOrders, setFetchedOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 2. Стучимся в базу данных каждый раз, когда открывается модалка
  useEffect(() => {
    if (isOpen && tgId) {
      const fetchOrders = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`http://127.0.0.1:8000/api/profile/orders/${tgId}`);
          if (!response.ok) throw new Error("Ошибка сети");
          
          const data = await response.json();
          if (data.success) {
            setFetchedOrders(data.orders);
          } else {
            setFetchedOrders([]);
          }
        } catch (error) {
          console.error("Ошибка при загрузке заказов:", error);
          setFetchedOrders([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchOrders();
    }
  }, [isOpen, tgId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Темный размытый фон на весь экран */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)'
            }}
          />

          {/* Сама "Шторка", выезжающая снизу */}
          <motion.div
            initial={{ y: '100%' }} // Начинает за экраном внизу
            animate={{ y: 0 }}      // Поднимается на свое место
            exit={{ y: '100%' }}    // Уезжает обратно вниз
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              maxHeight: '80vh', overflowY: 'auto', zIndex: 101,
              backgroundColor: '#0a0a0a',
              borderTop: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '24px 24px 0 0',
              padding: '24px',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Маленькая полоска сверху (индикатор того, что можно потянуть/закрыть) */}
            <div style={{ width: '40px', height: '4px', backgroundColor: '#374151', borderRadius: '2px', margin: '0 auto 24px' }} />

            {/* Заголовок и кнопка закрытия */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package color="#a855f7" /> Active Orders
              </h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}>
                <X size={24} />
              </button>
            </div>

            {/* ЛОГИКА ОТОБРАЖЕНИЯ: Если заказов нет - пустое состояние, если есть - список */}
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0 20px' }}>
                <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <ShoppingBag size={32} color="#06b6d4" />
                </div>
                <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '8px' }}>No active deliveries</h3>
                <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '32px' }}>Your logistics bay is empty. Let's find some gear.</p>
                
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={onGoToCart} 
                  style={{ 
                    backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.5)', 
                    padding: '14px 24px', borderRadius: '12px', color: '#06b6d4', fontWeight: 'bold', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', cursor: 'pointer' 
                  }}
                >
                  Proceed to Cart <ArrowRight size={18} />
                </motion.button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px' }}>
                {orders.map(order => (
                  <div key={order.id} style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                      <h4 style={{ color: '#ffffff', margin: 0, fontSize: '15px', fontWeight: 600 }}>{order.name}</h4>
                      <span style={{ fontSize: '11px', color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '4px 8px', borderRadius: '8px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '12px' }}>
                      <Truck size={14} /> Tracking: <span style={{ fontFamily: 'monospace', color: '#d1d5db' }}>{order.tracking}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '12px' }}>Ordered: {order.date}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}