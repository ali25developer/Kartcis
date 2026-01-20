export type PaymentMethodType = 'va' | 'ewallet' | 'qris' | 'credit_card';

export interface PendingOrder {
  orderId: string;
  paymentMethod: string; // BCA, GoPay, QRIS, CreditCard, etc
  paymentType: PaymentMethodType; // va, ewallet, qris, credit_card
  vaNumber?: string; // only for VA
  qrisUrl?: string; // only for QRIS
  amount: number;
  expiryTime: number; // timestamp
  createdAt: number; // timestamp
  orderDetails: {
    items: Array<{
      eventTitle: string;
      ticketType: string;
      quantity: number;
      price: number;
      eventImage: string;
    }>;
    customerInfo: {
      name: string;
      email: string;
      phone: string;
    };
  };
  status: 'pending' | 'paid' | 'expired';
}