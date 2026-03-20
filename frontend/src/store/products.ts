import type { Product } from '../store/types';

export const ALL_PRODUCTS: Product[] = [
  { id: '1', image: '/sweater.webp', title: 'Nexus Hoodie', price: 4999, description: 'Limited edition cyberpunk merch', category: 'merch' },
  { id: '2', image: '/pass.webp', title: 'VIP Pass', price: 9999, description: '12-month exclusive access', category: 'subscription' },
  { id: '3', image: '/cap.webp', title: 'Purple Cap', price: 2999, description: 'Classic snapback with logo', category: 'merch' },
  { id: '4', image: '/nft.webp', title: 'NFT Blueprint', price: 14999, description: 'Exclusive digital asset', category: 'subscription' },
  { id: '5', image: '/sneakers.webp', title: 'Cyber Sneakers', price: 7999, description: 'High-tech footwear edition', category: 'merch' },
  { id: '6', image: '/jacket.webp', title: 'Nexus Jacket', price: 5999, description: 'Premium urban collection', category: 'merch' },
];