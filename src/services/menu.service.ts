import type { FoodCategory, FoodAddon } from '@/models/food.model';

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
};

// ─── Mock Data ───────────────────────────────────────────────────────────────

export const INITIAL_ITEMS: MenuItem[] = [
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
  },
];

// ─── Utility Functions ───────────────────────────────────────────────────────

export function toGHS(minor: number): string {
  return (minor / 100).toFixed(2);
}

export function toMinor(ghsStr: string): number {
  const n = parseFloat(ghsStr);
  return isNaN(n) ? 0 : Math.round(n * 100);
}

// ─── Mock API Functions ──────────────────────────────────────────────────────

const SIMULATED_DELAY = 300;

export async function fetchMenuItems(): Promise<MenuItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...INITIAL_ITEMS]), SIMULATED_DELAY);
  });
}

export async function createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newItem: MenuItem = {
        ...item,
        id: Date.now().toString(),
      };
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
      const existing = INITIAL_ITEMS.find((i) => i.id === id) || INITIAL_ITEMS[0];
      resolve({ ...existing, ...updates, id });
    }, SIMULATED_DELAY);
  });
}

export async function deleteMenuItem(id: string): Promise<{ success: boolean }> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), SIMULATED_DELAY);
  });
}

export async function toggleItemAvailability(
  id: string,
  available: boolean
): Promise<MenuItem> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const existing = INITIAL_ITEMS.find((i) => i.id === id) || INITIAL_ITEMS[0];
      resolve({ ...existing, available });
    }, SIMULATED_DELAY);
  });
}