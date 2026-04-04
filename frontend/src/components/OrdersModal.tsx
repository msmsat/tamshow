import { useState, useEffect } from 'react'; // 🔥 ВОТ ЭТОТ ИМПОРТ РЕШАЕТ ПРОБЛЕМУ БЕЛОГО ЭКРАНА!
import { motion, AnimatePresence } from 'framer-motion';
import { Package, X, ShoppingBag, ArrowRight, Truck, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useUserStore, telegramInitData } from '../store/useUserStore';
import { ALL_PRODUCTS } from '../store/products';

// Описываем, как выглядит заказ
interface Order {
  id: number;
  name: string;
  date: string;
  status: string;
  tracking: string;
  is_viewed: boolean; // 🔥 ДОБАВЛЯЕМ ЭТО ПОЛЕ
  product_id: string;
}

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToCart: () => void;
}

export function OrdersModal({ isOpen, onClose, onGoToCart }: OrdersModalProps) {
  const { tgId } = useUserStore();
  // 1. Создаем стейты для хранения заказов из БД и индикатора загрузки
  const [fetchedOrders, setFetchedOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // 🔥 2. НОВОЕ СОСТОЯНИЕ ДЛЯ ВЫБРАННОГО ЗАКАЗА
  // null - показываем список, {order} - показываем деталь одного заказа
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);


  // 2. Стучимся в базу данных каждый раз, когда открывается модалка
  useEffect(() => {
    if (isOpen && tgId) {
      const fetchOrders = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`${import.meta.env.VITE_FRONTEND_URL}/api/profile/orders`, {
            headers: {
              "ngrok-skip-browser-warning": "true",
              'Authorization': `tma ${telegramInitData}`
            }
          });
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

  // 2. ФУНКЦИЯ ОТМЕНЫ ЗАКАЗА
  const handleCancelOrder = async (itemId: number) => {
    if (!window.confirm("Are you sure you want to cancel? Funds will be refunded to your balance.")) return;
    
    setIsCancelling(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_FRONTEND_URL}/api/profile/orders/cancel`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          "ngrok-skip-browser-warning": "true",
          'Authorization': `tma ${telegramInitData}`
        },
        body: JSON.stringify({ item_id: itemId })
      });
      const data = await response.json();
      
      if (data.success) {
        // Убираем отмененный заказ из списка в React
        setFetchedOrders(prev => prev.filter(o => o.id !== itemId));
        // Возвращаемся к списку
        setSelectedOrder(null); 
      } else {
        alert(data.error || "Failed to cancel order");
      }
    } catch (error) {
      console.error(error);
      alert("Network error");
    } finally {
      setIsCancelling(false);
    }
  };

  // 🔥 ФУНКЦИЯ КЛИКА ПО ЗАКАЗУ
  const handleOrderClick = async (order: Order) => {
    // 1. Открываем детальное окно
    setSelectedOrder(order);

    // 2. Если заказ уже был просмотрен, больше ничего не делаем
    if (order.is_viewed) return;

    // 3. Мгновенно убираем плашку "NEW" в самом React (чтобы юзер не ждал)
    setFetchedOrders(prevOrders => 
      prevOrders.map(o => o.id === order.id ? { ...o, is_viewed: true } : o)
    );

    // 4. Отправляем Питону команду сохранить это в базу данных
    try {
      await fetch(`${import.meta.env.VITE_FRONTEND_URL}/api/profile/orders/mark-viewed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "ngrok-skip-browser-warning": "true",
          'Authorization': `tma ${telegramInitData}`
        },
        body: JSON.stringify({
          item_id: order.id // <-- Отправляем ID конкретного заказа
        })
      });
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error);
    }
  };

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
              maxHeight: '90vh', overflowY: 'auto', zIndex: 101,
              backgroundColor: '#0a0a0a',
              borderTop: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '24px 24px 0 0',
              padding: '24px',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)'
            }}
          >
            <AnimatePresence mode="wait">
              {/* === ЭКРАН 1: ДЕТАЛИ КОНКРЕТНОГО ЗАКАЗА === */}
              {selectedOrder ? (
                <motion.div 
                  key="detail"
                  initial={{ opacity: 0, y: 50 }} 
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  transition={{ duration: 0.3 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <button 
                      onClick={() => setSelectedOrder(null)} 
                      style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px', marginLeft: '-8px' }}
                    >
                      <ArrowLeft size={24} />
                    </button>
                    <h3 style={{ color: '#fff', fontSize: '18px', margin: 0, fontWeight: 700 }}>Order ID #{selectedOrder.id}</h3>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
                    
                    {/* 🔥 ФОТО ПРОДУКТА (Ищем по ID в ALL_PRODUCTS) */}
                    <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                          src={ALL_PRODUCTS.find(p => p.id === selectedOrder.product_id)?.image || '/placeholder.webp'} 
                          alt={selectedOrder.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>

                    {/* Инфо */}
                    <div style={{ padding: '0 4px' }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
                            <h2 style={{ color: '#fff', fontSize: '22px', margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>{selectedOrder.name}</h2>
                            {selectedOrder.is_viewed === false && (
                                <span style={{ backgroundColor: '#06b6d4', color: '#000000', fontSize: '10px', fontWeight: 900, padding: '3px 7px', borderRadius: '6px', letterSpacing: '0.5px', marginTop: '2px' }}>
                                    NEW
                                </span>
                            )}
                        </div>
                        <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 20px 0' }}>Ordered on {selectedOrder.date}</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <span style={{ color: '#9ca3af', fontSize: '14px' }}>Delivery Status</span>
                                <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '14px' }}>{selectedOrder.status}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '14px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <span style={{ color: '#9ca3af', fontSize: '12px' }}>Tracking Number</span>
                                <span style={{ color: '#d1d5db', fontFamily: 'monospace', fontSize: '15px', fontWeight: 600, letterSpacing: '1px', wordBreak: 'break-all' }}>{selectedOrder.tracking}</span>
                            </div>
                        </div>
                    </div>

                    {/* 🔥 БОЕВАЯ КНОПКА ОТМЕНЫ */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCancelOrder(selectedOrder.id)}
                        disabled={isCancelling}
                        style={{
                            width: '100%', padding: '18px', borderRadius: '14px',
                            backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444', fontWeight: 700, fontSize: '15px', display: 'flex', justifyContent: 'center', 
                            alignItems: 'center', gap: '8px', cursor: isCancelling ? 'not-allowed' : 'pointer', marginTop: '10px'
                        }}
                    >
                        {isCancelling ? 'Processing...' : <><AlertTriangle size={20}/> Cancel & Refund Order</>}
                    </motion.button>
                  </div>

                </motion.div>
              ) : (
                /* === ЭКРАН 2: СПИСОК ВСЕХ ЗАКАЗОВ === */
                <motion.div 
                  key="list"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.5px' }}>
                      <Package color="#a855f7" size={24} /> My Deliveries
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: '4px' }}>
                      <X size={26} />
                    </button>
                  </div>

                  <div style={{width: '100%', height: '1px', background: 'linear-gradient(90deg, rgba(168,85,247,0) 0%, rgba(168,85,247,0.5) 50%, rgba(168,85,247,0) 100%)', marginBottom: '20px'}}></div>

                  {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#06b6d4', fontWeight: 'bold' }}>
                      Loading database records...
                    </div>
                  ) : fetchedOrders.length === 0 ? (
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
                      {/* Сортировка перенесена в Питон, поэтому reverse() убрали */}
                      {fetchedOrders.map(order => (
                        <motion.div 
                          key={order.id} 
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleOrderClick(order)} 
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '18px', padding: '18px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                          whileHover={{ borderColor: 'rgba(6, 182, 212, 0.3)'}}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h4 style={{ color: '#ffffff', margin: 0, fontSize: '16px', fontWeight: 600 }}>{order.name}</h4>
                              {order.is_viewed === false && (
                                <span style={{ backgroundColor: '#06b6d4', color: '#000000', fontSize: '10px', fontWeight: 900, padding: '2px 6px', borderRadius: '6px', letterSpacing: '0.5px' }}>
                                  NEW
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '11px', color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '5px 9px', borderRadius: '8px', fontWeight: 800, letterSpacing: '0.5px' }}>
                              {order.status.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '13px' }}>
                            <Truck size={15} color="#6b7280" /> Tracking: <span style={{ fontFamily: 'monospace', color: '#d1d5db', letterSpacing: '0.5px' }}>{order.tracking}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px' }}>Ordered: {order.date}</div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}