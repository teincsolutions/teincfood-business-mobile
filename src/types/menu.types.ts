export interface MenuItemForm {
  name: string;
  description: string;
  /** Price as string input (e.g. "25.00") */
  price: string;
  /** Category ID (UUID) */
  category: string;
  dietaryTags: string[];
  variants: { id: string; name: string; price_minor: number }[];
  extras: { id: string; name: string; price_minor: number }[];
  is_available: boolean;
  image_url: string;
}
