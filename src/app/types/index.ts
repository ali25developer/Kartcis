export interface PaginationMetadata {
  current_page: number;
  total_pages: number;
  total_items: number;
  per_page: number;
}

export type PaginatedData<T, K extends string> = {
  [key in K]: T[];
};

export interface PaginatedResponse<T, K extends string> {
  success: boolean;
  data: PaginatedData<T, K> & { pagination: PaginationMetadata };
  message?: string;
}

export interface Voucher {
  id: number;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_discount_amount: number | null;
  max_uses: number;
  used_count: number;
  event_id: number | null;
  event?: Pick<Event, 'id' | 'title'>;
  ticket_type_id?: number | null;
  ticket_type?: Pick<TicketType, 'id' | 'name'>;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Custom Fields for events
export interface CustomField {
  name: string;
  type: 'text' | 'select';
  options?: string[];
  required: boolean;
  description?: string;
  attachment_url?: string;
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
  custom_fields?: string; // JSON string from backend
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
  fee_percentage?: number; // Admin fee percentage (default 5.0)
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
  icon?: string; // FontAwesome class or URL
  image?: string; // URL from upload
  display_order?: number;
  is_active?: boolean;
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
  // Checkout/Cart usage might enrich this with attendees for payload construction
  attendees?: {
    name: string;
    email: string;
    phone: string;
    custom_field_responses?: string;
  }[];
}

export interface Order {
  id: number;
  user_id: number | null;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  admin_fee: number; // Added admin fee
  discount_amount?: number; // Voucher discount
  voucher_code?: string; // Appied voucher
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  payment_method: string;
  payment_url: string | null;
  payment_details: any;
  virtual_account_number?: string;
  account_name?: string;
  unique_code?: number;
  payment_instructions?: string;
  payment_method_id?: string;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  tickets?: Ticket[];
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
  tickets?: Ticket[];
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
  custom_field_responses?: string; // JSON string of custom field responses
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
  role?: 'user' | 'admin' | 'organizer'; // Add role field
  custom_fee?: number | null; // Custom fee percentage override
  created_at: string;
  updated_at: string;
}

export interface CheckoutRequest {
  items: {
    ticket_type_id: number;
    quantity: number;
    attendees: {
      name: string;
      email: string;
      phone: string;
      custom_field_responses?: string;
    }[];
  }[];
  payment_method: string;
  voucher_code?: string;
  customer_info: {
    name: string;
    email: string;
    phone: string;
  };
}

export type HelpModalType = 'cara-pesan' | 'syarat-ketentuan' | 'kebijakan-privasi';