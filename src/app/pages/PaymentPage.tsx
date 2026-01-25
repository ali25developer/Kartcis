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

          // Determine payment type from payment method string
          let paymentType: PaymentMethodType = 'va';
          const method = order.payment_method?.toLowerCase() || '';
          if (method.includes('qris')) paymentType = 'qris';
          else if (method.includes('gopay') || method.includes('ovo') || method.includes('shopee')) paymentType = 'ewallet';
          else if (method.includes('card')) paymentType = 'credit_card';

          const mappedOrder = {
             orderId: order.order_number || String(order.id),
             paymentMethod: order.payment_method,
             paymentType,
             vaNumber: order.payment_details?.va_number,
             qrisUrl: order.payment_details?.qris_url,
             // Add virtual account number if explicitly available in other field
             virtualAccountNumber: order.payment_details?.virtual_account_number || order.payment_details?.va_number, 
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

          // Update storage for global banner/countdown
          if (mappedOrder.status === 'pending' && mappedOrder.expiryTime > Date.now()) {
            pendingOrderStorage.add(mappedOrder);
          } else if (mappedOrder.status === 'paid' || mappedOrder.status === 'cancelled' || mappedOrder.status === 'expired') {
            pendingOrderStorage.remove(mappedOrder.orderId);
          }

          // Fetch tickets for custom fields
          try {
             // Use order_number for public accessibility
             const orderIdentifier = order.order_number || order.id;
             const ticketsResponse = await api.tickets.getByOrder(orderIdentifier);
             if (ticketsResponse.success && ticketsResponse.data) {
                setTickets(ticketsResponse.data);
             }
          } catch (err) {
             console.error("Failed to fetch tickets", err);
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

  const handlePaymentSuccess = () => {
    if (!pendingOrder) return;
    navigate(`/payment/success/${pendingOrder.orderId}`);
  };

  const handleCheckStatus = async () => {
    if (!orderId) return;
    try {
      const response = await api.orders.checkStatus(orderId);
      if (response.success && response.data) {
        if (response.data.status === 'paid') {
          toast.success("Pembayaran berhasil dikonfirmasi!");
          navigate(`/payment/success/${orderId}`);
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
    
    if (window.confirm('Apakah Anda yakin ingin membatalkan pembayaran?')) {
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
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
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
        onPaymentSuccess={handlePaymentSuccess}
        onManualCheck={handleCheckStatus}
        onCancel={handleCancel}
      />
    </div>
  );
}