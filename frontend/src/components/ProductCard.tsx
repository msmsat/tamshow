import { Plus, Check, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUserStore } from '../store/useUserStore';
import { useCartStore } from '../store/useCartStore';
import type { Product } from '../store/types';
import { useState } from 'react'; // 🔥 Добавили это

interface ProductCardProps extends Product {
  onClick?: () => void;
}

export function ProductCard({ id, image, title, price, description, category, onClick }: ProductCardProps) {
  console.log(`[CARD] 🧱 React начал строить карточку: ${title}`);
  const { isVip } = useUserStore();
  const { addToCart, removeFromCart, isInCart } = useCartStore();
  const inCart = isInCart(id);
  const [isImgLoaded, setIsImgLoaded] = useState(false); // 🔥 Добавили состояние загрузки
  
  // Расчет финальной цены с VIP скидкой
  const finalPrice = isVip ? Math.round(price * 0.8) : price;
  const oldPrice = isVip ? price : null;

  const handleCardClick = () => {
    onClick?.();
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    inCart ? removeFromCart(id) : addToCart({ id, image, title, price: finalPrice, description, category });
  };
  return (
    <motion.div
      onClick={handleCardClick}
      style={{
        flex: 1,
        display: 'flex',              // 🔥 Выравнивание высоты
        flexDirection: 'column',      // 🔥 Выравнивание высоты
        height: '100%',               // 🔥 Выравнивание высоты
        width: '100%',                // 🔥 Выравнивание высоты
        backgroundColor: 'rgba(23, 23, 23, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        
        // 🔥 1. ИСПРАВЛЕНИЕ КОНФЛИКТА: Анимируем только цвета, а не "all"
        transition: 'background-color 0.2s, border-color 0.2s',
        
        // 🔥 2. ИСПРАВЛЕНИЕ APPLE SAFARI: Изоляция и маска (БЕЗ translate3d!)
        isolation: 'isolate',
        WebkitMaskImage: '-webkit-radial-gradient(white, black)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(23, 23, 23, 1)';
        e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(23, 23, 23, 0.8)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
      }}
    >
      {/* Изображение */}
      <div style={{
        width: '100%',
        aspectRatio: '1',
        backgroundColor: 'rgba(168, 85, 247, 0.05)', // Сделали фон чуть темнее
        position: 'relative', // 🔥 Обязательно для скелетона
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '48px',
        color: '#a855f7',
        overflow: 'hidden'
      }}>
        
        {/* 🔥 СКЕЛЕТОН-ЛОАДЕР: Пульсирует, пока картинка не скачалась */}
        {!isImgLoaded && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            animation: 'pulse 1.5s infinite' // Используем твою анимацию из index.css
          }} />
        )}

        {image.startsWith('/') || image.startsWith('http') ? (
          <img 
            src={image} 
            alt={title}
            onLoad={() => {
              // 🔥 ЛОГ 2: Браузер физически скачал картинку из интернета (или достал из кэша)
              console.log(`[CARD] 🖼️ Картинка ПОЛНОСТЬЮ ЗАГРУЖЕНА: ${title}`);
              setIsImgLoaded(true);
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'relative', // 🔥 Чтобы картинка легла поверх скелетона
              zIndex: 1,
              opacity: isImgLoaded ? 1 : 0, 
              transition: 'opacity 0.4s ease-in-out' // Плавное появление после скачивания
            }}
          />
        ) : (
          <span style={{ position: 'relative', zIndex: 1 }}>{image}</span>
        )}
      </div>

      {/* Информация */}
      {/* 🔥 Заменили height: '100%' на flex: 1, чтобы блок выталкивал цену всегда в самый низ */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ marginBottom: 'auto' }}>
          {/* Категория бейдж */}
          {category && (
            <div style={{
              display: 'inline-block',
              fontSize: '10px',
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: '4px',
              marginBottom: '8px',
              backgroundColor: category === 'merch' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)',
              color: category === 'merch' ? '#60a5fa' : '#c084fc'
            }}>
              {category === 'merch' ? 'Merch' : 'Subscription'}
            </div>
          )}

          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#ffffff',
            marginBottom: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {title}
          </h3>
          
          <p style={{
            fontSize: '11px',
            color: '#9ca3af',
            marginBottom: '8px',
            lineHeight: '1.3',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {description}
          </p>
        </div>

        {/* Цена и кнопка */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {oldPrice && (
              <span style={{
                fontSize: '11px',
                color: '#ef4444',
                textDecoration: 'line-through',
                opacity: 0.6
              }}>
                ${oldPrice}
              </span>
            )}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#a855f7'
              }}>
                ${finalPrice}
              </span>
              {isVip && (
                <Star size={12} style={{ fill: '#eab308', color: '#eab308' }} />
              )}
            </div>
          </div>
          
          <button 
            onClick={handleQuickAdd}
            style={{
              backgroundColor: inCart ? 'rgba(34, 197, 94, 0.2)' : 'rgba(168, 85, 247, 0.2)',
              border: inCart ? '1px solid rgba(34, 197, 94, 0.4)' : 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              padding: '0',
              cursor: 'pointer',
              color: inCart ? '#22c55e' : '#c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = inCart 
                ? 'rgba(34, 197, 94, 0.3)' 
                : 'rgba(168, 85, 247, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = inCart 
                ? 'rgba(34, 197, 94, 0.2)' 
                : 'rgba(168, 85, 247, 0.2)';
            }}
          >
            {inCart ? <Check size={16} /> : <Plus size={16} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
