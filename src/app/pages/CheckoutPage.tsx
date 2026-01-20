import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, User, Mail, Phone, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";
import type { Event } from "@/app/data/events";
import { formatCurrency, formatDate, formatTime } from "@/app/utils/helpers";
import { pendingOrderStorage } from "@/app/utils/pendingOrderStorage";
import { PaymentMethodSelection, getPaymentMethodType } from "@/app/components/PaymentMethodSelection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";

interface CheckoutState {
  event: Event;
  selectedTickets: Record<string, number>;
}

export function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const state = location.state as CheckoutState | null;
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: ''
  });
  const [showPendingAlert, setShowPendingAlert] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('BCA');

  useEffect(() => {
    // Redirect if no state
    if (!state || !state.event || !state.selectedTickets) {
      toast.error("Silakan pilih tiket terlebih dahulu");
      navigate('/');
      return;
    }

    // Check if there's an active pending order
    const activePendingOrder = pendingOrderStorage.getActive();
    if (activePendingOrder) {
      setPendingOrderId(activePendingOrder.orderId);
      setShowPendingAlert(true);
    }
  }, [state, navigate]);

  useEffect(() => {
    // Update form when user logs in
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        email: user.email
      }));
    }
  }, [user]);

  if (!state || !state.event || !state.selectedTickets) {
    return null;
  }

  const { event, selectedTickets } = state;

  const getTotalQuantity = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(selectedTickets).reduce((sum, [ticketId, quantity]) => {
      const ticket = event.ticketTypes.find(t => String(t.id) === ticketId);
      if (!ticket) return sum;
      
      // Use ticket price directly (already discounted if applicable)
      return sum + (ticket.price * quantity);
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error("Nama lengkap wajib diisi");
      return;
    }
    
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error("Email tidak valid");
      return;
    }
    
    if (!formData.phone.trim()) {
      toast.error("Nomor telepon wajib diisi");
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create order
      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Create order items
      const orderItems = Object.entries(selectedTickets).map(([ticketId, quantity]) => {
        const ticket = event.ticketTypes.find(t => String(t.id) === ticketId);
        if (!ticket) throw new Error("Ticket not found");
        
        // Use ticket price directly (already final price)
        const price = ticket.price;

        return {
          eventTitle: event.title,
          eventImage: event.image,
          ticketType: ticket.name,
          quantity,
          price,
        };
      });

      // Get payment type
      const paymentType = getPaymentMethodType(paymentMethod);

      // Generate payment-specific data
      let vaNumber: string | undefined;
      let qrisUrl: string | undefined;

      if (paymentType === 'va') {
        // Generate VA number based on selected bank
        const bankCodes: Record<string, string> = {
          'BCA': '70012',
          'Mandiri': '88008',
          'BNI': '8808',
          'BRI': '26215',
          'Permata': '8528'
        };
        const code = bankCodes[paymentMethod] || '70012';
        const random = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
        vaNumber = `${code}${random}`;
      } else if (paymentType === 'qris') {
        // Generate mock QRIS URL
        qrisUrl = `https://qris.id/scan/${orderId}`;
      }

      // Store pending order with correct structure
      const pendingOrder = {
        orderId,
        paymentMethod,
        paymentType,
        vaNumber,
        qrisUrl,
        amount: getTotalPrice(),
        expiryTime: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        createdAt: Date.now(),
        orderDetails: {
          items: orderItems,
          customerInfo: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          }
        },
        status: 'pending' as const
      };

      pendingOrderStorage.add(pendingOrder);

      toast.success("Pesanan berhasil dibuat!");
      
      // Navigate to payment page
      navigate(`/payment/${orderId}`);
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error("Terjadi kesalahan saat memproses pesanan");
    } finally {
      setLoading(false);
    }
  };

  const handleContinuePendingPayment = () => {
    if (pendingOrderId) {
      navigate(`/payment/${pendingOrderId}`);
    }
    setShowPendingAlert(false);
  };

  const handleCancelPendingOrder = () => {
    if (pendingOrderId) {
      pendingOrderStorage.remove(pendingOrderId);
      toast.success("Pesanan sebelumnya dibatalkan");
      setPendingOrderId(null);
    }
    setShowPendingAlert(false);
  };

  const totalQuantity = getTotalQuantity();
  const totalPrice = getTotalPrice();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Pemesanan Tiket</h1>
          <p className="text-gray-600 mt-2 text-lg">Lengkapi data dan pilih metode pembayaran</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Informasi Pembeli</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-2">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      disabled={loading}
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Tiket akan dikirim ke email ini
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone">
                    Nomor Telepon <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="08123456789"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-10"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <Separator />

                {/* Payment Method Selection */}
                <PaymentMethodSelection
                  selectedMethod={paymentMethod}
                  onSelectMethod={setPaymentMethod}
                  disabled={loading}
                />

                <Separator />

                <Button 
                  type="submit" 
                  className="w-full bg-sky-600 hover:bg-sky-700"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Lanjut ke Pembayaran'
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Summary Section */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-4">Ringkasan Pesanan</h2>

              {/* Event Info */}
              <div className="mb-4">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <h3 className="text-xl font-semibold">{event.title}</h3>
                <p className="text-gray-600 mt-1 text-base">
                  {formatDate(event.date)} · {formatTime(event.time)}
                </p>
                <p className="text-gray-600 text-base">
                  {event.venue}, {event.city}
                </p>
              </div>

              <Separator className="my-4" />

              {/* Ticket Details */}
              <div className="space-y-3 mb-4">
                {Object.entries(selectedTickets).map(([ticketId, quantity]) => {
                  const ticket = event.ticketTypes.find(t => String(t.id) === ticketId);
                  if (!ticket) return null;
                  
                  // Use ticket price directly (already final price)
                  const price = ticket.price;

                  return (
                    <div key={ticketId} className="flex justify-between">
                      <span className="text-gray-600 text-sm">
                        {ticket.name} × {quantity}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(price * quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-4" />

              {/* Total */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Tiket:</span>
                  <span className="font-semibold">{totalQuantity}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total Bayar:</span>
                  <span className="text-sky-600">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Pending Order Alert */}
      <AlertDialog open={showPendingAlert} onOpenChange={setShowPendingAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pesanan Sebelumnya</AlertDialogTitle>
            <AlertDialogDescription>
              Anda memiliki pesanan sebelumnya yang belum dibayar. Apakah Anda ingin melanjutkan pembayaran pesanan tersebut?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelPendingOrder}>
              Batalkan Pesanan Sebelumnya
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleContinuePendingPayment}>
              Lanjutkan Pembayaran
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}