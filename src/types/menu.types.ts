import type {
  MenuItemVariant,
  MenuItemAddon,
} from '@/types/api/menu.api';

export type Variant = MenuItemVariant;
export type Extra = MenuItemAddon;

export interface MenuItemForm {
  name: string;
  description: string;
  price: string;
  /** Category ID (UUID) */
  category: string;
  dietaryTags: string[];
  variants: Variant[];
  extras: Extra[];
  available: boolean;
  images: string[];
}
