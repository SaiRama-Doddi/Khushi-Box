export interface Product {
  id: string
  name: string
  category: string       // category slug
  childCategory: string  // child slug (MANDATORY)
  price: number
  rating: number
  image: string
  images: string[]
  description: string
  details: {
    material?: string
    weight?: string
    size?: string
    aboutProduct?: string
  }
}

export interface ChildCategory {
  id: string
  name: string
  slug: string
}

export interface Category {
  id: string
  name: string
  slug: string
  children: ChildCategory[]
  image?: string // For UI display if needed
}

export interface CartItem extends Product {
  quantity: number
  selectedSize?: string
}

export interface Review {
  id: string
  author: string
  initials: string
  date: string
  rating: number
  content: string
  isVerified: boolean
}
