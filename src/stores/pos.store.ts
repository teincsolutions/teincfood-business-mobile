import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "@/utils/storage";
import type {
  MenuItem,
  MenuItemVariantResponse,
  MenuItemAddonResponse,
} from "@/types/api/menu.api";
import type {
  POSCartItem,
  POSSelectedAddon,
  POSCheckoutForm,
  POSOrderType,
  POSPaymentMethod,
} from "@/types/pos.types";

interface POSStoreState {
  items: POSCartItem[];
  checkoutForm: POSCheckoutForm;

  addItem: (
    menuItem: MenuItem,
    quantity: number,
    variant: MenuItemVariantResponse | null,
    addons: MenuItemAddonResponse[],
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateCheckoutForm: (updates: Partial<POSCheckoutForm>) => void;
  clearCart: () => void;
  clearAll: () => void;
}

function computeUnitPrice(
  menuItem: MenuItem,
  variant: MenuItemVariantResponse | null,
  addons: MenuItemAddonResponse[],
): number {
  let price = menuItem.basePrice.amountMinor;
  if (variant) price = variant.price.amountMinor;
  for (const a of addons) price += a.amountMinor;
  return price;
}

function makeCartItemId(
  menuItemId: string,
  variantId: string | undefined,
  addonIds: string[],
): string {
  const sorted = [...addonIds].sort();
  return `${menuItemId}-${variantId || ""}-${sorted.join(",")}`;
}

const defaultCheckoutForm: POSCheckoutForm = {
  customer_name: "",
  customer_phone: "",
  order_type: "takeout",
  pos_payment_method: "cash",
};

export const usePOSStore = create<POSStoreState>()(
  persist(
    (set) => ({
      items: [],
      checkoutForm: { ...defaultCheckoutForm },

      addItem: (menuItem, quantity, variant, addons) => {
        const variantId = variant?.id;
        const addonIds = addons.map((a) => a.id);
        const cartItemId = makeCartItemId(menuItem.id, variantId, addonIds);
        const unitPrice = computeUnitPrice(menuItem, variant, addons);
        const selectedAddons: POSSelectedAddon[] = addons.map((a) => ({
          addon_id: a.id,
          name: a.name,
          price_minor: a.amountMinor,
        }));

        set((state) => {
          const existing = state.items.find((i) => i.id === cartItemId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === cartItemId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                id: cartItemId,
                menu_item: menuItem,
                quantity,
                selected_variant: variant,
                selected_addons: selectedAddons,
                notes: "",
                unit_price_minor: unitPrice,
              },
            ],
          };
        });
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== cartItemId),
        }));
      },

      updateQuantity: (cartItemId, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === cartItemId ? { ...i, quantity: Math.max(1, quantity) } : i,
          ),
        }));
      },

      updateCheckoutForm: (updates) => {
        set((state) => ({
          checkoutForm: { ...state.checkoutForm, ...updates },
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      clearAll: () => {
        set({ items: [], checkoutForm: { ...defaultCheckoutForm } });
      },
    }),
    {
      name: "Teinc Food-pos-cart",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        items: state.items,
        checkoutForm: state.checkoutForm,
      }),
    },
  ),
);
