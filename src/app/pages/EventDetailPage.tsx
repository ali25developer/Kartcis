import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Calendar, MapPin, Clock, Users, Tag, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";
import { events as eventsData, type Event, type TicketType } from "@/app/data/events";
import { formatCurrency, formatDate, formatTime } from "@/app/utils/helpers";
import { pendingOrderStorage } from "@/app/utils/pendingOrderStorage";
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

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [showPendingAlert, setShowPendingAlert] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      navigate('/');
      return;
    }

    setLoading(true);
    const foundEvent = eventsData.find(e => e.id === eventId);
    
    if (foundEvent) {
      setEvent(foundEvent);
    } else {
      toast.error("Event tidak ditemukan");
      navigate('/');
    }
    setLoading(false);
  }, [eventId, navigate]);

  const handleTicketQuantityChange = (ticketType: TicketType, delta: number) => {
    // Check if event is available (not sold out or cancelled)
    const isSoldOut = event?.status === 'sold-out';
    const isCancelled = event?.status === 'cancelled';
    if (isSoldOut || isCancelled) return;
    
    setSelectedTickets(prev => {
      const current = prev[ticketType.id] || 0;
      const newQuantity = Math.max(0, Math.min(ticketType.available, current + delta));
      
      if (newQuantity === 0) {
        const { [ticketType.id]: _, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [ticketType.id]: newQuantity
      };
    });
  };

  const getTotalQuantity = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    if (!event) return 0;
    
    return Object.entries(selectedTickets).reduce((sum, [ticketId, quantity]) => {
      const ticket = event.ticketTypes.find(t => String(t.id) === ticketId);
      if (!ticket) return sum;
      
      // Use original price if exists (no discount), otherwise use regular price
      const price = ticket.price;
      
      return sum + (price * quantity);
    }, 0);
  };

  const handleCheckout = () => {
    const totalQuantity = getTotalQuantity();
    
    if (totalQuantity === 0) {
      toast.error("Pilih tiket terlebih dahulu");
      return;
    }

    if (!event) return;

    // Check if there's an active pending order
    const activePendingOrder = pendingOrderStorage.getActive();
    
    if (activePendingOrder) {
      // Show alert dialog
      setPendingOrderId(activePendingOrder.orderId);
      setShowPendingAlert(true);
      return;
    }

    // Navigate to checkout with state
    navigate('/checkout', {
      state: {
        event,
        selectedTickets
      }
    });
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
      setShowPendingAlert(false);
      
      // After cancelling, proceed with current checkout if tickets are still selected
      if (event && getTotalQuantity() > 0) {
        // Small delay to let user see the toast
        setTimeout(() => {
          navigate('/checkout', {
            state: {
              event,
              selectedTickets
            }
          });
        }, 500);
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

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Event tidak ditemukan</p>
      </div>
    );
  }

  // Check if event is available (not sold out and not cancelled)
  const isSoldOut = event.status === 'sold-out';
  const isCancelled = event.status === 'cancelled';
  const isEventAvailable = !isSoldOut && !isCancelled;
  const totalQuantity = getTotalQuantity();
  const totalPrice = getTotalPrice();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            <div className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden bg-gray-200">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              
              {/* Status Badge Overlay */}
              {(isSoldOut || isCancelled) && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Badge 
                    variant="destructive"
                    className="text-2xl px-8 py-3 font-bold"
                  >
                    {isSoldOut ? 'SOLD OUT' : 'DIBATALKAN'}
                  </Badge>
                </div>
              )}

              {/* Featured Badge */}
              {event.isFeatured && isEventAvailable && (
                <Badge className="absolute top-4 right-4 bg-yellow-500 text-black">
                  FEATURED
                </Badge>
              )}

              {/* Category Badge */}
              <Badge className="absolute top-4 left-4 bg-sky-600">
                {event.category}
              </Badge>
            </div>

            {/* Event Info */}
            <div>
              <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-sky-600 mt-1" />
                  <div>
                    <p className="text-sm font-semibold">Tanggal & Waktu</p>
                    <p className="text-gray-600">
                      {formatDate(event.date)} · {formatTime(event.time)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-sky-600 mt-1" />
                  <div>
                    <p className="text-sm font-semibold">Lokasi</p>
                    <p className="text-gray-600">{event.venue}, {event.city}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-sky-600 mt-1" />
                  <div>
                    <p className="text-sm font-semibold">Kategori</p>
                    <p className="text-gray-600">{event.category}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-sky-600 mt-1" />
                  <div>
                    <p className="text-sm font-semibold">Organizer</p>
                    <p className="text-gray-600">{event.organizer}</p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Description */}
              <div>
                <h2 className="text-3xl font-bold mb-4">Tentang Event</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Terms */}
            {event.terms && event.terms.length > 0 && (
              <div>
                <h2 className="text-3xl font-bold mb-4">Syarat & Ketentuan</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed">
                  {event.terms.map((term, index) => (
                    <li key={index}>{term}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar - Ticket Selection */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-4">Pilih Tiket</h2>

              {!isEventAvailable && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900">
                        {event.status === 'sold_out' ? 'Tiket Habis' : 'Event Dibatalkan'}
                      </p>
                      <p className="text-sm text-red-700">
                        {event.status === 'sold_out' 
                          ? 'Semua tiket untuk event ini sudah habis terjual'
                          : 'Event ini telah dibatalkan oleh penyelenggara'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-6">
                {event.ticketTypes.map((ticket) => {
                  const quantity = selectedTickets[ticket.id] || 0;
                  
                  // Calculate discount if originalPrice exists
                  const hasDiscount = ticket.originalPrice && ticket.originalPrice > ticket.price;
                  const discountPercent = hasDiscount 
                    ? Math.round(((ticket.originalPrice! - ticket.price) / ticket.originalPrice!) * 100)
                    : 0;

                  return (
                    <div key={ticket.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold">{ticket.name}</h3>
                          {ticket.description && (
                            <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div>
                          {hasDiscount && (
                            <p className="text-sm text-gray-500 line-through">
                              {formatCurrency(ticket.originalPrice!)}
                            </p>
                          )}
                          <p className="text-2xl font-bold text-sky-600">
                            {formatCurrency(ticket.price)}
                          </p>
                          {hasDiscount && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              DISKON {discountPercent}%
                            </Badge>
                          )}
                        </div>

                        {isEventAvailable && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTicketQuantityChange(ticket, -1)}
                              disabled={quantity === 0}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center font-semibold">{quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTicketQuantityChange(ticket, 1)}
                              disabled={quantity >= ticket.available}
                            >
                              +
                            </Button>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        Tersedia: {ticket.available} tiket
                      </p>
                    </div>
                  );
                })}
              </div>

              {isEventAvailable && (
                <>
                  <Separator className="my-4" />
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Tiket:</span>
                      <span className="font-semibold">{totalQuantity}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold">
                      <span>Total:</span>
                      <span className="text-sky-600">{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-sky-600 hover:bg-sky-700"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={totalQuantity === 0}
                  >
                    Pesan Sekarang
                  </Button>

                  {!isAuthenticated && (
                    <p className="text-xs text-center text-gray-500 mt-3">
                      Login untuk menyimpan tiket di dashboard Anda
                    </p>
                  )}
                </>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Pending Order Alert Dialog */}
      <AlertDialog open={showPendingAlert} onOpenChange={setShowPendingAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pesanan Sebelumnya</AlertDialogTitle>
            <AlertDialogDescription>
              Anda memiliki pesanan sebelumnya yang belum selesai. Apakah Anda ingin melanjutkan pembayaran pesanan tersebut?
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