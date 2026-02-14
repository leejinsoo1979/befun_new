export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PRODUCING'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'CANCELLED'
  | 'REFUNDED';

export type ShippingStatus =
  | 'PREPARING'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'DELIVERED';

export type PaymentMethod =
  | 'CARD'
  | 'TRANSFER'
  | 'EASY_PAY'
  | 'VIRTUAL_ACCOUNT';

export interface Address {
  id: string;
  name: string;      // 받는 사람
  phone: string;
  zipCode: string;
  address: string;    // 기본 주소
  detail?: string;    // 상세 주소
  isDefault: boolean;
}

export interface CartItem {
  id: string;
  designId: string;
  designConfig: Record<string, unknown>; // ShelfConfig JSON
  thumbnailUrl?: string;
  quantity: number;
  price: number;       // 개당 가격 (원)
}

export interface Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  shippingFee: number;
  address: Address;
  payment?: Payment;
  shipping?: Shipping;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  designId: string;
  quantity: number;
  price: number;
}

export interface Payment {
  id: string;
  paymentKey?: string;
  method?: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
}

export interface Shipping {
  id: string;
  carrier?: string;
  trackingNo?: string;
  status: ShippingStatus;
  shippedAt?: string;
  deliveredAt?: string;
}
