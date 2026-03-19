import { LucideIcon } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price?: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  description: string;
  details?: string | Record<string, string>;
  keyFeatures?: string[];
  inStock?: boolean;
  rating?: number;
  reviews?: number;
  sizes?: string[]; // For wearable items: S, M, L, XL, XXL
  childCategory?: string;
  actualPrice?: number;
  offerPrice?: number;
  isNew?: boolean;
  isSale?: boolean;
  createdAt?: any;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
}

export interface ChildCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  children: ChildCategory[];
  image?: string; // Optional for UI
}

export interface Review {
  id: string;
  author: string;
  initials: string;
  date: string;
  rating: number;
  content: string;
  isVerified: boolean;
}
