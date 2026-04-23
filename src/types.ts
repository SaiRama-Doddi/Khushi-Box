export interface Product {
  id: string;
  name: string;
  category: string;       // category slug
  childCategory: string;  // child slug (MANDATORY)
  price: number;
  rating: number;
  image: string;
  images: string[];
  description: string;
  sizes?: string[];       // Add this line
  details: {
    material?: string;
    weight?: string;
    size?: string;
    aboutProduct?: string;
  };
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
  image?: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}
