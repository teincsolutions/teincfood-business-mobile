import type { FoodCategory, FoodAddon } from '@/models/food.model';
import { formatPrice, DEFAULT_CURRENCY } from '@/utils/currency';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Variant {
  id: string;
  label: string;
  priceMinor: number;
}

export interface Extra {
  id: string;
  label: string;
  priceMinor: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  priceMinor: number; // in pesewas
  category: string;
  available: boolean;
  dietaryTags: string[];
  variants: Variant[];
  extras: Extra[];
  images: string[];
}

export interface MenuItemForm {
  name: string;
  description: string;
  price: string;
  category: string;
  dietaryTags: string[];
  variants: Variant[];
  extras: Extra[];
  available: boolean;
  images: string[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const MENU_CATEGORIES = ['All', 'Main', 'Snacks', 'Protein', 'Drinks', 'Desserts'];

export const DIETARY_TAGS = ['Vegetarian', 'Vegan', 'Gluten-free', 'Halal'];

export const EMPTY_FORM: MenuItemForm = {
  name: '',
  description: '',
  price: '',
  category: 'Main',
  dietaryTags: [],
  variants: [],
  extras: [],
  available: true,
  images: [],
};

// ─── Mock Data ───────────────────────────────────────────────────────────────

let menuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Jollof Rice',
    description: 'Classic West African jollof rice served with stew',
    priceMinor: 2500,
    category: 'Main',
    available: true,
    dietaryTags: ['Halal'],
    variants: [
      { id: 'v1a', label: 'Small', priceMinor: 2000 },
      { id: 'v1b', label: 'Large', priceMinor: 3500 },
    ],
    extras: [{ id: 'e1a', label: 'Extra Stew', priceMinor: 500 }],
    images: ['https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400'],
  },
  {
    id: '2',
    name: 'Banku & Tilapia',
    description: 'Fermented corn dough with grilled whole tilapia',
    priceMinor: 4500,
    category: 'Main',
    available: true,
    dietaryTags: ['Halal', 'Gluten-free'],
    variants: [],
    extras: [{ id: 'e2a', label: 'Extra Pepper', priceMinor: 200 }],
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'],
  },
  {
    id: '3',
    name: 'Waakye',
    description: 'Rice & beans cooked with sorghum leaves',
    priceMinor: 2000,
    category: 'Main',
    available: false,
    dietaryTags: ['Vegetarian', 'Halal'],
    variants: [],
    extras: [],
    images: ['https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400'],
  },
  {
    id: '4',
    name: 'Kelewele',
    description: 'Spiced fried plantain cubes',
    priceMinor: 1000,
    category: 'Snacks',
    available: true,
    dietaryTags: ['Vegan', 'Gluten-free'],
    variants: [],
    extras: [],
    images: ['https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400'],
  },
  {
    id: '5',
    name: 'Grilled Chicken',
    description: 'Whole grilled chicken with marinade',
    priceMinor: 3500,
    category: 'Protein',
    available: true,
    dietaryTags: ['Halal', 'Gluten-free'],
    variants: [
      { id: 'v5a', label: 'Half', priceMinor: 2000 },
      { id: 'v5b', label: 'Full', priceMinor: 3500 },
    ],
    extras: [{ id: 'e5a', label: 'Extra Sauce', priceMinor: 300 }],
    images: ['https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400'],
  },
];

// ─── Utility Functions ───────────────────────────────────────────────────────

export function toMinor(ghsStr: string): number {
  const n = parseFloat(ghsStr);
  return isNaN(n) ? 0 : Math.round(n * 100);
}

// ─── Mock API Functions ──────────────────────────────────────────────────────

const SIMULATED_DELAY = 300;

export async function fetchMenuItems(): Promise<MenuItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...menuItems]), SIMULATED_DELAY);
  });
}

export async function createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newItem: MenuItem = {
        ...item,
        id: Date.now().toString(),
      };
      menuItems = [newItem, ...menuItems];
      resolve(newItem);
    }, SIMULATED_DELAY);
  });
}

export async function updateMenuItem(
  id: string,
  updates: Partial<MenuItem>
): Promise<MenuItem> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = menuItems.findIndex((i) => i.id === id);
      if (index !== -1) {
        menuItems[index] = { ...menuItems[index], ...updates };
        resolve(menuItems[index]);
      } else {
        resolve(menuItems[0]);
      }
    }, SIMULATED_DELAY);
  });
}

export async function deleteMenuItem(id: string): Promise<{ success: boolean }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      menuItems = menuItems.filter((item) => item.id !== id);
      resolve({ success: true });
    }, SIMULATED_DELAY);
  });
}

export async function toggleItemAvailability(
  id: string,
  available: boolean
): Promise<MenuItem> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = menuItems.findIndex((i) => i.id === id);
      if (index !== -1) {
        menuItems[index] = { ...menuItems[index], available };
        resolve(menuItems[index]);
      } else {
        resolve(menuItems[0]);
      }
    }, SIMULATED_DELAY);
  });
}
