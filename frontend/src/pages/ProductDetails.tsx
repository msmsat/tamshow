import { ChevronLeft, ShoppingCart, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore, type Product } from '../store/useStore';

const ALL_PRODUCTS: Product[] = [
  { id: '1', image: '👕', title: 'Nexus Hoodie', price: 4999, description: 'Limited edition cyberpunk merch', category: 'merch' },
  { id: '2', image: '🎁', title: 'VIP Pass', price: 9999, description: '12-month exclusive access', category: 'subscription' },
  { id: '3', image: '🧢', title: 'Purple Cap', price: 2999, description: 'Classic snapback with logo', category: 'merch' },
  { id: '4', image: '📱', title: 'NFT Blueprint', price: 14999, description: 'Exclusive digital asset', category: 'subscription' },
  { id: '5', image: '⌚', title: 'Cyber Watch', price: 7999, description: 'Smartwatch edition', category: 'merch' },
  { id: '6', image: '🎪', title: 'Event Pass', price: 5999, description: 'Access to live events', category: 'subscription' },
];

export function ProductDetails({ productId }: { productId: string }) {
  const { isVip, addToCart, removeFromCart, isInCart, selectProduct } = useStore();
  
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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        paddingBottom: '100px'
      }}
    >
      {/* Back Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        
      }}>
        <button
          onClick={handleBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#c084fc',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 16px'
      }}>
        {/* Product Image */}
        <div style={{
          width: '100%',
          aspectRatio: '4 / 5',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '120px',
          marginBottom: '24px'
        }}>
          {product.image}
        </div>

        {/* Product Info */}
        <div>
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
            fontSize: '28px',
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
            marginBottom: '24px'
          }}>
            {oldPrice && (
              <span style={{
                fontSize: '14px',
                color: '#ef4444',
                textDecoration: 'line-through',
                opacity: 0.6
              }}>
                ${oldPrice}
              </span>
            )}
            <span style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#a855f7'
            }}>
              ${finalPrice}
            </span>
            {isVip && (
              <Star size={20} style={{ fill: '#eab308', color: '#eab308' }} />
            )}
          </div>

          {/* Full Description */}
          <div style={{
            backgroundColor: 'rgba(23, 23, 23, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#ffffff',
              marginBottom: '8px'
            }}>
              Description
            </h3>
            <p style={{
              fontSize: '13px',
              color: '#d1d5db',
              lineHeight: '1.6'
            }}>
              {product.description}
            </p>
          </div>

          {/* Web3 Block */}
          {!isVip ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <Zap size={16} style={{ color: '#eab308' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#c084fc' }}>
                  Unlock VIP Pricing
                </span>
              </div>
              <p style={{
                fontSize: '12px',
                color: '#d1d5db'
              }}>
                Mint our NFT to get this for ${Math.round(product.price * 0.8)} with 20% discount
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'center'
              }}
            >
              <p style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#22c55e'
              }}>
                ✓ VIP Discount 20% Applied
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Sticky Footer */}
      <div style={{
        position: 'fixed',
        bottom: '80px',
        left: '0',
        right: '0',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        zIndex: 40
      }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={inCart ? handleRemoveFromCart : handleAddToCart}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: inCart ? 'rgba(34, 197, 94, 0.2)' : '#a855f7',
            border: inCart ? '1px solid rgba(34, 197, 94, 0.4)' : 'none',
            borderRadius: '12px',
            color: inCart ? '#22c55e' : '#ffffff',
            fontSize: '14px',
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
          <ShoppingCart size={18} />
          {inCart ? 'Remove from Cart' : `Add to Cart - $${finalPrice}`}
        </motion.button>
      </div>
    </motion.div>
  );
}
