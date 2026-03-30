import { motion } from 'framer-motion';
import { ShoppingBag, Zap, ChevronRight } from 'lucide-react';
import { WalletConnect } from '../components/WalletConnect';
import { ProductCard } from '../components/ProductCard';
import { useUserStore } from '../store/useUserStore';
import { useUIStore } from '../store/useUIStore';
import type { Product } from '../store/types';
import { useEffect, useState } from 'react';


export function Home({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const { selectProduct } = useUIStore();
  const { walletAddress, tgId } = useUserStore();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  // 2. Делаем запрос к нашему API при загрузке компонента или изменении tgId
  console.log("Текущий tgId из стора:", tgId); // <-- Добавляем лог для проверки
  useEffect(() => {
    async function loadProducts() {
      // Если tgId еще не успел подгрузиться из стора, ничего не делаем
      console.log("Проверяем tgId перед загрузкой продуктов:", tgId); // <-- Логируем значение tgId перед загрузкой
      if (!tgId) return; 

      // 🛠 ТЕСТОВЫЙ ЗАПРОС ПЕРЕД ОСНОВНЫМ
      try {
        console.log("⏳ Отправляем тестовый PING...");
        const pingResponse = await fetch('/api/shop/ping');
        const pingData = await pingResponse.json();
        console.log("✅ УСПЕХ PING:", pingData);
      } catch (e) {
        console.error("❌ ОШИБКА PING (Скорее всего опять пришел HTML):", e);
      }

      console.log("Загружаем продукты для tgId:", tgId); // <-- Логируем, что начинаем загрузку
      try {
        const response = await fetch(`/api/shop/products?telegram_id=${tgId}&limit=2`);
        console.log("Загружаем продукты для tgId:", tgId); // <-- Логируем, что начинаем загрузку
        console.log("Ответ от API:", response); // <-- Логируем ответ от API
        if (response.ok) {
          const result = await response.json();
          
          // 3. Форматируем то, что пришло с бэка, под твой тип Product
          const formattedProducts: Product[] = result.data.map((item: any) => ({
            id: String(item.id),
            title: item.title,         // 🔥 Бэкенд уже шлет title!
            price: item.price,
            description: item.description,
            category: item.category as 'merch' | 'subscription', // 🔥 Говорим TypeScript точный тип
            is_bought: item.is_bought, 
            image: item.image          // 🔥 Бэкенд уже шлет картинку!
          }));

          // 4. Обновляем состояние
          setFeaturedProducts(formattedProducts);
        }
      } catch (error) {
        console.error("Ошибка при загрузке товаров:", error);
      }
    }

    loadProducts();
  }, [tgId]);

  return (
    <div style={{
      paddingTop: '24px',
      paddingLeft: '16px',
      paddingRight: '16px',
      paddingBottom: '96px',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px'
    }}>
      {/* ========== HEADER ========== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            backgroundImage: 'linear-gradient(to right, #a78bfa, #22d3ee)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            Nexus Store
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#9ca3af'
          }}>
            Welcome back, Traveler
          </p>
        </div>
        <WalletConnect />
      </div>

      {/* ========== VIP BANNER ========== */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'relative',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          padding: '24px',
          boxShadow: '0 0 30px -10px rgba(168, 85, 247, 0.3)'
        }}
      >
        {/* Фоновый градиент */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'linear-gradient(135deg, rgba(126, 34, 206, 0.3) 0%, rgba(23, 23, 23, 1) 50%, rgba(23, 23, 23, 1) 100%)',
          zIndex: -1
        }} />

        <div style={{
          position: 'relative',
          zIndex: 1
        }}>
          {walletAddress ? (
            <>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '12px'
              }}>
                20% Discount Applied
              </h2>
              
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(234, 179, 8, 0.2)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#eab308'
              }}>
                <Zap size={14} style={{ fill: 'currentColor' }} />
                VIP Active
              </div>
            </>
          ) : (
            <>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '12px'
              }}>
                Connect Wallet for Perks
              </h2>
              
              <p style={{
                fontSize: '13px',
                color: '#d1d5db',
                marginBottom: '16px',
                lineHeight: '1.5'
              }}>
                Hold a Nexus NFT to unlock exclusive discounts and early access to drops.
              </p>

              <div>
                <WalletConnect />
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* ========== QUICK ACTIONS ========== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px'
      }}>
        {/* Browse Merch Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          style={{
            backgroundColor: 'rgba(23, 23, 23, 1)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(38, 38, 38, 1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(23, 23, 23, 1)';
          }}
          onClick={() => onTabChange?.('shop')}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(168, 85, 247, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c084fc'
          }}>
            <ShoppingBag size={20} />
          </div>
          <span style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#ffffff'
          }}>
            Browse Merch
          </span>
        </motion.button>

        {/* Ask AI Agent Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          style={{
            backgroundColor: 'rgba(23, 23, 23, 1)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(38, 38, 38, 1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(23, 23, 23, 1)';
          }}
          onClick={() => onTabChange?.('chat')}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(34, 211, 238, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#06b6d4'
          }}>
            <Zap size={20} />
          </div>
          <span style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#ffffff'
          }}>
            Ask AI Agent
          </span>
        </motion.button>
      </div>

      {/* ========== FEATURED DROPS ========== */}
      <div>
        {/* Section Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#ffffff'
          }}>
            Featured Drops
          </h2>
          
          <a href="#"
            style={{
              fontSize: '12px',
              color: '#c084fc',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'color 0.2s',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              e.preventDefault();
              onTabChange?.('shop');
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#d8b4fe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#c084fc';
            }}
          >
            View All
            <ChevronRight size={14} />
          </a>
        </div>

        {/* Products Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }}>
          {featuredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              {...product}
              onClick={() => selectProduct(product.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
