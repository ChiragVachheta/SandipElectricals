export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  category_id: string | null;
  brand_id: string | null;
  mrp: number;
  discount_price: number;
  stock: number;
  status: 'in_stock' | 'out_of_stock' | 'inactive';
  is_featured: boolean;
  rating: number;
  search_keywords: string | null;
  category?: Category;
  brand?: Brand;
  product_images?: ProductImage[];
  product_specifications?: ProductSpecification[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
}

export interface ProductSpecification {
  id: string;
  product_id: string;
  spec_name: string;
  spec_value: string;
  sort_order: number;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

export interface Address {
  id: string;
  user_id: string;
  label: string | null;
  full_name: string;
  phone: string;
  pincode: string;
  house: string;
  street: string;
  city: string;
  state: string;
  landmark: string | null;
  is_default: boolean;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  address_id: string | null;
  subtotal: number;
  delivery_charge: number;
  discount: number;
  total: number;
  payment_method: 'cod' | 'razorpay';
  status: 'processing' | 'dispatched' | 'out_for_delivery' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  payments?: Payment[];
  address?: Address | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  sku: string | null;
  image_url: string | null;
  mrp: number;
  price: number;
  quantity: number;
}

export interface Payment {
  id: string;
  order_id: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount: number;
  method: 'cod' | 'razorpay';
  status: 'pending' | 'verified' | 'failed';
  verified_at: string | null;
}

export interface CancellationRequest {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_remark: string | null;
  created_at: string;
  resolved_at: string | null;
  order?: Order;
}

export interface ReplacementRequest {
  id: string;
  order_id: string;
  order_item_id: string | null;
  user_id: string;
  reason: string;
  media_urls: string[] | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_remark: string | null;
  created_at: string;
  resolved_at: string | null;
  order?: Order;
}

export interface DeliveryInstruction {
  id: string;
  order_id: string;
  instruction: string | null;
}

export const ORDER_STATUSES = [
  'processing',
  'dispatched',
  'out_for_delivery',
  'delivered',
] as const;

export const BUSINESS = {
  name: 'Sandip Electricals',
  email: 'contact.sandip.electricals@gmail.com',
  mobile: '8401038914',
  address: 'Shop no 5, Ravjikaka Nagar, Jagatpur Road, Chandlodiya, Ahmedabad - 382481',
  whatsapp: '918401038914',
};
