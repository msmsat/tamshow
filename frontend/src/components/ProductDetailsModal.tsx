import { ShoppingCart, Star, Zap, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUserStore } from '../store/useUserStore';
import { useCartStore } from '../store/useCartStore';
import { useUIStore } from '../store/useUIStore';
import type { Product } from '../store/types';

const ALL_PRODUCTS: Product[] = [
  { id: '1', image: '/sweater.webp', title: 'Nexus Hoodie', price: 4999, description: 'Limited edition cyberpunk merch', category: 'merch' },
  { id: '2', image: '/pass.webp', title: 'VIP Pass', price: 9999, description: '12-month exclusive access', category: 'subscription' },
  { id: '3', image: '/cap.webp', title: 'Purple Cap', price: 2999, description: 'Classic snapback with logo', category: 'merch' },
  { id: '4', image: '/nft.webp', title: 'NFT Blueprint', price: 14999, description: 'Exclusive digital asset', category: 'subscription' },
  { id: '5', image: '/sneakers.webp', title: 'Cyber Sneakers', price: 7999, description: 'High-tech footwear edition', category: 'merch' },
  { id: '6', image: '/jacket.webp', title: 'Nexus Jacket', price: 5999, description: 'Premium urban collection', category: 'merch' },
];

export function ProductDetailsModal({ productId }: { productId: string }) {
  const { isVip } = useUserStore();
  const { addToCart, removeFromCart, isInCart } = useCartStore();
  const { selectProduct } = useUIStore();
  
  const product = ALL_PRODUCTS.find(p => p.id === productId);
  
  if (!product) {
    return (
      <div style={{ color: '#9ca3af', padding: '20px', textAlign: 'center' }}>
        Product not found
      </div>
    );
  }

  const finalPrice = isVip ? Math.round(product.price * 0.8) : product.price;
  const oldPrice = isVip ? product.price : null;
  const inCart = isInCart(productId);

  const handleAddToCart = () => {
    addToCart({ ...product, price: finalPrice });
  };

  const handleBack = () => {
    selectProduct(null);
  };

  const handleRemoveFromCart = () => {
    removeFromCart(productId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
      animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
      exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        width: '90%',
        maxWidth: '900px',
        height: 'min(90vh, 800px)',
        backgroundColor: 'rgba(10, 10, 10, 1)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '20px',
        overflow: 'hidden',
        zIndex: 100,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr auto',
        boxShadow: '0 20px 60px rgba(168, 85, 247, 0.2)'
      }}
    >
      {/* Close Button (X) */}
      <button
        onClick={handleBack}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'none',
          border: 'none',
          color: '#c084fc',
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 101,
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#e9d5ff'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#c084fc'}
      >
        <X size={24} />
      </button>
      {/* Left: Product Image */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(23, 23, 23, 0.4)',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'relative',
        gridRow: '1 / -1'
      }}>
        {/* Image Container */}
        <div style={{
          width: '100%',
          aspectRatio: '1',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '80px',
          overflow: 'hidden'
        }}>
          {product.image.startsWith('/') || product.image.startsWith('http') ? (
            <img 
              src={product.image} 
              alt={product.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            product.image
          )}
        </div>
      </div>

      {/* Right: Product Info (Scrollable) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        padding: '20px'
      }}>
        {/* Content */}
        <div style={{
          flex: 1
        }}>
          {/* Category Badge */}
          <div style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '6px',
            marginBottom: '12px',
            backgroundColor: product.category === 'merch' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)',
            color: product.category === 'merch' ? '#60a5fa' : '#c084fc'
          }}>
            {product.category === 'merch' ? 'Merchandise' : 'Subscription'}
          </div>

          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '12px'
          }}>
            {product.title}
          </h1>

          {/* Price */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            {oldPrice && (
              <span style={{
                fontSize: '13px',
                color: '#ef4444',
                textDecoration: 'line-through',
                opacity: 0.6
              }}>
                ${oldPrice}
              </span>
            )}
            <span style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#a855f7'
            }}>
              ${finalPrice}
            </span>
            {isVip && (
              <Star size={18} style={{ fill: '#eab308', color: '#eab308' }} />
            )}
          </div>

          {/* Description */}
          <p style={{
            fontSize: '13px',
            color: '#d1d5db',
            lineHeight: '1.5',
            marginBottom: '16px'
          }}>
            {product.description}
          </p>

          {/* Web3 Block */}
          {!isVip ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '12px'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px'
              }}>
                <Zap size={14} style={{ color: '#eab308' }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#c084fc' }}>
                  Unlock VIP Pricing
                </span>
              </div>
              <p style={{
                fontSize: '11px',
                color: '#d1d5db'
              }}>
                Mint to save ${Math.round(product.price * 0.2)}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '12px',
                textAlign: 'center'
              }}
            >
              <p style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#22c55e'
              }}>
                ✓ VIP 20% Applied
              </p>
            </motion.div>
          )}
        </div>

        {/* Action Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={inCart ? handleRemoveFromCart : handleAddToCart}
          style={{
            marginTop: '12px',
            width: '100%',
            padding: '12px',
            backgroundColor: inCart ? 'rgba(34, 197, 94, 0.2)' : '#a855f7',
            border: inCart ? '1px solid rgba(34, 197, 94, 0.4)' : 'none',
            borderRadius: '10px',
            color: inCart ? '#22c55e' : '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: !inCart ? '0 0 20px -5px #a855f7' : 'none'
          }}
          onMouseEnter={(e) => {
            if (!inCart) {
              e.currentTarget.style.backgroundColor = '#b563ff';
            }
          }}
          onMouseLeave={(e) => {
            if (!inCart) {
              e.currentTarget.style.backgroundColor = '#a855f7';
            }
          }}
        >
          <ShoppingCart size={16} />
          {inCart ? 'Remove' : `Add - $${finalPrice}`}
        </motion.button>
      </div>
    </motion.div>
  );
}
