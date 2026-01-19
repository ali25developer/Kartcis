export interface PendingOrder {
  orderId: string;
  vaNumber: string;
  bank: string;
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
