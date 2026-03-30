import { ShoppingBag, ArrowLeft, Minus, Trash2, Plus, Zap, ShieldCheck, ArrowRight, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useUserStore } from '../store/useUserStore';
import { useCartStore } from '../store/useCartStore';
import { WalletConnect } from '../components/WalletConnect';
import { ALL_PRODUCTS } from '../store/products'; 

import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';

// 🔥 Константа для максимального количества мерча в корзине
const MAX_MERCH_QUANTITY = 10;

export function Cart({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const { walletAddress } = useUserStore();
  
  // 1. ДОСТАЕМ fetchCart из стора
  const { cart, removeFromCart, updateQuantity: updateCartQuantity, fetchCart } = useCartStore();
  // 2. ВРЕМЕННО ХАРДКОДИМ ID (позже возьмем из Telegram)
  const tgId = "620994031"; 

  // 3. ДОСТАЕМ ВСЕ ТОВАРЫ (Вам нужно взять их оттуда же, откуда вы их берете в Shop.tsx)
  // Например, если у вас есть useShopStore: const { products } = useShopStore();
  // Если они у вас пока просто в константе/массиве, подставьте сюда этот массив.
  const allProducts = ALL_PRODUCTS; // Замените на реальный источник товаров

  // 4. ДОБАВЛЯЕМ МАГИЮ ЗАГРУЗКИ:
  useEffect(() => {
    // При открытии корзины - качаем ее из БД!
    fetchCart(tgId, allProducts);
  }, []); // Пустые скобки означают "сделать 1 раз при открытии"

  const handleQuantityChange = (productId: string, delta: number) => {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    if (delta === -1 && item.quantity === 1) {
      removeFromCart(productId);
      return;
    }

    updateCartQuantity(productId, item.quantity + delta);
  };

  // Вычисления
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = walletAddress ? Math.round(subtotal * 0.2) : 0;

  // Empty State - Data Void
  if (cart.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          padding: '20px',
          textAlign: 'center',
          background: 'radial-gradient(circle at 50% 10%, rgba(168, 85, 247, 0.15) 0%, rgba(0, 0, 0, 0) 50%)' // Тот самый красивый градиент из Shop
        }}
      >
        {/* Hologram Effect */}
        <div style={{ position: 'relative', marginBottom: '32px' }}>
          {/* Glow Background */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '128px',
              height: '128px',
              backgroundColor: 'rgba(6, 182, 212, 0.2)',
              borderRadius: '50%',
              filter: 'blur(48px)',
              zIndex: 0
            }}
          />
          {/* Icon */}
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShoppingBag size={96} style={{ color: 'rgba(6, 182, 212, 0.2)' }} />
          </motion.div>
        </div>

        {/* Typography */}
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#e5e7eb',
          marginBottom: '12px',
          letterSpacing: '-0.5px'
        }}>
          Your cart is empty
        </h2>

        <p style={{
          fontSize: '14px',
          color: '#9ca3af',
          maxWidth: '280px',
          marginBottom: '32px',
          lineHeight: '1.6'
        }}>
          Jack into the Nexus to discover exclusive drops and digital artifacts.
        </p>

        {/* CTA Button */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          whileHover={{ scale: 1.02 }}
          style={{
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.5)',
            borderRadius: '12px',
            padding: '14px 32px',
            color: '#06b6d4',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onClick={() => onTabChange?.('shop')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.15)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Start Shopping
        </motion.button>
      </motion.div>
    );
  }

  // Filled State - Active Loadout
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        background: 'radial-gradient(circle at 50% 10%, rgba(168, 85, 247, 0.15) 0%, rgba(0, 0, 0, 0) 50%)', // Добавили градиент!
        paddingTop: '24px',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingBottom: '180px'
      }}
    >
      {/* Header with Inventory Title */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '32px'
      }}>
        {/* Кнопка НАЗАД */}
        <button 
          onClick={() => onTabChange?.('shop')}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            marginLeft: '-8px' // Выравниваем по левому краю
          }}
        >
          <ArrowLeft size={24} />
        </button>

        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          backgroundImage: 'linear-gradient(to right, #ffffff, #9ca3af)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0
        }}>
          Inventory
        </h1>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            backgroundColor: 'rgba(168, 85, 247, 0.2)',
            border: '1px solid rgba(168, 85, 247, 0.5)',
            borderRadius: '20px',
            padding: '6px 12px',
            color: '#c084fc',
            fontSize: '12px',
            fontWeight: 700,
            minWidth: '32px',
            textAlign: 'center'
          }}
        >
          [ {cart.length} ]
        </motion.div>
      </div>

      {/* Zone A: Item Data Stream */}
      <div style={{ marginBottom: '20px' }}>
        {/* 1. УБРАЛИ mode="popLayout" - теперь карточка не будет "схлопываться" по ширине */}
        <AnimatePresence>
          {cart.map(item => (
            /* ВНЕШНИЙ СЛОЙ: Отвечает за плавное раскрытие и выезд СВЕРХУ (y: -40) */
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, height: 0, y: -40 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -40 }}
              transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
              style={{ 
                overflow: 'hidden',
                // 🔥 ИСПРАВЛЕНИЕ 2: Заранее готовим браузер к анимации
                willChange: 'opacity, transform, height' 
              }}
            >
              {/* СРЕДНИЙ СЛОЙ: Делает отступ между карточками. 
                  Так как он внутри overflow: hidden, он будет плавно схлопываться вместе с карточкой! */}
              <div style={{ paddingBottom: '12px' }}>
                
                {/* ВНУТРЕННИЙ СЛОЙ: Сама карточка товара с красивым дизайном */}
                <div style={{
                  backgroundColor: 'rgba(23, 23, 23, 0.6)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                }}>
                  
                  {/* Product Image */}
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    {item.image.startsWith('/') || item.image.startsWith('http') ? (
                      <img 
                        src={item.image} 
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      item.image
                    )}
                  </div>

                  {/* Info Block */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#ffffff',
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.title}
                    </h3>
                    
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                      Type: {item.category}
                    </p>

                    {/* Price Display */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {walletAddress && (
                        <span style={{ fontSize: '11px', color: '#9ca3af', textDecoration: 'line-through' }}>
                          ${item.price}
                        </span>
                      )}
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#a855f7' }}>
                        ${walletAddress ? Math.round(item.price * 0.8) : item.price}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Adjuster - Glass Capsule */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '24px',
                    paddingLeft: '8px', paddingRight: '8px', paddingTop: '6px', paddingBottom: '6px',
                    flexShrink: 0
                  }}>
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      style={{
                        background: 'none', border: 'none',
                        color: item.quantity === 1 ? '#ef4444' : '#9ca3af',
                        cursor: 'pointer', padding: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = item.quantity === 1 ? '#ff6b6b' : '#d1d5db'}
                      onMouseLeave={(e) => e.currentTarget.style.color = item.quantity === 1 ? '#ef4444' : '#9ca3af'}
                    >
                      {item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                    </button>

                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', minWidth: '16px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      style={{
                        background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#d1d5db'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Zone B: Smart Contract Status */}
      {walletAddress ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <ShieldCheck size={20} style={{ color: '#22c55e', flexShrink: 0 }} />
          <div>
            <p style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#22c55e',
              margin: '0 0 4px 0'
            }}>
              Nexus Holder Verified. Level 4 Clearance.
            </p>
            <p style={{
              fontSize: '12px',
              color: '#86efac',
              margin: 0
            }}>
              20% Smart Contract discount successfully applied
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: 'rgba(180, 83, 9, 0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '20px'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <Zap size={18} style={{ color: '#eab308', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#fbbf24',
                margin: '0 0 4px 0'
              }}>
                You're leaving money on the table!
              </p>
              <p style={{
                fontSize: '12px',
                color: '#fed7aa',
                margin: '0 0 12px 0',
                lineHeight: '1.5'
              }}>
                Connect your Web3 wallet and hold Nexus NFT to instantly save ${discount} on this loadout.
              </p>
              <div style={{ marginTop: '12px' }}>
                <WalletConnect color="#fbbf24" borderColor="1px solid rgba(217, 119, 6, 0.5)"
                mouseEnterColor='rgba(217, 119, 6, 0.1)' mouseLeaveColor='transparent' mouseEnterBorderColor='rgba(217, 119, 6, 0.5)' mouseLeaveBorderColor='rgba(217, 119, 6, 0.3)' />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Sticky Checkout Footer Component
export function CheckoutFooter() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { walletAddress } = useUserStore();
  const { cart, fetchCart } = useCartStore();
  const [showPayQR, setShowPayQR] = useState(false);
  const [depositAddress, setDepositAddress] = useState(''); // Сюда положим адрес от Питона
  const [isFetchingAddress, setIsFetchingAddress] = useState(false); // Статус загрузки
  const tgId = "620994031"; // Временно хардкодим tgId (как ты делал выше в Cart)
  const [balance, setBalance] = useState<number | null>(null);
  const [canPay, setCanPay] = useState<boolean>(false);
  const [backendTotal, setBackendTotal] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState(false); // Состояние "Успешно оплачено"
  const [isPaying, setIsPaying] = useState(false);
  
  // === СЛУШАЕМ ОТКРЫТИЕ ЧЕКА ===
  // Как только isExpanded меняется на true, сразу дергаем бэкенд
  useEffect(() => {
    if (isExpanded) {
      fetchAddressFromBackend();
    }
  }, [isExpanded]);

  // === ВСТАВЛЯЕМ ТВОЮ ФУНКЦИЮ СЮДА ===
  const fetchAddressFromBackend = async () => {
    // Мы убрали блокировку "if (depositAddress) return;"
    // Теперь React ВСЕГДА будет стучаться на бэкенд при открытии чека,
    // давая бэкенду шанс проверить статус (active/deactive) и починить его!
    
    setIsFetchingAddress(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/wallet/get-address?tg_id=${tgId}`);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      if (data.status === 'success' && data.address) {
        setDepositAddress(data.address);
      } else {
        console.error("Backend error:", data);
        alert("Failed to generate secure address. Try again.");
      }
    } catch (error) {
      console.error("Ошибка при получении адреса:", error);
    } finally {
      setIsFetchingAddress(false);
    }
  };

  // === ФУНКЦИЯ ПРОВЕРКИ БАЛАНСА (С АЛЕРТАМИ) ===
  const checkBalance = async () => {
    setIsFetchingAddress(true); 
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/cart/checkout-preview/${tgId}`);
      if (!response.ok) throw new Error('Network error');
      
      const data = await response.json();
      
      // 1. Сохраняем данные без ошибок (теперь React знает эти set-функции)
      setBalance(data.internal_balance || 0); 
      setCanPay(data.can_pay || false); 
      setBackendTotal(data.calculated_total || 0);
      setDepositAddress(data.deposit_address || ''); 
      
      // 2. Выводим Алерты, как ты просил
      if (data.can_pay) {
        console.log(`✅ Денег хватает! На балансе: $${data.internal_balance}`);
      } else {
        console.log(`❌ Денег НЕ хватает! Баланс: $${data.internal_balance}, а нужно: $${data.calculated_total}`);
      }

    } catch (error) {
      console.error("Ошибка при проверке баланса:", error);
      alert("❌ Ошибка соединения с сервером!");
    } finally {
      setIsFetchingAddress(false);
    }
  };

  // === ФУНКЦИЯ РЕАЛЬНОЙ ОПЛАТЫ ===
  const handlePayment = async () => {
    if (!canPay) return;
    setIsPaying(true); // Включаем загрузку на кнопке
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/cart/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tg_id: tgId, 
          // Отправляем сумму, которую посчитал бэкенд (или локальную, если бэкенд тупит)
          total_amount: backendTotal !== null ? backendTotal : total 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsSuccess(true); 
        fetchCart(tgId, ALL_PRODUCTS); // Берем напрямую из импорта!
      } else {
        alert(`❌ Ошибка оплаты: ${data.error}`);
      }
    } catch (error) {
      console.error("Ошибка при оплате:", error);
      alert("❌ Сбой соединения с сервером.");
    } finally {
      setIsPaying(false);
    }
  };

  useEffect(() => {
    checkBalance();
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = walletAddress ? Math.round(subtotal * 0.2) : 0;
  const networkFee = Math.round(subtotal * 0.05);
  const total = subtotal - discount + networkFee;
  const isEnoughBalance = balance !== null && balance >= total;

  return (
    <>
    <motion.div
      // МАГИЯ ПЛАВНОСТИ: layout заставляет контейнер плавно менять размер
      layout
      transition={{ duration: 0.4, ease: "easeInOut" }} // Вот здесь настраивается скорость (0.4 секунды)
      style={{
        position: 'fixed',
        bottom: '64px',
        left: '0',
        right: '0',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '5px',
        paddingBottom: '20px',
        backgroundColor: 'rgba(10, 10, 10, 0.85)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderTop: '1px solid rgba(168, 85, 247, 0.4)',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden' // Важно: обрезает контент при закрытии
      }}
    >
      {/* 1. Зона Клика (Анимированная цельная SVG-линия) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '32px',
          cursor: 'pointer',
          marginBottom: '8px'
        }}
      >
        <svg 
          width="40" 
          height="11" 
          viewBox="0 0 40 15" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            // d - это координаты линии. 
            // M - начало (Move to), L - линия до (Line to).
            // Закрыто (^): От левого низа -> в центр наверх -> в правый низ
            // Открыто (v): От левого верха -> в центр вниз -> в правый верх
            animate={{ 
              d: isExpanded 
                ? "M 2 2 L 20 12 L 38 2" 
                : "M 2 12 L 20 2 L 38 12",
              stroke: isExpanded ? "#9ca3af" : "#6b7280"
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            strokeWidth="4" // Толщина линии (как у наших палок)
            strokeLinecap="round" // Закругляет концы линии
            strokeLinejoin="round" // МАГИЯ: Делает угол сгиба идеально круглым и цельным!
            initial={false}
          />
        </svg>
      </div>

      {/* 2. Скрытый Чек (Всегда существует, но сжимается до нуля) */}
      <motion.div
        initial={false}
        animate={{ 
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0 
        }}
        // Магическая формула плавности (Cubic Bezier) как в Apple
        transition={{ 
          duration: 0.4, 
          ease: [0.25, 1, 0.5, 1] 
        }}
        style={{ 
          overflow: 'hidden', // Обязательно: обрезает контент, пока высота 0
          willChange: 'height, opacity' // Подсказка браузеру: заранее включи видеокарту для этого блока
        }}
      >
        <div style={{ paddingBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {isSuccess ? (
            // === ЭКРАН УСПЕХА ===
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ padding: '24px', textAlign: 'center', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '16px', border: '1px solid rgba(34, 197, 94, 0.3)' }}
            >
              <div style={{ width: '48px', height: '48px', backgroundColor: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <ShieldCheck size={24} color="#ffffff" />
              </div>
              <h3 style={{ color: '#ffffff', fontSize: '18px', margin: '0 0 8px' }}>Payment Successful!</h3>
              <p style={{ color: '#86efac', fontSize: '12px', margin: 0 }}>Items have been added to your inventory.</p>
            </motion.div>
          ) : (
            // === ОБЫЧНЫЙ ЭКРАН ЧЕКА (Оставляем твой старый код внутри) ===
            <>
              {/* Subtotal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#9ca3af' }}>Subtotal</span>
                <span style={{ color: '#d1d5db', fontWeight: 600 }}>${subtotal}</span>
              </div>
              
              {/* Network Fee */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#9ca3af' }}>Network Fee</span>
                <span style={{ color: '#d1d5db', fontWeight: 600 }}>${networkFee}</span>
              </div>
              
              {/* VIP Discount */}
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#22c55e' }}>VIP Discount</span>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>-${discount}</span>
                </div>
              )}
              
              <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '8px 0' }} />

              {/* === БЛОК ПРОВЕРКИ БАЛАНСА === */}
              {isFetchingAddress ? (
                <div style={{ textAlign: 'center', padding: '10px', color: '#06b6d4', fontSize: '12px' }}>Checking Nexus Balance...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#9ca3af', fontSize: '13px' }}>Your Balance:</span>
                    <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}>${balance?.toFixed(2)} USDC</span>
                  </div>

                  {isEnoughBalance ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                      <span style={{ color: '#86efac', fontSize: '12px' }}>After payment:</span>
                      <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '13px' }}>+${(balance! - total).toFixed(2)} USDC</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#fca5a5', fontSize: '12px' }}>Missing funds:</span>
                        <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '13px' }}>-${(total - balance!).toFixed(2)} USDC</span>
                      </div>
                      <button 
                        onClick={() => setShowPayQR(true)} 
                        style={{ backgroundColor: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', padding: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <QrCode size={14} /> Deposit to Balance
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
        
      </motion.div>

      {/* 3. Итоговая цена и кнопка (Видны всегда) */}
      <motion.div layout style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.5px' }}>
            TOTAL
          </span>
          <span style={{
            fontSize: '24px', fontWeight: 'black',
            backgroundImage: 'linear-gradient(to right, #a855f7, #06b6d4)',
            backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            ${total}
          </span>
        </div>

        <motion.button
          whileTap={{ scale: (!isExpanded || isEnoughBalance || isSuccess) ? 0.95 : 1 }}
          onClick={() => {
             if (isSuccess) {
                 setIsExpanded(false);
                 setTimeout(() => setIsSuccess(false), 500); 
             } else if (!isExpanded) {
                 setIsExpanded(true);
             } else if (isEnoughBalance && !isPaying) {
                 handlePayment(); 
             }
          }}
          disabled={isExpanded && !isEnoughBalance && !isSuccess}
          style={{
             flex: 1, height: '48px', 
             background: (isExpanded && !isEnoughBalance && !isSuccess) ? '#374151' : 'linear-gradient(to right, rgba(168, 85, 247, 0.9), rgba(59, 130, 246, 0.9))',
             border: 'none', borderRadius: '12px', 
             color: (isExpanded && !isEnoughBalance && !isSuccess) ? '#9ca3af' : '#ffffff', 
             fontSize: '13px', fontWeight: 700, 
             cursor: (isExpanded && !isEnoughBalance && !isSuccess) ? 'not-allowed' : 'pointer',
             boxShadow: (isExpanded && !isEnoughBalance && !isSuccess) ? 'none' : '0 0 20px rgba(168, 85, 247, 0.4)', 
             display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
             transition: 'all 0.3s'
          }}
        >
          <span>
            {isPaying ? 'Processing...' : 
              isSuccess ? 'Close Receipt' : 
                (isExpanded ? (isEnoughBalance ? 'Confirm & Pay' : 'Insufficient Balance') : 'Checkout')
            }
          </span>
          {!isPaying && !isSuccess && isEnoughBalance && <ArrowRight size={14} />}
        </motion.button>
      </motion.div>
    </motion.div>
    {/* 2. А ВОТ ТЕПЕРЬ, СНАРУЖИ ФУТЕРА, СТАВИМ НАШ QR-КОД */}
      <AnimatePresence>
        {showPayQR && (
          <>
            {/* Темный фон на весь экран */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPayQR(false)} 
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', zIndex: 90 }}
            />

            {/* Само окно (ПО ЦЕНТРУ, НО ВЫЕЗЖАЕТ СНИЗУ) */}
            <motion.div
              // МАГИЯ АНИМАЦИИ: 
              // Начинает снизу за экраном (y: '100vh')
              initial={{ opacity: 0, x: '-50%', y: '100vh' }} 
              // Прилетает ровно в центр (y: '-50%')
              animate={{ opacity: 1, x: '-50%', y: '-50%' }} 
              // Уезжает обратно вниз при закрытии
              exit={{ opacity: 0, x: '-50%', y: '100vh' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed', 
                top: '50%', // Центрирование
                left: '50%', // Центрирование
                
                width: 'calc(100% - 32px)', 
                maxWidth: '360px', 
                maxHeight: 'calc(100vh - 90px)', 
                overflowY: 'auto', 
                
                backgroundColor: 'rgba(10, 10, 10, 0.95)', 
                backdropFilter: 'blur(20px)',
                zIndex: 100, 
                borderRadius: '24px', 
                padding: '32px 24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', 
                border: '1px solid rgba(6, 182, 212, 0.5)',
                boxShadow: '0 0 50px rgba(0,0,0,0.8)' 
              }}
            >
              {/* Кнопка закрытия */}
              <button onClick={() => setShowPayQR(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={24} />
              </button>

              <h3 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>Scan to Pay</h3>
              <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', marginBottom: '24px', maxWidth: '250px' }}>
                Scan this QR with Binance, Bybit, or any crypto app to send exactly <strong style={{color: '#06b6d4'}}>{total} USDC</strong>.
              </p>

              {/* === УМНЫЙ БЛОК С ЗАГРУЗКОЙ === */}
              {isFetchingAddress ? (
                // ПОКА ГРУЗИТСЯ — ПОКАЗЫВАЕМ АНИМАЦИЮ
                <div style={{ padding: '40px', color: '#06b6d4', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Zap size={32} style={{ animation: 'pulse 2s infinite', marginBottom: '16px' }} />
                  <p style={{ fontSize: '14px', margin: 0 }}>Generating secure address...</p>
                </div>
              ) : (
                // КОГДА ЗАГРУЗИЛОСЬ И АДРЕС ЕСТЬ — ПОКАЗЫВАЕМ QR
                depositAddress && (
                  <>
                    <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '16px', boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)', marginBottom: '24px' }}>
                      <QRCodeSVG value={depositAddress} size={180} fgColor="#000000" bgColor="#ffffff" />
                    </div>

                    <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', width: '100%', textAlign: 'center' }}>
                      <p style={{ color: '#9ca3af', fontSize: '10px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Store Polygon Address</p>
                      <p style={{ color: '#cffafe', fontSize: '11px', fontFamily: 'monospace', margin: 0, wordBreak: 'break-all' }}>
                        {depositAddress}
                      </p>
                    </div>
                  </>
                )
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </> // 3. Закрываем пустой тег (Fragment) в самом конце
  );
}