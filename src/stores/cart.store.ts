import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "@/utils/storage";
import type { FoodItem as Food, FoodAddon } from "@/types/food.model";

export interface CartItem {
  cartItemId: string; // Unique id combining foodId, size, and addons e.g., 'f1-14inch-addon1-addon2'
  food: Food;
  quantity: number;
  size?: string;
  selectedAddons: FoodAddon[];
  price: number; // Base price + size modifiers + addon prices
}

interface CartState {
  items: CartItem[];
  deliveryFee: number;
  taxRate: number; // e.g., 0.05 for 5%
  tipAmount: number;
  promoDiscount: number;

  // Actions
  addItem: (
    food: Food,
    quantity: number,
    size?: string,
    unitPrice?: number,
    selectedAddons?: FoodAddon[],
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  setTip: (amount: number) => void;
  setPromoDiscount: (amount: number) => void;
  clearCart: () => void;

  // Computed Methods (can also be derived in components, but convenient here)
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryFee: 5.0, // Fixed mock delivery fee
      taxRate: 0.05, // 5% tax mockup
      tipAmount: 0,
      promoDiscount: 0,

      addItem: (food, quantity, size, unitPrice, selectedAddons = []) => {
        set((state) => {
          // Generate unique cart ID based on food, size, and selected addons
          const addonIds = selectedAddons
            .map((a) => a.id)
            .sort()
            .join("-");
          const cartItemId = [food.id, size || "default", addonIds]
            .filter(Boolean)
            .join("-");

          const existingItemIndex = state.items.findIndex(
            (item) => item.cartItemId === cartItemId,
          );

          if (existingItemIndex >= 0) {
            // Update quantity of existing item
            const newItems = [...state.items];
            newItems[existingItemIndex].quantity += quantity;
            return { items: newItems };
          } else {
            // Calculate total price including addons
            const addonsTotal = selectedAddons.reduce(
              (sum, addon) => sum + addon.price,
              0,
            );
            const finalPrice = (unitPrice ?? food.price) + addonsTotal;

            // Push new item with selected variant price + addon prices
            return {
              items: [
                ...state.items,
                {
                  cartItemId,
                  food,
                  quantity,
                  size,
                  selectedAddons,
                  price: finalPrice,
                },
              ],
            };
          }
        });
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.cartItemId !== cartItemId),
        }));
      },

      updateQuantity: (cartItemId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (item) => item.cartItemId !== cartItemId,
              ),
            };
          }
          return {
            items: state.items.map((item) =>
              item.cartItemId === cartItemId ? { ...item, quantity } : item,
            ),
          };
        });
      },

      setTip: (amount) => set({ tipAmount: amount }),
      setPromoDiscount: (amount) => set({ promoDiscount: amount }),

      clearCart: () => set({ items: [], tipAmount: 0, promoDiscount: 0 }),

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        );
      },

      getTax: () => {
        return get().getSubtotal() * get().taxRate;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        return Math.max(
          0,
          subtotal +
            get().getTax() +
            get().deliveryFee +
            get().tipAmount -
            get().promoDiscount,
        );
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: "TeincFood Business-cart",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
