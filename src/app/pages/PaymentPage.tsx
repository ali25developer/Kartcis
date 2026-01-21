import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { PaymentDetailPage } from "@/app/components/PaymentDetailPage";
import { pendingOrderStorage } from "@/app/utils/pendingOrderStorage";
import { purchasedTicketStorage } from "@/app/utils/purchasedTicketStorage";
import { useAuth } from "@/app/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingOrder, setPendingOrder] = useState<any>(null);

  useEffect(() => {
    if (!orderId) {
      console.log('[PaymentPage] No orderId provided');
      navigate('/');
      return;
    }

    console.log('[PaymentPage] Loading order:', orderId);
    const order = pendingOrderStorage.getById(orderId);
    console.log('[PaymentPage] Order found:', order);
    
    if (!order) {
      toast.error("Pesanan tidak ditemukan");
      navigate('/');
      return;
    }

    if (order.status === 'paid') {
      console.log('[PaymentPage] Order already paid, redirecting to success');
      navigate(`/payment/success/${orderId}`);
      return;
    }

    if (order.status === 'expired') {
      toast.error("Pesanan telah kedaluwarsa");
      navigate('/');
      return;
    }

    console.log('[PaymentPage] Setting pending order and completing load');
    setPendingOrder(order);
    setLoading(false);
  }, [orderId, navigate]);

  const handlePaymentSuccess = () => {
    if (!pendingOrder) return;
    
    // Update order status to paid
    pendingOrderStorage.updateStatus(pendingOrder.orderId, 'paid');
    
    // Create tickets from order items
    if (user) {
      const tickets = pendingOrder.items.map((item: any, index: number) => ({
        id: `${pendingOrder.orderId}-${index}`,
        userId: user.id,
        eventId: item.eventId,
        eventTitle: item.eventTitle,
        eventDate: item.eventDate,
        eventTime: item.eventTime,
        venue: item.venue,
        city: item.city,
        ticketType: item.ticketType,
        quantity: item.quantity,
        price: item.price,
        eventImage: item.eventImage,
        orderDate: new Date().toISOString(),
        ticketCode: `TKT-${pendingOrder.orderId}-${index}`.toUpperCase(),
        eventStatus: 'active' as const,
      }));
      
      purchasedTicketStorage.addMultiple(tickets);
    }
    
    navigate(`/payment/success/${pendingOrder.orderId}`);
  };

  const handleCancel = () => {
    if (!pendingOrder) return;
    
    if (window.confirm('Apakah Anda yakin ingin membatalkan pembayaran?')) {
      pendingOrderStorage.remove(pendingOrder.orderId);
      toast.info("Pembayaran dibatalkan");
      navigate('/');
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
        onPaymentSuccess={handlePaymentSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}