import type { FoodAddon, FoodCategory } from '@/models/food.model';

// ─── Food Categories ───
export const MOCK_CATEGORIES: FoodCategory[] = [
  'all', 'pizza', 'burger', 'sandwich', 'biryani', 'desserts', 'drinks', 'salads', 'pasta',
];

// ─── Food Addons ───
export const MOCK_ADDONS: FoodAddon[] = [
  { id: 'addon-1', name: 'Extra Cheese', price: 2.50 },
  { id: 'addon-2', name: 'Mushroom', price: 1.50 },
  { id: 'addon-3', name: 'Bacon', price: 3.00 },
  { id: 'addon-4', name: 'Jalapeño', price: 1.00 },
  { id: 'addon-5', name: 'Avocado', price: 2.00 },
];

// ─── Helper Functions ───
export function getAddonById(id: string): FoodAddon | undefined {
  return MOCK_ADDONS.find(addon => addon.id === id);
}

export function getAddonsByIds(ids: string[]): FoodAddon[] {
  return MOCK_ADDONS.filter(addon => ids.includes(addon.id));
}

export function getCategoryBySlug(slug: string): FoodCategory | undefined {
  return MOCK_CATEGORIES.find(cat => cat === slug);
}