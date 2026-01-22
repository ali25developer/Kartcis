// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Database schema types (match dengan backend)
export interface Event {
  id: number;
  title: string;
  slug: string;
  description: string;
  detailed_description?: string; // Rich description with full details
  facilities?: string[]; // List of facilities/benefits
  terms?: string[]; // Terms and conditions
  agenda?: AgendaItem[]; // Event schedule/rundown
  organizer_info?: OrganizerInfo; // Detailed organizer information
  faqs?: FAQ[]; // Frequently asked questions
  event_date: string; // YYYY-MM-DD
  event_time: string | null; // HH:mm:ss
  date: string; // Alias for event_date (compatibility with frontend)
  time: string; // Alias for event_time (compatibility with frontend)
  venue: string;
  city: string;
  organizer: string;
  quota: number;
  image: string | null;
  is_featured: boolean;
  status: 'draft' | 'published' | 'completed' | 'cancelled' | 'sold_out';
  cancel_reason?: string; // Reason for cancellation
  min_price: number; // Minimum ticket price
  max_price: number; // Maximum ticket price
  created_at: string;
  updated_at: string;
  category_id: number;
  category?: Category;
  ticket_types?: TicketType[];
}

export interface AgendaItem {
  time: string;
  activity: string;
}

export interface OrganizerInfo {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketType {
  id: number;
  event_id: number;
  name: string;
  description: string | null;
  price: number;
  originalPrice?: number; // For discount display
  quota: number;
  available: number;
  sold: number; // Number of tickets sold
  status: 'available' | 'sold_out' | 'unavailable';
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  event_id: number;
  ticket_type_id: number;
  quantity: number;
  event_title: string;
  event_date: string;
  event_time: string;
  event_image: string;
  ticket_type_name: string;
  ticket_price: number;
}

export interface Order {
  id: number;
  user_id: number | null;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  payment_method: string;
  payment_details: any;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  event_id: number;
  ticket_type_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: number;
  order_id: number;
  event_id: number;
  ticket_type_id: number;
  ticket_code: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string;
  status: 'active' | 'used' | 'cancelled';
  check_in_at: string | null;
  created_at: string;
  updated_at: string;
  event?: Event;
  ticket_type?: TicketType;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role?: 'user' | 'admin'; // Add role field
  created_at: string;
  updated_at: string;
}

export interface CheckoutRequest {
  items: CartItem[];
  payment_method: string;
  customer_info: {
    name: string;
    email: string;
    phone: string;
  };
}