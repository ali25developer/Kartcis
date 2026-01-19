import type {
  ApiResponse,
  Event,
  Category,
  Order,
  Ticket,
  CheckoutRequest,
} from '../types';
import { mockEvents, mockCategories } from './mockData';

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API Service
const api = {
  events: {
    getAll: async (): Promise<ApiResponse<Event[]>> => {
      await delay(300);
      return {
        success: true,
        data: mockEvents,
      };
    },

    getFeatured: async (): Promise<ApiResponse<Event[]>> => {
      await delay(200);
      const featured = mockEvents.filter((event) => event.is_featured);
      return {
        success: true,
        data: featured,
      };
    },

    getById: async (id: number): Promise<ApiResponse<Event>> => {
      await delay(150);
      const event = mockEvents.find((e) => e.id === id);
      if (!event) {
        return {
          success: false,
          error: 'Event not found',
        };
      }
      return {
        success: true,
        data: event,
      };
    },

    getByCategory: async (categoryId: number): Promise<ApiResponse<Event[]>> => {
      await delay(200);
      const events = mockEvents.filter((e) => e.category_id === categoryId);
      return {
        success: true,
        data: events,
      };
    },

    search: async (query: string): Promise<ApiResponse<Event[]>> => {
      await delay(250);
      const lowerQuery = query.toLowerCase();
      const results = mockEvents.filter(
        (event) =>
          event.title.toLowerCase().includes(lowerQuery) ||
          event.city.toLowerCase().includes(lowerQuery) ||
          event.venue.toLowerCase().includes(lowerQuery) ||
          event.organizer.toLowerCase().includes(lowerQuery) ||
          event.category?.name.toLowerCase().includes(lowerQuery)
      );
      return {
        success: true,
        data: results,
      };
    },
  },

  categories: {
    getAll: async (): Promise<ApiResponse<Category[]>> => {
      await delay(200);
      return {
        success: true,
        data: mockCategories,
      };
    },
  },

  orders: {
    create: async (data: CheckoutRequest): Promise<ApiResponse<Order>> => {
      await delay(500);

      // Calculate total
      const total = data.items.reduce(
        (sum, item) => sum + item.ticket_price * item.quantity,
        0
      );

      // Generate order number
      const orderNumber = `MASUP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Generate VA number based on bank
      let vaNumber = '';
      if (data.payment_method === 'BCA') {
        vaNumber = `80777${Math.random().toString().substring(2, 12)}`;
      } else if (data.payment_method === 'Mandiri') {
        vaNumber = `8901${Math.random().toString().substring(2, 14)}`;
      } else if (data.payment_method === 'BNI') {
        vaNumber = `8808${Math.random().toString().substring(2, 14)}`;
      } else if (data.payment_method === 'BRI') {
        vaNumber = `26215${Math.random().toString().substring(2, 13)}`;
      }

      // Create order
      const order: Order = {
        id: Date.now(),
        user_id: null,
        order_number: orderNumber,
        total_amount: total,
        status: 'pending',
        payment_method: data.payment_method,
        payment_details: {
          bank: data.payment_method,
          va_number: vaNumber,
          customer_name: data.customer_info.name,
        },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        paid_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return {
        success: true,
        data: order,
      };
    },

    confirmPayment: async (orderId: number): Promise<ApiResponse<Order>> => {
      await delay(1000);

      // Mock payment confirmation
      const order: Order = {
        id: orderId,
        user_id: null,
        order_number: `MASUP-${orderId}`,
        total_amount: 0,
        status: 'paid',
        payment_method: 'BCA',
        payment_details: {},
        expires_at: new Date().toISOString(),
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return {
        success: true,
        data: order,
      };
    },
  },

  tickets: {
    getByOrder: async (orderId: number): Promise<ApiResponse<Ticket[]>> => {
      await delay(300);

      // Mock generate tickets based on order
      const tickets: Ticket[] = [
        {
          id: Date.now(),
          order_id: orderId,
          event_id: 1,
          ticket_type_id: 1,
          ticket_code: `MASUP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          attendee_name: 'John Doe',
          attendee_email: 'john@example.com',
          attendee_phone: '08123456789',
          status: 'active',
          check_in_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      return {
        success: true,
        data: tickets,
      };
    },

    getByUser: async (userId: number): Promise<ApiResponse<Ticket[]>> => {
      await delay(300);
      // Mock user tickets
      return {
        success: true,
        data: [],
      };
    },
  },
};

// Legacy service for backward compatibility
export const eventService = {
  getAll: async () => {
    const eventsResponse = await api.events.getAll();
    const categoriesResponse = await api.categories.getAll();
    const featuredResponse = await api.events.getFeatured();

    if (!eventsResponse.success || !categoriesResponse.success || !featuredResponse.success) {
      throw new Error('Failed to fetch events');
    }

    return {
      events: eventsResponse.data?.map((event) => ({
        id: event.id.toString(),
        title: event.title,
        date: event.date,
        time: event.time,
        venue: event.venue,
        city: event.city,
        category: event.category?.name || '',
        image: event.image,
        price: event.min_price,
        organizer: event.organizer,
        description: event.description,
        ticketTypes: event.ticket_types?.map((tt) => ({
          id: tt.id.toString(),
          name: tt.name,
          price: tt.price,
          quota: tt.quota,
          sold: tt.sold,
        })) || [],
      })) || [],
      categories: categoriesResponse.data?.map((cat) => ({
        id: cat.id.toString(),
        name: cat.name,
      })) || [],
      featuredEvents: featuredResponse.data?.map((event) => ({
        id: event.id.toString(),
        title: event.title,
        date: event.date,
        time: event.time,
        venue: event.venue,
        city: event.city,
        category: event.category?.name || '',
        image: event.image,
        price: event.min_price,
        organizer: event.organizer,
        description: event.description,
        ticketTypes: event.ticket_types?.map((tt) => ({
          id: tt.id.toString(),
          name: tt.name,
          price: tt.price,
          quota: tt.quota,
          sold: tt.sold,
        })) || [],
      })) || [],
    };
  },
};

export { api };
export default api;