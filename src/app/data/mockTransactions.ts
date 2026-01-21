// Mock Transaction Data for Admin Dashboard

export interface MockTransaction {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  event_title: string;
  event_date: string;
  ticket_type: string;
  quantity: number;
  total_amount: number;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  payment_method: string;
  created_at: string;
  expires_at: string | null;
  paid_at: string | null;
}

// Generate mock transactions
export function generateMockTransactions(): MockTransaction[] {
  const statuses: Array<'pending' | 'completed' | 'expired' | 'cancelled'> = [
    'completed',
    'completed',
    'completed',
    'completed',
    'completed',
    'completed',
    'completed',
    'completed',
    'pending',
    'pending',
    'pending',
    'expired',
    'expired',
    'cancelled',
  ];

  const events = [
    'Jakarta Marathon 2026',
    'Bali Yoga Festival',
    'Surabaya Food Festival',
    'Bandung Music Concert',
    'Tech Conference Jakarta',
    'Digital Marketing Workshop',
    'Charity Run Jogja',
    'Semarang Half Marathon',
  ];

  const ticketTypes = ['Early Bird', 'Regular', 'VIP', 'Premium', 'Standard'];
  const paymentMethods = ['BCA Virtual Account', 'Mandiri Virtual Account', 'OVO', 'GoPay', 'ShopeePay', 'QRIS'];

  const names = [
    'Budi Santoso',
    'Ani Wijaya',
    'Dian Pratama',
    'Eko Susanto',
    'Fitri Lestari',
    'Hendra Gunawan',
    'Indah Permata',
    'Joko Widodo',
    'Kartika Sari',
    'Lukman Hakim',
    'Maya Kusuma',
    'Nurdin Ahmad',
    'Olivia Tan',
    'Putra Ramadhan',
    'Qori Dewi',
    'Rizki Fauzi',
    'Sinta Maharani',
    'Tono Sugiarto',
    'Usman Efendi',
    'Vina Anggraini',
  ];

  const transactions: MockTransaction[] = [];

  // Generate 50 transactions
  for (let i = 0; i < 50; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30)); // Last 30 days

    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 60) + 10); // 10-70 days in future

    const quantity = Math.floor(Math.random() * 3) + 1;
    const basePrice = [50000, 75000, 100000, 150000, 250000, 350000][Math.floor(Math.random() * 6)];
    const totalAmount = basePrice * quantity;

    const name = names[Math.floor(Math.random() * names.length)];
    const email = `${name.toLowerCase().replace(' ', '.')}@gmail.com`;

    const expiresDate = new Date(createdDate);
    expiresDate.setHours(expiresDate.getHours() + 24);

    const paidDate = status === 'completed' ? new Date(createdDate.getTime() + Math.random() * 12 * 60 * 60 * 1000) : null;

    transactions.push({
      id: `TRX-${String(i + 1).padStart(5, '0')}`,
      order_number: `ORD-${Date.now()}-${String(i + 1).padStart(4, '0')}`,
      customer_name: name,
      customer_email: email,
      customer_phone: `08${Math.floor(Math.random() * 900000000) + 100000000}`,
      event_title: events[Math.floor(Math.random() * events.length)],
      event_date: eventDate.toISOString().split('T')[0],
      ticket_type: ticketTypes[Math.floor(Math.random() * ticketTypes.length)],
      quantity,
      total_amount: totalAmount,
      status,
      payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      created_at: createdDate.toISOString(),
      expires_at: status === 'pending' ? expiresDate.toISOString() : null,
      paid_at: paidDate ? paidDate.toISOString() : null,
    });
  }

  // Sort by created_at descending (newest first)
  return transactions.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export const MOCK_TRANSACTIONS = generateMockTransactions();
