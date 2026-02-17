import api from "@/app/services/api";
import { pendingOrderStorage } from "@/app/utils/pendingOrderStorage";
import { PaymentMethodType } from "@/app/types/pendingOrder";
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from '@/app/utils/toast';
import { Loader2 } from 'lucide-react';
import { PaymentDetailPage } from '../components/PaymentDetailPage';

export function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    // Prevent running fetchOrder if orderId is 'success' (in case of route collision)
    if (orderId === 'success') {
        return; 
    }

    const fetchOrder = async () => {
      try {
        // Since orderId in URL might be string order_number or numeric id
        // and api.orders.getById expects number, we try to parse it or use it as is if api supports string
        // If orderId is "ORDER-...", it's likely a string ID.
        // We might need to adjust api.ts to accept string if it strictly requires number.
        // For now assuming existing API service can handle it or we cast.
        // Actually, let's just cast to any to bypass TS for the ID type mismatch if needed, 
        // or parse if it is numeric.
        
        let idParam: any = orderId;
        // If numeric string, convert to number
        if (/^\d+$/.test(orderId)) {
            idParam = parseInt(orderId, 10);
        }

        const response = await api.orders.getById(idParam);
        
        if (response.success && response.data) {
          const order = response.data;
          

          
          // Allow viewing details for all statuses
          // if (order.status === 'paid') { ... }
          // if (order.status === 'cancelled' || order.status === 'expired') { ... }

          // Map Order to PendingOrder for UI compatibility
          // Note: We might miss some event details if backend doesn't provide them in order_items
          const items = order.order_items?.map((item: any) => ({
             eventId: String(item.event_id),
             eventTitle: item.event_title || item.event?.title || 'Event', 
             eventDate: item.event_date || item.event?.event_date || '',
             eventTime: item.event_time || item.event?.event_time || '',
             venue: item.venue || item.event?.venue || '',
             city: item.city || item.event?.city || '',
             ticketType: item.ticket_type_name || item.ticket_type?.name || 'Ticket',
             quantity: item.quantity,
             price: item.unit_price,
             eventImage: item.event_image || item.event?.image || '',
          })) || [];

          // Parse payment_details if it is a string (Go/Postgres JSONB common issue)
          let paymentDetails = order.payment_details;
          if (typeof paymentDetails === 'string') {
            try {
              paymentDetails = JSON.parse(paymentDetails);
            } catch (e) {
              console.error("Failed to parse payment_details string", e);
            }
          }

          // Determine payment type from payment method string
          let paymentType: PaymentMethodType = 'va';
          const method = (order.payment_method || '').toLowerCase();
          if (method.includes('qris')) paymentType = 'qris';
          else if (method.includes('gopay') || method.includes('ovo') || method.includes('shopee')) paymentType = 'ewallet';
          else if (method.includes('card')) paymentType = 'credit_card';
          else if (method.includes('manual')) paymentType = 'va'; // Treat manual as VA (bank transfer) logic

          const mappedOrder = {
             orderId: order.order_number || String(order.id),
             paymentMethod: order.payment_method,
             paymentType,
             vaNumber: order.virtual_account_number || paymentDetails?.va_number || paymentDetails?.virtual_account_number || paymentDetails?.account_number,
             qrisUrl: paymentDetails?.qris_url,
             paymentUrl: order.payment_url || paymentDetails?.payment_url,
             // Manual Transfer Specifics
             uniqueCode: order.unique_code,
             paymentInstructions: order.payment_instructions,
             accountName: order.account_name || paymentDetails?.account_name || paymentDetails?.account_holder,
             virtualAccountNumber: order.virtual_account_number || paymentDetails?.virtual_account_number || paymentDetails?.va_number || paymentDetails?.account_number, 
             amount: order.total_amount,
             totalAmount: order.total_amount,
             adminFee: order.admin_fee,
             // Fix expires_at parsing: Ensure it stays consistent by anchoring to created_at if missing
             expiryTime: (() => {
               if (order.expires_at) {
                 return new Date(String(order.expires_at).replace(' ', 'T')).getTime();
               }
               // Anchor to created_at to prevent reset on refresh
               const created = order.created_at 
                 ? new Date(String(order.created_at).replace(' ', 'T')).getTime() 
                 : Date.now();
               return created + 30 * 60 * 1000;
             })(),
             createdAt: order.created_at ? new Date(order.created_at.replace(' ', 'T')).getTime() : Date.now(),
             items: items,
             customerInfo: {
               name: order.customer_name,
               email: order.customer_email,
               phone: order.customer_phone,
             },
             orderDetails: { 
                items,
                customerInfo: {
                  name: order.customer_name,
                  email: order.customer_email,
                  phone: order.customer_phone,
                }
              }, // For compatibility
             status: order.status
          };

          setPendingOrder(mappedOrder);

          // Extract tickets from order data if available (avoiding redundant API call)
          if (order.tickets && Array.isArray(order.tickets)) {
            setTickets(order.tickets);
          } else if (order.order_items && Array.isArray(order.order_items)) {
            // Some backends might nest tickets inside order_items or use it as an alias
            const flatTickets = order.order_items.flatMap((item: any) => item.tickets || []);
            if (flatTickets.length > 0) {
              setTickets(flatTickets);
            }
          }

          // Update storage for global banner/countdown
          if (mappedOrder.status === 'pending' && mappedOrder.expiryTime > Date.now()) {
            pendingOrderStorage.add(mappedOrder);
          } else if (mappedOrder.status === 'paid' || mappedOrder.status === 'cancelled' || mappedOrder.status === 'expired') {
            pendingOrderStorage.remove(mappedOrder.orderId);
          }

        } else {
           toast.error("Pesanan tidak ditemukan");
           navigate('/');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error("Gagal memuat pesanan");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  // Polling for status updates (Auto Refresh)
  useEffect(() => {
    // Only poll if we have an order and it is pending
    if (!pendingOrder || pendingOrder.status !== 'pending' || !orderId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await api.orders.checkStatus(orderId);
        
        if (response.success && response.data) {
          const latestOrder = response.data;
          const newStatus = latestOrder.status;

          // If status changed from pending
          if (newStatus !== 'pending') {
            clearInterval(pollInterval);
            
            if (newStatus === 'paid') {
              toast.success("Pembayaran berhasil dikonfirmasi!");
              
              // Update local state to show success UI in-place instead of redirecting
              setPendingOrder((prev: any) => ({ 
                ...prev, 
                status: newStatus 
              }));

              pendingOrderStorage.remove(String(orderId));
              // navigate(`/payment/success/${orderId}`); // Don't redirect, stay here
            } else if (newStatus === 'cancelled' || newStatus === 'expired') {
              // Update local state to show cancelled/expired UI
              setPendingOrder((prev: any) => ({ 
                ...prev, 
                status: newStatus 
              }));
              
              pendingOrderStorage.remove(String(orderId));
              toast.info(`Pesanan ${newStatus === 'cancelled' ? 'dibatalkan' : 'telah kadaluarsa'}`);
            }
          }
        }
      } catch (error) {
        // Silent error for polling to avoid annoying user
        console.error('Error polling status:', error);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(pollInterval);
  }, [pendingOrder?.status, orderId, navigate]);



  const handleCheckStatus = async () => {
    if (!orderId) return;
    try {
      const response = await api.orders.checkStatus(orderId);
      if (response.success && response.data) {
        if (response.data.status === 'paid') {
          toast.success("Pembayaran berhasil dikonfirmasi!");
          // Update local state instead of redirecting
          setPendingOrder((prev: any) => ({ 
            ...prev, 
            status: 'paid' 
          }));
          pendingOrderStorage.remove(String(orderId));
        } else {
          toast.info("Pembayaran belum diterima");
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const handleCancel = async () => {
    if (!pendingOrder || !orderId) return;
    
    try {
      const response = await api.orders.cancel(orderId);
      if (response.success) {
        pendingOrderStorage.remove(pendingOrder.orderId);
        toast.info("Pembayaran dibatalkan");
        navigate('/');
      } else {
        toast.error(response.message || "Gagal membatalkan pesanan");
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error("Terjadi kesalahan saat membatalkan pesanan");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pendingOrder) {
    return null;
  }

  return (
    <div>
      <PaymentDetailPage
        pendingOrder={pendingOrder}
        tickets={tickets}
        onManualCheck={handleCheckStatus}
        onCancel={handleCancel}
      />
    </div>
  );
}