import { Search, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { useStore, type Product } from '../store/useStore';

const ALL_PRODUCTS: Product[] = [
  { id: '1', image: '👕', title: 'Nexus Hoodie', price: 4999, description: 'Limited edition cyberpunk merch', category: 'merch' },
  { id: '2', image: '🎁', title: 'VIP Pass', price: 9999, description: '12-month exclusive access', category: 'subscription' },
  { id: '3', image: '🧢', title: 'Purple Cap', price: 2999, description: 'Classic snapback with logo', category: 'merch' },
  { id: '4', image: '📱', title: 'NFT Blueprint', price: 14999, description: 'Exclusive digital asset', category: 'subscription' },
  { id: '5', image: '⌚', title: 'Cyber Watch', price: 7999, description: 'Smartwatch edition', category: 'merch' },
  { id: '6', image: '🎪', title: 'Event Pass', price: 5999, description: 'Access to live events', category: 'subscription' },
];

type FilterType = 'all' | 'merch' | 'subscription';

export function Shop() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const { isVip, selectProduct } = useStore();

  // Фильтрация товаров
  const filteredProducts = ALL_PRODUCTS.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || product.category === filter;
    return matchesSearch && matchesFilter;
  });

  const categories: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Merch', value: 'merch' },
    { label: 'Subscriptions', value: 'subscription' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      paddingTop: '24px',
      paddingLeft: '16px',
      paddingRight: '16px',
      paddingBottom: '96px'
    }}>
      {/* Заголовок */}
      <h1 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#ffffff'
      }}>
        Catalog
      </h1>

      {/* Поисковая строка */}
      <div style={{
        position: 'relative'
      }}>
        <Search size={16} style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#6b7280',
          pointerEvents: 'none'
        }} />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: 'rgba(23, 23, 23, 1)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '10px 12px 10px 36px',
            fontSize: '14px',
            color: '#ffffff',
            outline: 'none',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
        />
      </div>

      {/* Фильтры (категории) */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflow: 'hidden',
        overflowX: 'auto',
        paddingBottom: '4px',
        scrollBehavior: 'smooth'
      }}>
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            style={{
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '9999px',
              border: filter === cat.value ? 'none' : `1px solid rgba(255, 255, 255, 0.1)`,
              backgroundColor: filter === cat.value ? '#a855f7' : 'rgba(23, 23, 23, 1)',
              color: filter === cat.value ? '#ffffff' : '#9ca3af',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (filter !== cat.value) {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== cat.value) {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Статус VIP */}
      {isVip && (
        <div style={{
          backgroundColor: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '13px',
          color: '#eab308'
        }}>
          ⭐ VIP Active: 20% discount applied to all prices
        </div>
      )}

      {/* Сетка товаров */}
      {filteredProducts.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }}>
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              {...product}
              onClick={() => selectProduct(product.id)}
            />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          color: '#6b7280',
          paddingTop: '40px'
        }}>
          <p>No products found</p>
        </div>
      )}
    </div>
  );
}
