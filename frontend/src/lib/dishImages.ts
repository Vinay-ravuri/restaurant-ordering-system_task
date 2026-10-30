/**
 * Curated Enterprise Food Photography & Page Backgrounds
 * Aligned with the reference visual direction.
 */

export const PAGE_BACKGROUNDS = {
  // Cinematic restaurant dining background with warm amber lights and gourmet food
  menuHero: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=85',
  
  // Alternative gourmet feast table
  culinaryTable: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=2000&q=85',
  
  // Ambient chef kitchen for Staff login portal
  loginBackdrop: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=2000&q=85',
  
  // Live dining sizzle for Order Tracking
  orderTrackingHero: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1800&q=85',
};

// High-resolution photography strictly matching dish types
const DISH_IMAGE_CATALOG: Record<string, string> = {
  // Starters & Appetizers
  'paneer tikka angara': 'https://images.unsplash.com/photo-1567184109191-37764e7fadd9?auto=format&fit=crop&w=800&q=80',
  'paneer tikka': 'https://images.unsplash.com/photo-1567184109191-37764e7fadd9?auto=format&fit=crop&w=800&q=80',
  'galouti kabab': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  'murgh malai tikka': 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
  'tandoori chicken': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
  'crispy corn & waterchestnut salt & pepper': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  'crispy corn': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',

  // Biryani & Rice
  'chicken biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
  'hyderabadi chicken dum biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
  'lucknowi subz dum biryani': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
  'jeera ghee pulao': 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&w=800&q=80',
  'jeera rice': 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&w=800&q=80',

  // Curries & Gravies
  'dal makhani': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
  'dal makhani bukhara': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
  'paneer butter masala': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
  'butter chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',
  'butter chicken aslam style': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',

  // Breads & Accompaniments
  'butter naan': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80',
  'butter garlic naan': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80',
  'tandoori roti': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',

  // Desserts & Drinks
  'gulab jamun': 'https://images.unsplash.com/photo-1605197148560-5a3d027733f3?auto=format&fit=crop&w=800&q=80',
  'gulab jamun flambé': 'https://images.unsplash.com/photo-1605197148560-5a3d027733f3?auto=format&fit=crop&w=800&q=80',
  'kesar pista mango lassi': 'https://images.unsplash.com/photo-1571006682858-a09e0ecd8414?auto=format&fit=crop&w=800&q=80',
  'mango lassi': 'https://images.unsplash.com/photo-1571006682858-a09e0ecd8414?auto=format&fit=crop&w=800&q=80',
};

const THEMATIC_FOOD_IMAGES: Record<string, string> = {
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
  rice: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&w=800&q=80',
  tikka: 'https://images.unsplash.com/photo-1567184109191-37764e7fadd9?auto=format&fit=crop&w=800&q=80',
  kebab: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  curry: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
  gravy: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',
  dal: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
  paneer: 'https://images.unsplash.com/photo-1567184109191-37764e7fadd9?auto=format&fit=crop&w=800&q=80',
  chicken: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
  naan: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80',
  roti: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
  bread: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80',
  dessert: 'https://images.unsplash.com/photo-1605197148560-5a3d027733f3?auto=format&fit=crop&w=800&q=80',
  sweet: 'https://images.unsplash.com/photo-1605197148560-5a3d027733f3?auto=format&fit=crop&w=800&q=80',
  drink: 'https://images.unsplash.com/photo-1571006682858-a09e0ecd8414?auto=format&fit=crop&w=800&q=80',
  starter: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
};

export function getDishImageUrl(item: { name?: string; imageUrl?: string | null; categoryName?: string }): string {
  if (item.imageUrl && item.imageUrl.trim() !== '') {
    return item.imageUrl;
  }

  const nameKey = (item.name || '').trim().toLowerCase();

  if (DISH_IMAGE_CATALOG[nameKey]) {
    return DISH_IMAGE_CATALOG[nameKey];
  }

  for (const [kw, url] of Object.entries(THEMATIC_FOOD_IMAGES)) {
    if (kw !== 'default' && nameKey.includes(kw)) {
      return url;
    }
  }

  const catKey = (item.categoryName || '').trim().toLowerCase();
  for (const [kw, url] of Object.entries(THEMATIC_FOOD_IMAGES)) {
    if (kw !== 'default' && catKey.includes(kw)) {
      return url;
    }
  }

  return THEMATIC_FOOD_IMAGES.default;
}
