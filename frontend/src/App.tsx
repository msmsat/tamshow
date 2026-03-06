import { useState } from 'react';
import { motion } from 'framer-motion';
// Берем нужные иконки из Lucide (как в ТЗ)
import { Home as HomeIcon, ShoppingBag, MessageSquare, ShoppingCart, User } from 'lucide-react';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetails } from './pages/ProductDetails';
import { AiChat } from './pages/AiChat';
import { useStore } from './store/useStore';

// Список наших вкладок
const TABS = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'shop', label: 'Shop', Icon: ShoppingBag },
  { id: 'chat', label: 'AI Support', Icon: MessageSquare },
  { id: 'cart', label: 'Cart', Icon: ShoppingCart },
  { id: 'profile', label: 'Profile', Icon: User },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const { selectedProductId } = useStore();

  return (
    // Главный экран: жестко фиксируем 100vh, чтобы не было системного скролла!
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      width: '100vw',
      backgroundColor: '#0a0a0a', // Очень темный фон сайта
      color: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      overflow: 'hidden' // Блокируем скролл всей страницы
    }}>
      
      {/* КОНТЕНТ (Сюда будут грузиться страницы) */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', // Скролл только вниз
        overflowX: 'hidden', // Блокируем скролл вправо
        padding: '0px',
        paddingBottom: '0px'
      }}>
        {selectedProductId ? (
          <ProductDetails productId={selectedProductId} />
        ) : (
          <>
            {activeTab === 'home' && <Home onTabChange={setActiveTab} />}
            {activeTab === 'shop' && <Shop />}
            {activeTab === 'chat' && <AiChat />}
            {activeTab === 'cart' && <div style={{ color: '#9ca3af', padding: '20px' }}>Cart coming soon...</div>}
            {activeTab === 'profile' && <div style={{ color: '#9ca3af', padding: '20px' }}>Profile coming soon...</div>}
          </>
        )}
      </div>

      {/* 📱 BOTTOM BAR (Тот самый киберпанк) */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: 'rgba(23, 23, 23, 0.8)', // bg-neutral-900/80
        backdropFilter: 'blur(12px)', // Эффект матового стекла
        WebkitBackdropFilter: 'blur(12px)', // Для Safari
        borderTop: '1px solid rgba(255, 255, 255, 0.05)', // Тонкая граница
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50
      }}>
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                flex: 1, // Каждая кнопка занимает равную долю ширины
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                outline: 'none'
              }}
            >
              {/* АНИМИРОВАННЫЙ НЕОНОВЫЙ ИНДИКАТОР (Магия Framer Motion) */}
              {isActive && (
                <motion.div
                  layoutId="activeTab" // Именно этот ID заставляет маркер перелетать
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  style={{
                    position: 'absolute',
                    top: '-12px', // absolute -top-3
                    width: '32px', // w-8
                    height: '4px', // h-1
                    backgroundColor: '#a855f7', // Фиолетовый неон
                    borderRadius: '9999px',
                    boxShadow: '0 0 10px #a855f7' // Свечение
                  }}
                />
              )}

              {/* ИКОНКА */}
              <Icon
                size={24}
                style={{
                  color: isActive ? '#c084fc' : '#9ca3af',
                  transition: 'color 0.2s',
                  marginBottom: '4px'
                }}
              />
              
              {/* ТЕКСТ */}
              <span style={{
                fontSize: '10px',
                fontWeight: 500,
                color: isActive ? '#c084fc' : '#6b7280',
                transition: 'color 0.2s'
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
}