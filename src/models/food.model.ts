export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  category: FoodCategory;
  chefId: string;
  chefName: string;
  chefAvatarUrl?: string;
  rating: number;
  reviewCount: number;
  preparationTime: string; // e.g. "30 min"
  isAvailable: boolean;
  ingredients?: string[];
  addons?: FoodAddon[];
  sizeOptions?: FoodSizeOption[];
  createdAt: string;
}

export interface FoodSizeOption {
  id: string;
  label: string;
  price: number;
  currency: string;
}

export interface FoodAddon {
  id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl?: string;
}

export type FoodCategory =
  | 'all'
  | 'pizza'
  | 'burger'
  | 'sandwich'
  | 'biryani'
  | 'desserts'
  | 'drinks'
  | 'salads'
  | 'pasta';

export interface FoodFilter {
  category?: FoodCategory;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sortBy?: 'popular' | 'newest' | 'price_low' | 'price_high';
  searchQuery?: string;
}
