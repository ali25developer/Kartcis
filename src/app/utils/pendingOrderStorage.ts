import { PendingOrder } from '../types/pendingOrder';

const STORAGE_KEY = 'masup_pending_orders';

export const pendingOrderStorage = {
  // Get all pending orders
  getAll: (): PendingOrder[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const orders: PendingOrder[] = JSON.parse(stored);
      
      // Filter out expired orders
      const now = Date.now();
      const validOrders = orders.filter(order => {
        return order.expiryTime > now && order.status === 'pending';
      });
      
      // Update storage if we filtered anything out
      if (validOrders.length !== orders.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validOrders));
      }
      
      return validOrders;
    } catch (error) {
      console.error('Error reading pending orders:', error);
      return [];
    }
  },

  // Get single order by ID
  getById: (orderId: string): PendingOrder | null => {
    const orders = pendingOrderStorage.getAll();
    return orders.find(order => order.orderId === orderId) || null;
  },

  // Add new pending order
  add: (order: PendingOrder): void => {
    try {
      const orders = pendingOrderStorage.getAll();
      const existingIndex = orders.findIndex(o => o.orderId === order.orderId);
      
      if (existingIndex !== -1) {
        orders[existingIndex] = order;
      } else {
        orders.push(order);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
      window.dispatchEvent(new CustomEvent('pending-orders-changed'));
    } catch (error) {
      console.error('Error saving pending order:', error);
    }
  },

  // Update order status
  updateStatus: (orderId: string, status: 'pending' | 'paid' | 'expired'): void => {
    try {
      const orders = pendingOrderStorage.getAll();
      const orderIndex = orders.findIndex(order => order.orderId === orderId);
      
      if (orderIndex !== -1) {
        orders[orderIndex].status = status;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
        window.dispatchEvent(new CustomEvent('pending-orders-changed'));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  },

  // Remove order
  remove: (orderId: string): void => {
    try {
      const orders = pendingOrderStorage.getAll();
      const filtered = orders.filter(order => order.orderId !== orderId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('pending-orders-changed'));
    } catch (error) {
      console.error('Error removing pending order:', error);
    }
  },

  // Clear all
  clear: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('pending-orders-changed'));
    } catch (error) {
      console.error('Error clearing pending orders:', error);
    }
  },

  // Get active (non-expired) pending order
  getActive: (): PendingOrder | null => {
    const orders = pendingOrderStorage.getAll();
    return orders.length > 0 ? orders[0] : null;
  }
};
