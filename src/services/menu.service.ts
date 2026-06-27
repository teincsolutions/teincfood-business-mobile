import { api } from './api';
import type {
  MenuItem as ApiMenuItem,
  MenuItemResponse,
  MenuItemListResponse,
  MenuCategory,
  MenuCategoryListResponse,
  MenuItemVariant as ApiMenuItemVariant,
  MenuItemAddon as ApiMenuItemAddon,
  CatalogItemRequest,
} from '@/types/api';

// ─── Re-export API types for consumers ───

export type MenuItem = ApiMenuItem;
export type Variant = ApiMenuItemVariant;
export type Extra = ApiMenuItemAddon;

// ─── Form-specific types ───

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

export function toGHS(minor: number): string {
  return (minor / 100).toFixed(2);
}

// ─── Public Menu Endpoints ───

export async function fetchBusinessMenu(businessId: string): Promise<MenuItemListResponse> {
  return api.get<MenuItemListResponse>(`/businesses/${businessId}/menu`);
}

export async function fetchBusinessMenuItems(businessId: string): Promise<MenuItemListResponse> {
  return api.get<MenuItemListResponse>(`/businesses/${businessId}/menu/items`);
}

export async function fetchCatalogItems(): Promise<MenuItemListResponse> {
  return api.get<MenuItemListResponse>('/catalog/items');
}

export async function fetchCatalogCategories(): Promise<MenuItemListResponse> {
  return api.get<MenuItemListResponse>('/catalog/categories');
}

export async function searchCatalogItems(query: string): Promise<MenuItemListResponse> {
  return api.get<MenuItemListResponse>('/catalog/items/search', { params: { q: query } });
}

export async function fetchCatalogItem(itemId: string): Promise<MenuItemResponse> {
  return api.get<MenuItemResponse>(`/catalog/items/${itemId}`);
}

// ─── Seller Menu Management ───

export async function fetchBusinessCategories(businessId: string): Promise<MenuCategoryListResponse> {
  return api.get<MenuCategoryListResponse>(`/businesses/${businessId}/menu/categories`);
}

export async function createBusinessCategory(businessId: string, data: Record<string, unknown>): Promise<{ data: MenuCategory }> {
  return api.post(`/businesses/${businessId}/menu/categories`, data);
}

export async function createBusinessMenuItem(businessId: string, data: CatalogItemRequest): Promise<MenuItemResponse> {
  return api.post<MenuItemResponse>(`/businesses/${businessId}/menu/items`, data);
}

export async function updateMenuItem(itemId: string, data: Partial<CatalogItemRequest>): Promise<MenuItemResponse> {
  return api.put<MenuItemResponse>(`/menu/items/${itemId}`, data);
}

export async function createItemVariant(itemId: string, data: Omit<ApiMenuItemVariant, 'id'>): Promise<{ data: ApiMenuItemVariant }> {
  return api.post(`/menu/items/${itemId}/variants`, data);
}

export async function deleteItemVariant(itemId: string, variantId: string): Promise<void> {
  return api.delete(`/menu/items/${itemId}/variants/${variantId}`);
}

export async function createItemAddon(itemId: string, data: Omit<ApiMenuItemAddon, 'id'>): Promise<{ data: ApiMenuItemAddon }> {
  return api.post(`/menu/items/${itemId}/addons`, data);
}

export async function deleteItemAddon(itemId: string, addonId: string): Promise<void> {
  return api.delete(`/menu/items/${itemId}/addons/${addonId}`);
}

// ─── Legacy aliases ───

export async function fetchMenuItems(): Promise<MenuItemListResponse> {
  return api.get<MenuItemListResponse>('/catalog/items');
}

export async function createMenuItem(item: CatalogItemRequest): Promise<MenuItemResponse> {
  return api.post<MenuItemResponse>('/catalog/items', item);
}

export async function deleteMenuItem(id: string): Promise<void> {
  return api.delete(`/menu/items/${id}`);
}

export async function toggleItemAvailability(id: string, available: boolean): Promise<MenuItemResponse> {
  return api.put<MenuItemResponse>(`/menu/items/${id}`, { is_available: available });
}
