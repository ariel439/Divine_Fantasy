import { create } from 'zustand';
import shopsData from '../data/shops.json';
import itemsData from '../data/items.json';
import { Item } from '../types';

interface ShopItem {
  item: Item;
  quantity: number;
}

interface Shop {
  shop_id: string;
  name: string;
  location_id: string;
  currency: number; // Add currency field
  buy_multiplier: number;
  sell_multiplier: number;
  inventory: ShopItem[];
}

interface ShopState {
  shops: Record<string, Shop>;
  initialShops: Record<string, Shop>; // Store initial shop data
  loadShops: () => void;
  getShop: (shopId: string) => Shop | undefined;
  updateShopInventory: (shopId: string, newInventory: ShopItem[]) => void;
  updateShopCurrency: (shopId: string, newCurrency: number) => void;
  resetShop: (shopId: string) => void; // Add resetShop action
  resetAllShops: () => void; // Add resetAllShops action
}

const itemsMap: Record<string, Item> = {};
Object.entries(itemsData).forEach(([id, item]) => {
  itemsMap[id] = { ...item, id } as Item;
});

export const useShopStore = create<ShopState>((set, get) => ({
  shops: {},
  initialShops: {}, // Initialize initialShops
  loadShops: () => {
    const shopsMap: Record<string, Shop> = {};
    const initialShopsMap: Record<string, Shop> = {}; // Create initial shops map
    shopsData.forEach(shopData => {
      const shopInventory: ShopItem[] = shopData.inventory.map(invItem => ({
        item: itemsMap[invItem.item_id],
        quantity: invItem.quantity,
      }));

      const shop = {
        ...shopData,
        currency: shopData.currency,
        inventory: shopInventory,
      } as Shop;

      shopsMap[shopData.shop_id] = shop;
      initialShopsMap[shopData.shop_id] = JSON.parse(JSON.stringify(shop)); // Deep copy for initial state
    });
    set({ shops: shopsMap, initialShops: initialShopsMap });
  },
  getShop: (shopId) => {
    return get().shops[shopId];
  },
  updateShopInventory: (shopId, newInventory) => {
    set(state => ({
      shops: {
        ...state.shops,
        [shopId]: {
          ...state.shops[shopId],
          inventory: newInventory,
        },
      },
    }));
  },
  updateShopCurrency: (shopId, newCurrency) => {
    set(state => ({
      shops: {
        ...state.shops,
        [shopId]: {
          ...state.shops[shopId],
          currency: newCurrency,
        },
      },
    }));
  },
  resetShop: (shopId: string) => {
    set(state => {
      const initialShop = state.initialShops[shopId];
      if (initialShop) {
        return {
          shops: {
            ...state.shops,
            [shopId]: JSON.parse(JSON.stringify(initialShop)), // Reset to initial state
          },
        };
      }
      return state;
    });
  },
  resetAllShops: () => {
    set(state => {
      const resetShops: Record<string, Shop> = {};
      for (const shopId in state.initialShops) {
        resetShops[shopId] = JSON.parse(JSON.stringify(state.initialShops[shopId]));
      }
      return { shops: resetShops };
    });
  },
}));
