import { create } from 'zustand';
import type { Address, Order, PaymentMethod } from '@/types/order';

interface OrderState {
  // 주문서 작성 중 상태
  selectedAddress: Address | null;
  paymentMethod: PaymentMethod | null;

  // 주문 내역
  orders: Order[];

  // Actions
  setSelectedAddress: (address: Address | null) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setOrders: (orders: Order[]) => void;
  reset: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  selectedAddress: null,
  paymentMethod: null,
  orders: [],

  setSelectedAddress: (address) => set({ selectedAddress: address }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setOrders: (orders) => set({ orders }),
  reset: () => set({ selectedAddress: null, paymentMethod: null }),
}));
