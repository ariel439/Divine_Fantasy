import { create } from 'zustand';

interface Shop {
  id: string;
  name: string;
  merchantId: string;
  buyPriceModifier: number;
  sellPriceModifier: number;
  inventory: Record<string, number>; // itemId -> stock
}

interface ShopState {
  shops: Record<string, Shop>;
  // Actions
  loadShops: () => void; // Load from shops.json
  getShop: (shopId: string) => Shop | undefined;
}

export const useShopStore = create<ShopState>((set, get) => ({
  shops: {},
  loadShops: () => {
    // TODO: Load shops from shops.json
    console.log('Loading shops from JSON');
  },
  getShop: (shopId) => {
    return get().shops[shopId];
  },
}));
