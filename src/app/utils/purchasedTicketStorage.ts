import { Ticket } from '@/app/components/MyTickets';

const STORAGE_KEY = 'kartcis_purchased_tickets';

export const purchasedTicketStorage = {
  // Get all purchased tickets
  getAll: (): Ticket[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const tickets: Ticket[] = JSON.parse(stored);
      return tickets;
    } catch (error) {
      console.error('Error reading purchased tickets:', error);
      return [];
    }
  },

  // Get tickets by user ID
  getByUserId: (userId: string | number): Ticket[] => {
    try {
      const allTickets = purchasedTicketStorage.getAll();
      // For now, we'll use a simple approach where tickets have a userId property
      // In a real app, this would be handled by the backend
      return allTickets.filter((ticket: any) => String(ticket.userId) === String(userId));
    } catch (error) {
      console.error('Error reading user tickets:', error);
      return [];
    }
  },

  // Get single ticket by ID
  getById: (ticketId: string): Ticket | null => {
    const tickets = purchasedTicketStorage.getAll();
    return tickets.find(ticket => ticket.id === ticketId) || null;
  },

  // Add new purchased ticket
  add: (ticket: Ticket & { userId?: string | number }): void => {
    try {
      const tickets = purchasedTicketStorage.getAll();
      tickets.push(ticket);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch (error) {
      console.error('Error saving purchased ticket:', error);
    }
  },

  // Add multiple tickets at once
  addMultiple: (newTickets: (Ticket & { userId?: string | number })[]): void => {
    try {
      const tickets = purchasedTicketStorage.getAll();
      tickets.push(...newTickets);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch (error) {
      console.error('Error saving purchased tickets:', error);
    }
  },

  // Update ticket status (for cancelled events)
  updateStatus: (ticketId: string, status: 'active' | 'cancelled', cancelReason?: string): void => {
    try {
      const tickets = purchasedTicketStorage.getAll();
      const ticketIndex = tickets.findIndex(ticket => ticket.id === ticketId);
      
      if (ticketIndex !== -1) {
        (tickets[ticketIndex] as any).eventStatus = status;
        if (cancelReason) {
          (tickets[ticketIndex] as any).cancelReason = cancelReason;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  },

  // Remove ticket
  remove: (ticketId: string): void => {
    try {
      const tickets = purchasedTicketStorage.getAll();
      const filtered = tickets.filter(ticket => ticket.id !== ticketId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing ticket:', error);
    }
  },

  // Clear all
  clear: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing tickets:', error);
    }
  }
};
