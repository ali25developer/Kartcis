export type PaymentMethodType = 'va' | 'ewallet' | 'qris' | 'credit_card';

export interface PendingOrder {
  orderId: string;
  paymentMethod: string; // BCA, GoPay, QRIS, CreditCard, etc
  paymentType: PaymentMethodType; // va, ewallet, qris, credit_card
  vaNumber?: string; // only for VA
  virtualAccountNumber?: string; // alias for vaNumber
  qrisUrl?: string; // only for QRIS
  amount: number;
  totalAmount: number; // Alias for amount (for compatibility)
  adminFee?: number; // Admin fee
  expiryTime: number; // timestamp
  paymentUrl?: string | null; // e-wallet/payment link
  createdAt: number; // timestamp
  items: Array<{
    eventId: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    venue: string;
    city: string;
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
  orderDetails?: { // Keep for backward compatibility
    items: Array<{
      eventId?: string;
      eventTitle: string;
      eventDate?: string;
      eventTime?: string;
      venue?: string;
      city?: string;
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
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
}