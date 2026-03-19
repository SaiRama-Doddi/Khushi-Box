import { Product, Review, Category } from "./types";

export const CATEGORIES: Category[] = [
  {
    id: "5",
    name: "Personalised Gifts",
    slug: "personalised-gifts",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9ZDUoYg5Ce-s06T1krOVEPlXlKyjassnD-v9loxBd56zFEHN-ENoC_xv6hCF0pm5EtUmLAfqMHsbPHdE8VZHLwf8afASzjAksIOk5fRGeB-4aBXpDSDZs47jazMjM-Ut9ERGwoGjL-zpIaxAie_MwvigMXBFBbXeKvvfyr6WyIXjX5XEm6-6LyMR-WYpygCZDqyRjxmdbgYpO4WiewqLVveGXvZhLdm_XnM36BItq22w2Af3wAVbI-CF0Qu72qVEiFyiMOfYqmXE",
    children: [
      { id: "5-1", name: "Mugs", slug: "mugs" },
      { id: "5-2", name: "Waterbottles & Sippers", slug: "waterbottles-sippers" },
      { id: "5-3", name: "Photoframes", slug: "photoframes" },
      { id: "5-4", name: "Clocks", slug: "clocks" },
      { id: "5-5", name: "LED Photoframes", slug: "led-photoframes" },
      { id: "5-6", name: "LED Rotating Photoframes", slug: "led-rotating-photoframes" },
      { id: "5-7", name: "Key Chains ( Metal / Polymer )", slug: "key-chains" },
      { id: "5-8", name: "Cushions", slug: "cushions" },
      { id: "5-9", name: "Sash Roll", slug: "sash-roll" },
      { id: "5-10", name: "Mouse Pad", slug: "mouse-pad" },
    ],
  },
  {
    id: "6",
    name: "Wearables",
    slug: "wearables",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCGhxyCbVoDGAVA40IuylZRsiPluHljNMAWp1U0CiEog4sZy3d4xMvuJnRO51wsJfc4rvistJGjqSyIiLfE_AUgUJ4dvzUc3-5PhmDwwCTcjzo8Y2HC0X0YhWoPzXR6OIwTbpDUN8x-3ODX4pTmejiELYc9JFVjucv1vzYFsGsbnvMFhk56uClRwDZ7P4K697JoNQVQjRefnnGp0thuPgD7CPvf1vmmDMawEsSSrXUA5a7oMED890NdE1QVZH_AnfzS1GZ_Id20ei4",
    children: [
      { id: "6-1", name: "T-Shirts", slug: "t-shirts" },
      { id: "6-2", name: "Oversized T Shirts", slug: "oversized-t-shirts" },
      { id: "6-3", name: "Hoodies", slug: "hoodies" },
      { id: "6-4", name: "SweatShirts", slug: "sweatshirts" },
      { id: "6-5", name: "Collar Zipper", slug: "collar-zipper" },
      { id: "6-6", name: "Track Suits", slug: "track-suits" },
      { id: "6-7", name: "Caps", slug: "caps" },
    ],
  },
  {
    id: "7",
    name: "Magnets",
    slug: "magnets",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB7gyU5osPNRbOxQYt9KESZxNYx9F1Wv8yTesv7DrJidByw3u8UKY-7B8o6yh4jX6pbN8Zyf9xDuwv2PadVvWkwMNwGB5h-Wc5hyIbphEf4kUt_mh3gga0GOJgXFDaDQrju8uVYfpeRdyT-X1PP_PdTQUDgSTqRZGLOpXGpafhvnsqqhrPIwh0E7pEqA2Ha2ls7IcFE64pKdvKUz1Kkcpt4Cy29Y88DtwgBXXu_GqFmGY0IIe8x_TexvXKL3MiTx03sZLts2gdJTLQ",
    children: [
      { id: "7-1", name: "Personalized", slug: "personalized-magnets" },
      { id: "7-2", name: "Funky", slug: "funky-magnets" },
    ],
  },
];

export const PRODUCTS: Product[] = [
  {
    id: "101",
    name: "Pi Pi Ka Hisaab Lunga ",
    category: "magnets",
    childCategory: "personalized-magnets",
    actualPrice: 499,
    offerPrice: 399,
    rating: 4.7,
    image: "https://res-console.cloudinary.com/dq7hun84m/thumbnails/v1/image/upload/v1768959161/a2FfaGlzYWFiX2x1bmdhXzFfenEzeHN3/drilldown",
    images: [
      "https://res-console.cloudinary.com/dq7hun84m/thumbnails/v1/image/upload/v1768959161/a2FfaGlzYWFiX2x1bmdhXzFfenEzeHN3/drilldown",
      "https://res-console.cloudinary.com/dq7hun84m/thumbnails/v1/image/upload/v1768959088/a2FfaGlzYWFiX2x1bmdhXzJfeG1samhn/drilldown",
    ],
    description: "Custom photo mug perfect for gifting on special occasions.",
    details: {
      material: "Ceramic",
      weight: "350g",
      size: "11 oz",
      aboutProduct: "High-quality ceramic mug with permanent photo print. Dishwasher and microwave safe.",
    },
  },
];

export const REVIEWS: Review[] = [
  {
    id: "r1",
    author: "Amit Kumar",
    initials: "AK",
    date: "2 days ago",
    rating: 5,
    content: "Hilarious and high quality! The magnet is very strong and doesn't slide down the fridge. Everyone who sees it has a good laugh. Great gift for that one friend who's a bit stingy.",
    isVerified: true
  },
  {
    id: "r2",
    author: "Priya Singh",
    initials: "PS",
    date: "1 week ago",
    rating: 5,
    content: "Love the typography. It looks exactly like the photo. The shipping was fast and the packaging was very secure.",
    isVerified: true
  }
];

export const BUSINESS_PHONE = "917702522332";
