import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Users, Tag, AlertCircle, Loader2, Timer } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";
import type { Event, TicketType, FlashSale } from "@/app/types";
import api from "@/app/services/api";
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
  
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [currentTimeTick, setCurrentTimeTick] = useState<Date>(new Date());

  useEffect(() => {
    if (!eventId) {
      navigate('/');
      return;
    }

    const fetchEvent = async () => {
      setLoading(true);
      try {
        const response = await api.events.getById(eventId);
        if (response.success && response.data) {
          setEvent(response.data);
        } else {
          toast.error("Event tidak ditemukan");
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error("Gagal memuat event");
      } finally {
        setLoading(false);
      }
    };

    const fetchFlashSalesData = async () => {
      try {
        const response = await api.flashSales.getAll({ event_id: eventId });
        if (response.success && response.data) {
          setFlashSales(response.data);
        }
      } catch (e) {
        console.error('Error fetching rebutan kartcis:', e);
      }
    };

    fetchEvent();
    fetchFlashSalesData();

    const timer = setInterval(() => setCurrentTimeTick(new Date()), 1000);
    return () => clearInterval(timer);
  }, [eventId, navigate]);

  const getActiveFlashSale = (ticketId: number) => {
    const currentHour = String(currentTimeTick.getHours()).padStart(2, '0');
    const currentMin = String(currentTimeTick.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHour}:${currentMin}`;
    
    const year = currentTimeTick.getFullYear();
    const month = String(currentTimeTick.getMonth() + 1).padStart(2, '0');
    const day = String(currentTimeTick.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;

    return flashSales.find(fs => {
       if (!fs.is_active || fs.ticket_type_id !== ticketId) return false;
       if (fs.sold >= fs.quota) return false;
       
       // Check date
       if (!fs.flash_date || fs.flash_date.split('T')[0] !== currentDate) return false;
       
       // Check time
       if (currentTime < fs.start_time || currentTime >= fs.end_time) return false;
       
       return true;
    });
  };

  const getCountdown = (endTimeStr: string) => {
    const [hours, minutes] = endTimeStr.split(':').map(Number);
    const end = new Date(currentTimeTick);
    end.setHours(hours, minutes, 0, 0);
    
    const diff = end.getTime() - currentTimeTick.getTime();
    if (diff <= 0) return "Berakhir";
    
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    
    return `${h > 0 ? h + 'j ' : ''}${m}m ${s}s`;
  };

  const handleTicketQuantityChange = (ticketType: TicketType, delta: number) => {
    // Check if event is available for purchase (must be published)
    const isAvailable = event?.status === 'published';
    if (!isAvailable) return;
    
    setSelectedTickets(prev => {
      const current = prev[ticketType.id] || 0;
      const activeFS = getActiveFlashSale(ticketType.id);
      const maxAvailable = activeFS 
        ? Math.min(ticketType.available, (activeFS.quota - activeFS.sold))
        : ticketType.available;

      const newQuantity = Math.max(0, Math.min(maxAvailable, current + delta));
      
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
      const ticket = event.ticket_types?.find(t => String(t.id) === ticketId);
      if (!ticket) return sum;
      
      const activeFS = getActiveFlashSale(ticket.id);
      const price = activeFS ? activeFS.flash_price : ticket.price;
      
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  // Availability check
  const isSoldOut = event.status === 'sold_out' || (event.ticket_types && event.ticket_types.length > 0 && event.ticket_types.every(t => t.available === 0));
  const isCancelled = event.status === 'cancelled';
  const isCompleted = event.status === 'completed';
  const isEventAvailable = event.status === 'published' && !isSoldOut;
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
                src={event.image || ''}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              
              {/* Status Badge Overlay */}
              {(!isEventAvailable || isCompleted || isCancelled) && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Badge 
                    variant="destructive"
                    className="text-2xl px-8 py-3 font-bold"
                  >
                    {isCancelled ? 'DIBATALKAN' : isCompleted ? 'EVENT SELESAI' : isSoldOut ? 'SOLD OUT' : 'TIDAK TERSEDIA'}
                  </Badge>
                </div>
              )}

              {/* Featured Badge */}
              {event.is_featured && isEventAvailable && (
                <Badge className="absolute top-4 right-4 bg-accent-orange text-white">
                  Populer
                </Badge>
              )}

              {/* Category Badge */}
              <Badge className="absolute top-4 left-4 bg-primary">
                {event.category?.name || 'Uncategorized'}
              </Badge>
            </div>

            {/* Event Info */}
            <div>
              <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm font-semibold">Tanggal & Waktu</p>
                    <p className="text-gray-600">
                      {formatDate(event.event_date)} · {formatTime(event.event_time ??'')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm font-semibold">Lokasi</p>
                    <p className="text-gray-600">{event.venue}, {event.city}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm font-semibold">Kategori</p>
                    <p className="text-gray-600">{event.category?.name || 'Uncategorized'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-1" />
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
                <p className="text-gray-700 whitespace-pre-line leading-relaxed text-lg">
                  {event.detailed_description || event.description}
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
                        {isCancelled ? 'Event Dibatalkan' : isCompleted ? 'Event Selesai' : isSoldOut ? 'Tiket Habis' : 'Pesanan Belum Tersedia'}
                      </p>
                      <p className="text-sm text-red-700">
                        {isCancelled 
                          ? 'Event ini telah dibatalkan oleh penyelenggara'
                          : isCompleted 
                          ? 'Event ini sudah selesai'
                          : isSoldOut 
                          ? 'Semua tiket untuk event ini sudah habis terjual'
                          : 'Maaf, pesanan tiket belum dibuka untuk umum.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-6">
                {event.ticket_types?.map((ticket) => {
                  const quantity = selectedTickets[ticket.id] || 0;
                  const activeFS = getActiveFlashSale(ticket.id);
                  const displayPrice = activeFS ? activeFS.flash_price : ticket.price;
                  const originalForDisplay = activeFS ? ticket.price : (ticket.originalPrice ? Number(ticket.originalPrice) : ticket.price);
                  const hasDiscount = activeFS || (originalForDisplay > displayPrice);
                  const discountPercent = hasDiscount && originalForDisplay > 0
                    ? Math.round(((originalForDisplay - displayPrice) / originalForDisplay) * 100)
                    : 0;

                  return (
                    <div key={ticket.id} className={`border rounded-xl transition-all ${activeFS ? 'border-red-200 bg-red-50/30' : ''}`}>
                      {activeFS && (
                        <div className="bg-red-50 text-red-600 p-2.5 px-3 border-b border-red-100 flex items-center justify-between text-[11px] sm:text-xs">
                          <div className="flex items-center gap-1.5 font-bold uppercase tracking-tight">
                            <Timer className="h-3.5 w-3.5 animate-pulse" />
                            <span>Rebutan Kartcis</span>
                          </div>
                          <div className="font-mono font-bold bg-red-100/50 px-2 py-0.5 rounded border border-red-200">
                            {getCountdown(activeFS.end_time)}
                          </div>
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{ticket.name}</h3>
                            {ticket.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ticket.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex flex-col">
                            {hasDiscount && (
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 bg-red-100 text-red-700 hover:bg-red-100 border-0">
                                  {discountPercent}% OFF
                                </Badge>
                                <p className="text-xs font-medium text-gray-400 line-through">
                                  {formatCurrency(originalForDisplay)}
                                </p>
                              </div>
                            )}
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(displayPrice)}
                            </p>
                          </div>

                          {isEventAvailable && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTicketQuantityChange(ticket, -1)}
                                disabled={quantity === 0}
                                className="h-8 w-8 p-0 rounded-full bg-white text-gray-600 shadow-sm border-gray-200"
                              >
                                -
                              </Button>
                              <span className="w-6 text-center font-bold text-gray-900">{quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTicketQuantityChange(ticket, 1)}
                                disabled={quantity >= ticket.available || (activeFS && quantity >= (activeFS.quota - activeFS.sold))}
                                className="h-8 w-8 p-0 rounded-full bg-white text-primary shadow-sm border-primary/20 hover:bg-primary/5 hover:border-primary"
                              >
                                +
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
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
                      <span className="text-primary">{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-primary hover:bg-primary-hover"
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