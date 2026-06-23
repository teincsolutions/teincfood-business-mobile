import type { PaginationMeta } from './pagination';

// ─── Menu Item ───

export interface MenuItemVariant {
  id: string;
  label: string;
  price_minor: number;
}

export interface MenuItemAddon {
  id: string;
  label: string;
  price_minor: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_minor: number;
  category: string;
  is_available: boolean;
  dietary_tags: string[];
  variants: MenuItemVariant[];
  addons: MenuItemAddon[];
  image_url: string | null;
  business_id: string;
  inserted_at: string;
  updated_at: string;
}

export interface MenuItemResponse {
  data: MenuItem;
}

export interface MenuItemListResponse {
  data: MenuItem[];
  pagination: PaginationMeta;
}

export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
}

export interface MenuCategoryListResponse {
  data: MenuCategory[];
}

export interface CatalogItemRequest {
  name: string;
  description: string;
  price_minor: number;
  category: string;
  dietary_tags: string[];
  variants: Omit<MenuItemVariant, 'id'>[];
  addons: Omit<MenuItemAddon, 'id'>[];
  is_available: boolean;
  image_url: string | null;
}
