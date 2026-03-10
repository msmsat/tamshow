import { ShoppingBag, Minus, Trash2, Plus, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../store/useUserStore';
import { useCartStore } from '../store/useCartStore';

export function Cart() {
  const { isVip } = useUserStore();
  const { cart, removeFromCart, updateQuantity: updateCartQuantity } = useCartStore();

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
  const discount = isVip ? Math.round(subtotal * 0.2) : 0;

  // Empty State - Data Void
  if (cart.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        padding: '20px',
        textAlign: 'center'
      }}>
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
          Data Void Detected
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
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.15)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Explore Databanks
        </motion.button>
      </div>
    );
  }

  // Filled State - Active Loadout
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      paddingTop: '24px',
      paddingLeft: '16px',
      paddingRight: '16px',
      paddingBottom: '180px'
    }}>
      {/* Header with Inventory Title */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '32px'
      }}>
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
        <AnimatePresence mode="popLayout">
          {cart.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -50, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: -50, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                backgroundColor: 'rgba(23, 23, 23, 0.6)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                marginBottom: '12px'
              }}
            >
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
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
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
                
                <p style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  marginBottom: '8px'
                }}>
                  Type: {item.category}
                </p>

                {/* Price Display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isVip && (
                    <span style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                      textDecoration: 'line-through'
                    }}>
                      ${item.price}
                    </span>
                  )}
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#a855f7'
                  }}>
                    ${isVip ? Math.round(item.price * 0.8) : item.price}
                  </span>
                </div>
              </div>

              {/* Quantity Adjuster - Glass Capsule */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                paddingLeft: '8px',
                paddingRight: '8px',
                paddingTop: '6px',
                paddingBottom: '6px',
                flexShrink: 0
              }}>
                <button
                  onClick={() => handleQuantityChange(item.id, -1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: item.quantity === 1 ? '#ef4444' : '#9ca3af',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = item.quantity === 1 ? '#ff6b6b' : '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = item.quantity === 1 ? '#ef4444' : '#9ca3af';
                  }}
                >
                  {item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                </button>

                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#ffffff',
                  minWidth: '16px',
                  textAlign: 'center'
                }}>
                  {item.quantity}
                </span>

                <button
                  onClick={() => handleQuantityChange(item.id, 1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#9ca3af';
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Zone B: Smart Contract Status */}
      {isVip ? (
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
            gap: '12px'
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
              <motion.button
                whileTap={{ scale: 0.95 }}
                style={{
                  background: 'none',
                  border: '1px solid rgba(217, 119, 6, 0.5)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: '#fbbf24',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Connect Wallet
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Sticky Checkout Footer Component
export function CheckoutFooter() {
  const { isVip } = useUserStore();
  const { cart } = useCartStore();

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = isVip ? Math.round(subtotal * 0.2) : 0;
  const networkFee = Math.round(subtotal * 0.05);
  const total = subtotal - discount + networkFee;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '0',
        right: '0',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '20px',
        paddingBottom: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderTop: '1px solid rgba(168, 85, 247, 0.3)',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        zIndex: 40
      }}
    >
      {/* Checkout Tape - Order Summary */}
      <div style={{
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Subtotal */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
          <span style={{ color: '#9ca3af' }}>Subtotal</span>
          <span style={{ color: '#d1d5db', fontWeight: 600 }}>${subtotal}</span>
        </div>

        {/* Network Fee */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
          <span style={{ color: '#9ca3af' }}>Network Fee</span>
          <span style={{ color: '#d1d5db', fontWeight: 600 }}>${networkFee}</span>
        </div>

        {/* VIP Discount */}
        {discount > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}>
            <span style={{ color: '#22c55e' }}>VIP Discount</span>
            <span style={{ color: '#22c55e', fontWeight: 600 }}>-${discount}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{
        height: '1px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: '12px'
      }} />

      {/* Total */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <span style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '0.5px'
        }}>
          TOTAL
        </span>
        <span style={{
          fontSize: '28px',
          fontWeight: 'black',
          backgroundImage: 'linear-gradient(to right, #a855f7, #06b6d4)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          ${total}
        </span>
      </div>

      {/* Checkout Button - Initialize Checkout */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        style={{
          width: '100%',
          height: '56px',
          backgroundImage: 'linear-gradient(to right, rgba(168, 85, 247, 0.9), rgba(59, 130, 246, 0.9))',
          border: 'none',
          borderRadius: '12px',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          transition: 'all 0.3s ease',
          letterSpacing: '0.5px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 0 40px rgba(168, 85, 247, 0.6)';
          e.currentTarget.style.backgroundImage = 'linear-gradient(to right, rgba(168, 85, 247, 1), rgba(59, 130, 246, 1))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.4)';
          e.currentTarget.style.backgroundImage = 'linear-gradient(to right, rgba(168, 85, 247, 0.9), rgba(59, 130, 246, 0.9))';
        }}
      >
        <span>Initialize Checkout</span>
        <motion.div
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowRight size={16} />
        </motion.div>
      </motion.button>
    </motion.div>
  );
}
