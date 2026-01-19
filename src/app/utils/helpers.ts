import type { Event as ApiEvent } from '../types';
import type { Event as V44Event } from '../data/events';

// Convert API Event format to V44 Event format for compatibility with existing components
export function convertApiEventToV44(apiEvent: ApiEvent): V44Event {
  // Map status
  let eventStatus: 'active' | 'sold-out' | 'cancelled' | undefined;
  if (apiEvent.status === 'sold-out') {
    eventStatus = 'sold-out';
  } else if (apiEvent.status === 'cancelled') {
    eventStatus = 'cancelled';
  }

  return {
    id: apiEvent.id.toString(),
    title: apiEvent.title,
    organizer: apiEvent.organizer,
    category: (apiEvent.category?.name as any) || 'Olahraga',
    date: apiEvent.event_date,
    time: apiEvent.event_time || '00:00',
    venue: apiEvent.venue,
    city: apiEvent.city,
    image: apiEvent.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1080" height="720"%3E%3Crect width="1080" height="720" fill="%23e5e7eb"/%3E%3C/svg%3E',
    price: {
      min: apiEvent.ticket_types && apiEvent.ticket_types.length > 0
        ? Math.min(...apiEvent.ticket_types.map(t => t.price))
        : 0,
      max: apiEvent.ticket_types && apiEvent.ticket_types.length > 0
        ? Math.max(...apiEvent.ticket_types.map(t => t.price))
        : 0,
    },
    description: apiEvent.description,
    detailedDescription: apiEvent.detailed_description,
    facilities: apiEvent.facilities,
    terms: apiEvent.terms,
    agenda: apiEvent.agenda,
    organizerInfo: apiEvent.organizer_info,
    faqs: apiEvent.faqs,
    status: eventStatus,
    cancelReason: apiEvent.cancel_reason,
    isFeatured: apiEvent.is_featured,
    ticketTypes: (apiEvent.ticket_types || []).map(tt => ({
      id: tt.id.toString(),
      name: tt.name,
      price: tt.price,
      originalPrice: tt.originalPrice, // Include originalPrice for discount display
      available: tt.available,
      total: tt.quota,
      description: tt.description || '',
    })),
    quota: apiEvent.quota,
    registrationForm: [],
  };
}

// Format currency to IDR
export function formatCurrency(amount: number): string {
  if (amount === 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date to Indonesian format
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Format time from HH:mm:ss to HH:mm
export function formatTime(timeString: string): string {
  if (!timeString) return '00:00';
  return timeString.substring(0, 5);
}