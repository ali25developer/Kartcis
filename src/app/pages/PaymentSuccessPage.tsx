import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PaymentSuccess } from "@/app/components/PaymentSuccess";
import { pendingOrderStorage } from "@/app/utils/pendingOrderStorage";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function PaymentSuccessPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingOrder, setPendingOrder] = useState<any>(null);

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    const order = pendingOrderStorage.getById(orderId);
    
    if (!order) {
      toast.error("Pesanan tidak ditemukan");
      navigate('/');
      return;
    }

    if (order.status !== 'paid') {
      navigate(`/payment/${orderId}`);
      return;
    }

    setPendingOrder(order);
    setLoading(false);
  }, [orderId, navigate]);

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

  return <PaymentSuccess pendingOrder={pendingOrder} />;
}