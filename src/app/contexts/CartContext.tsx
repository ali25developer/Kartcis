import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (eventId: number, ticketTypeId: number, quantity: number) => void;
  removeItem: (eventId: number, ticketTypeId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'masup_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [items]);

  const addItem = (newItem: CartItem) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) =>
          item.event_id === newItem.event_id &&
          item.ticket_type_id === newItem.ticket_type_id
      );

      if (existingIndex >= 0) {
        // Update existing item
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(10, updated[existingIndex].quantity + newItem.quantity),
        };
        return updated;
      } else {
        // Add new item
        return [...prevItems, newItem];
      }
    });
  };

  const updateQuantity = (eventId: number, ticketTypeId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(eventId, ticketTypeId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.event_id === eventId && item.ticket_type_id === ticketTypeId
          ? { ...item, quantity: Math.min(10, quantity) }
          : item
      )
    );
  };

  const removeItem = (eventId: number, ticketTypeId: number) => {
    setItems((prevItems) =>
      prevItems.filter(
        (item) =>
          !(item.event_id === eventId && item.ticket_type_id === ticketTypeId)
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = items.reduce(
    (total, item) => total + item.ticket_price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalAmount,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
