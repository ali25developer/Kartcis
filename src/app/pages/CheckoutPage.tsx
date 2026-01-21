import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, User, Mail, Phone, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { Checkbox } from "@/app/components/ui/checkbox";
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

interface ParticipantData {
  ticketId: string;
  ticketName: string;
  isSameAsBuyer: boolean;
  data: Record<string, string>;
}

export function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const locationState = location.state as CheckoutState | null;
  
  // Save state to component state to prevent loss
  const [checkoutData, setCheckoutData] = useState<CheckoutState | null>(null);
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [primaryContactIndex, setPrimaryContactIndex] = useState(0);
  const [showPendingAlert, setShowPendingAlert] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('BCA');
  
  // Refs for auto-scroll on validation error
  const participantRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Helper function to scroll with offset for sticky navbar
  const scrollToParticipant = (index: number) => {
    const element = participantRefs.current[index];
    if (!element) return;

    const offset = 160; // Increased offset for sticky navbar + header + padding
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    // Update form when user logs in
    if (user && participants.length > 0 && participants[primaryContactIndex]) {
      setParticipants(prev => {
        const updated = [...prev];
        if (updated[primaryContactIndex]) {
          updated[primaryContactIndex] = {
            ...updated[primaryContactIndex],
            data: {
              ...updated[primaryContactIndex].data,
              fullName: user.name,
              email: user.email
            }
          };
        }
        return updated;
      });
    }
  }, [user, participants.length, primaryContactIndex]);

  // Initialize participants based on selected tickets - RUN ONCE
  useEffect(() => {
    console.log('🎫 Initializing participants...', { 
      hasState: !!locationState,
      hasEvent: !!locationState?.event,
      hasSelectedTickets: !!locationState?.selectedTickets,
      selectedTickets: locationState?.selectedTickets
    });

    if (!locationState || !locationState.event || !locationState.selectedTickets) {
      console.log('❌ Cannot initialize - missing state');
      return;
    }

    const participantsList: ParticipantData[] = [];
    Object.entries(locationState.selectedTickets).forEach(([ticketId, quantity]) => {
      console.log('🎟️ Processing ticket:', { ticketId, quantity });
      const ticket = locationState.event.ticketTypes.find(t => String(t.id) === ticketId);
      if (!ticket) {
        console.log('⚠️ Ticket not found:', ticketId);
        return;
      }

      // Create a participant entry for each ticket
      for (let i = 0; i < quantity; i++) {
        participantsList.push({
          ticketId,
          ticketName: ticket.name,
          isSameAsBuyer: false,
          data: {}
        });
      }
    });

    console.log('✅ Participants created:', participantsList.length, participantsList);
    setParticipants(participantsList);
    setCheckoutData(locationState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initialize ONLY ONCE on mount

  useEffect(() => {
    // Redirect if no state - CHECK ONLY ONCE on mount
    if (!locationState || !locationState.event || !locationState.selectedTickets) {
      console.log('❌ No state on mount, redirecting...');
      toast.error("Silakan pilih tiket terlebih dahulu");
      navigate('/');
      return;
    }

    // Check if selectedTickets is actually populated
    const hasTickets = Object.keys(locationState.selectedTickets).length > 0;
    if (!hasTickets) {
      console.log('❌ No tickets in selectedTickets:', locationState.selectedTickets);
      toast.error("Silakan pilih tiket terlebih dahulu");
      navigate('/');
      return;
    }

    console.log('✅ CheckoutPage received state:', { 
      event: locationState.event.title, 
      selectedTickets: locationState.selectedTickets,
      ticketCount: Object.keys(locationState.selectedTickets).length
    });

    // Check if there's an active pending order
    const activePendingOrder = pendingOrderStorage.getActive();
    if (activePendingOrder) {
      setPendingOrderId(activePendingOrder.orderId);
      setShowPendingAlert(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  if (!checkoutData || !checkoutData.event || !checkoutData.selectedTickets) {
    console.log('⚠️ Render check: No state, returning null');
    return null;
  }

  const { event, selectedTickets } = checkoutData;

  // Show loading while participants are being initialized
  console.log('🔍 Render check:', { 
    participantsLength: participants.length,
    hasEvent: !!event,
    hasSelectedTickets: !!selectedTickets 
  });

  if (participants.length === 0) {
    console.log('⏳ Showing loading spinner - participants not ready yet');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  console.log('✅ Rendering checkout form with', participants.length, 'participants');

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

  const handleParticipantInputChange = (index: number, fieldId: string, value: string) => {
    setParticipants(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        data: {
          ...updated[index].data,
          [fieldId]: value
        }
      };
      return updated;
    });
  };

  const handleParticipantSelectChange = (index: number, fieldId: string, value: string) => {
    handleParticipantInputChange(index, fieldId, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For single ticket, validate additional registration form fields
    if (isSingleTicket && event.registrationForm && event.registrationForm.length > 0) {
      for (const field of event.registrationForm) {
        // Skip basic fields (already validated above)
        if (['fullName', 'email', 'phone'].includes(field.fieldId)) continue;
        
        if (field.required && !participants[primaryContactIndex].data[field.fieldId]?.trim()) {
          toast.error(`${field.label} wajib diisi`);
          // Scroll to the participant card
          scrollToParticipant(primaryContactIndex);
          return;
        }
      }
    }

    // For multiple tickets, validate participant data
    if (!isSingleTicket) {
      // First, validate basic required fields
      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        
        // Check basic participant fields
        if (!participant.data.fullName?.trim()) {
          toast.error(`Peserta ${i + 1}: Nama lengkap wajib diisi`);
          // Scroll to the participant card
          scrollToParticipant(i);
          return;
        }
        
        if (!participant.data.email?.trim() || !participant.data.email.includes('@')) {
          toast.error(`Peserta ${i + 1}: Email tidak valid`);
          // Scroll to the participant card
          scrollToParticipant(i);
          return;
        }
        
        if (!participant.data.phone?.trim()) {
          toast.error(`Peserta ${i + 1}: Nomor telepon wajib diisi`);
          // Scroll to the participant card
          scrollToParticipant(i);
          return;
        }

        // Validate additional registration fields for each participant
        if (event.registrationForm && event.registrationForm.length > 0) {
          for (const field of event.registrationForm) {
            // Skip basic fields (already validated above)
            if (['fullName', 'email', 'phone'].includes(field.fieldId)) continue;
            
            if (field.required && !participant.data[field.fieldId]?.trim()) {
              toast.error(`Peserta ${i + 1}: ${field.label} wajib diisi`);
              // Scroll to the participant card
              scrollToParticipant(i);
              return;
            }
          }
        }
      }

      // Check for duplicate data (nama, email, phone)
      for (let i = 0; i < participants.length; i++) {
        const currentParticipant = participants[i];
        
        for (let j = i + 1; j < participants.length; j++) {
          const otherParticipant = participants[j];
          
          // Check duplicate fullName
          if (currentParticipant.data.fullName?.trim().toLowerCase() === 
              otherParticipant.data.fullName?.trim().toLowerCase()) {
            toast.error(`Peserta ${j + 1}: Nama tidak boleh sama dengan Peserta ${i + 1}`);
            scrollToParticipant(j);
            return;
          }
          
          // Check duplicate email
          if (currentParticipant.data.email?.trim().toLowerCase() === 
              otherParticipant.data.email?.trim().toLowerCase()) {
            toast.error(`Peserta ${j + 1}: Email tidak boleh sama dengan Peserta ${i + 1}`);
            scrollToParticipant(j);
            return;
          }
          
          // Check duplicate phone
          if (currentParticipant.data.phone?.trim() === 
              otherParticipant.data.phone?.trim()) {
            toast.error(`Peserta ${j + 1}: Nomor telepon tidak boleh sama dengan Peserta ${i + 1}`);
            scrollToParticipant(j);
            return;
          }
        }
      }
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
          eventId: event.id,
          eventTitle: event.title,
          eventImage: event.image,
          eventDate: event.date,
          eventTime: event.time,
          venue: event.venue,
          city: event.city,
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
        totalAmount: getTotalPrice(),
        expiryTime: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        createdAt: Date.now(),
        items: orderItems,
        customerInfo: {
          name: participants[primaryContactIndex].data.fullName,
          email: participants[primaryContactIndex].data.email,
          phone: participants[primaryContactIndex].data.phone,
        },
        orderDetails: {
          items: orderItems,
          customerInfo: {
            name: participants[primaryContactIndex].data.fullName,
            email: participants[primaryContactIndex].data.email,
            phone: participants[primaryContactIndex].data.phone,
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
  const isSingleTicket = totalQuantity === 1;

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
          <p className="text-gray-600 mt-2">Lengkapi data dan pilih metode pembayaran</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Peserta</h2>
                  {!isSingleTicket && (
                    <p className="text-sm text-gray-600">
                      Pilih salah satu peserta sebagai <strong>Contact Person Utama</strong> untuk menerima semua tiket
                    </p>
                  )}
                </div>
              
                <form onSubmit={handleSubmit} className="space-y-6">
                  {participants.length > 0 && (
                    <div className="space-y-6">
                      {participants.map((participant, index) => (
                        <div 
                          key={index} 
                          ref={el => participantRefs.current[index] = el}
                        >
                          <Card 
                            className={`p-4 border-2 ${primaryContactIndex === index ? 'border-sky-600 bg-sky-50' : 'bg-gray-50 border-gray-200'}`}
                          >
                            <div className="flex items-center gap-3 mb-4">
                              {!isSingleTicket && (
                                <Checkbox
                                  id={`primary-${index}`}
                                  checked={primaryContactIndex === index}
                                  onCheckedChange={() => setPrimaryContactIndex(index)}
                                />
                              )}
                              <label htmlFor={`primary-${index}`} className="font-semibold text-lg text-gray-900 cursor-pointer">
                                Peserta {index + 1} - {participant.ticketName}
                                {primaryContactIndex === index && !isSingleTicket && (
                                  <span className="ml-2 text-sm font-normal text-sky-600">(Contact Person Utama)</span>
                                )}
                              </label>
                            </div>

                            <div className="space-y-4">
                              {/* Full Name */}
                              <div>
                                <Label htmlFor={`participant-${index}-fullName`}>
                                  Nama Lengkap <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`participant-${index}-fullName`}
                                  type="text"
                                  placeholder="Masukkan nama lengkap peserta"
                                  value={participant.data.fullName || ''}
                                  onChange={(e) => handleParticipantInputChange(index, 'fullName', e.target.value)}
                                  className="mt-2"
                                  disabled={loading}
                                  required
                                />
                              </div>

                              {/* Email */}
                              <div>
                                <Label htmlFor={`participant-${index}-email`}>
                                  Email <span className="text-red-500">*</span>
                                  {primaryContactIndex === index && !isSingleTicket && (
                                    <span className="text-sm font-normal text-sky-600 ml-2">(Semua tiket dikirim ke email ini)</span>
                                  )}
                                </Label>
                                <Input
                                  id={`participant-${index}-email`}
                                  type="email"
                                  placeholder="email@example.com"
                                  value={participant.data.email || ''}
                                  onChange={(e) => handleParticipantInputChange(index, 'email', e.target.value)}
                                  className="mt-2"
                                  disabled={loading}
                                  required
                                />
                              </div>

                              {/* Phone */}
                              <div>
                                <Label htmlFor={`participant-${index}-phone`}>
                                  Nomor Telepon <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`participant-${index}-phone`}
                                  type="tel"
                                  placeholder="08123456789"
                                  value={participant.data.phone || ''}
                                  onChange={(e) => handleParticipantInputChange(index, 'phone', e.target.value)}
                                  className="mt-2"
                                  disabled={loading}
                                  required
                                />
                              </div>

                              {/* Additional fields from registrationForm */}
                              {event.registrationForm && event.registrationForm.map(field => {
                                // Skip basic fields as they're already rendered above
                                if (['fullName', 'email', 'phone'].includes(field.fieldId)) return null;
                                
                                return (
                                  <div key={field.fieldId}>
                                    <Label htmlFor={`participant-${index}-${field.fieldId}`}>
                                      {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </Label>
                                    <div className="mt-2">
                                      {field.type === 'select' ? (
                                        <Select
                                          value={participant.data[field.fieldId] || ''}
                                          onValueChange={(value) => handleParticipantSelectChange(index, field.fieldId, value)}
                                          disabled={loading}
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue placeholder={field.placeholder || `Pilih ${field.label}`} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {field.options?.map(option => (
                                              <SelectItem key={option} value={option}>
                                                {option}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : field.type === 'textarea' ? (
                                        <Textarea
                                          id={`participant-${index}-${field.fieldId}`}
                                          name={field.fieldId}
                                          placeholder={field.placeholder || field.label}
                                          value={participant.data[field.fieldId] || ''}
                                          onChange={(e) => handleParticipantInputChange(index, field.fieldId, e.target.value)}
                                          className="w-full min-h-[100px]"
                                          disabled={loading}
                                          required={field.required}
                                        />
                                      ) : (
                                        <Input
                                          id={`participant-${index}-${field.fieldId}`}
                                          name={field.fieldId}
                                          type={field.type}
                                          placeholder={field.placeholder || field.label}
                                          value={participant.data[field.fieldId] || ''}
                                          onChange={(e) => handleParticipantInputChange(index, field.fieldId, e.target.value)}
                                          className="w-full"
                                          disabled={loading}
                                          required={field.required}
                                        />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}

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
              </div>
            </Card>
          </div>

          {/* Summary Section */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-36">
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