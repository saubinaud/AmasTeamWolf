export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  variants?: string[];
}

// Note: CartItem interface is now defined in CartDrawerHome.tsx
// to match the actual implementation used throughout the app

export interface Coupon {
  code: string;
  discount: number;
}

export interface TimelineMilestone {
  month: number;
  title: string;
  description: string;
  achievements: string[];
}
