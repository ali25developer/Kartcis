import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Event, Category } from '../types';
import api from '../services/api';

interface EventsContextType {
  events: Event[];
  categories: Category[];
  featuredEvents: Event[];
  loading: boolean;
  error: string | null;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventsRes, categoriesRes] = await Promise.all([
          api.events.getAll(),
          api.categories.getAll(),
        ]);

        if (eventsRes.success && eventsRes.data) {
          setEvents(eventsRes.data);
        }

        if (categoriesRes.success && categoriesRes.data) {
          setCategories(categoriesRes.data);
        }

        setError(null);
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const featuredEvents = events.filter((event) => event.is_featured);

  return (
    <EventsContext.Provider
      value={{
        events,
        categories,
        featuredEvents,
        loading,
        error,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
}
