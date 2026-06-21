import { api } from './api';

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
  priceMinor: number;
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

export function toMinor(ghsStr: string): number {
  const n = parseFloat(ghsStr);
  return isNaN(n) ? 0 : Math.round(n * 100);
}

// ─── Public Menu Endpoints ───

export async function fetchBusinessMenu(businessId: string): Promise<any> {
  return api.get(`/businesses/${businessId}/menu`);
}

export async function fetchBusinessMenuItems(businessId: string): Promise<any> {
  return api.get(`/businesses/${businessId}/menu/items`);
}

export async function fetchCatalogItems(): Promise<any> {
  return api.get('/catalog/items');
}

export async function fetchCatalogCategories(): Promise<any> {
  return api.get('/catalog/categories');
}

export async function searchCatalogItems(query: string): Promise<any> {
  return api.get('/catalog/items/search', { params: { q: query } });
}

export async function fetchCatalogItem(itemId: string): Promise<any> {
  return api.get(`/catalog/items/${itemId}`);
}

// ─── Seller Menu Management ───

export async function fetchBusinessCategories(businessId: string): Promise<any> {
  return api.get(`/businesses/${businessId}/menu/categories`);
}

export async function createBusinessCategory(businessId: string, data: any): Promise<any> {
  return api.post(`/businesses/${businessId}/menu/categories`, data);
}

export async function createBusinessMenuItem(businessId: string, data: any): Promise<any> {
  return api.post(`/businesses/${businessId}/menu/items`, data);
}

export async function updateMenuItem(itemId: string, data: any): Promise<any> {
  return api.put(`/menu/items/${itemId}`, data);
}

export async function createItemVariant(itemId: string, data: any): Promise<any> {
  return api.post(`/menu/items/${itemId}/variants`, data);
}

export async function deleteItemVariant(itemId: string, variantId: string): Promise<any> {
  return api.delete(`/menu/items/${itemId}/variants/${variantId}`);
}

export async function createItemAddon(itemId: string, data: any): Promise<any> {
  return api.post(`/menu/items/${itemId}/addons`, data);
}

export async function deleteItemAddon(itemId: string, addonId: string): Promise<any> {
  return api.delete(`/menu/items/${itemId}/addons/${addonId}`);
}

// ─── Legacy aliases ───

export async function fetchMenuItems(): Promise<any> {
  return api.get('/catalog/items');
}

export async function createMenuItem(item: any): Promise<any> {
  return api.post('/catalog/items', item);
}

export async function deleteMenuItem(id: string): Promise<any> {
  return api.delete(`/menu/items/${id}`);
}

export async function toggleItemAvailability(id: string, available: boolean): Promise<any> {
  return api.put(`/menu/items/${id}`, { is_available: available });
}
