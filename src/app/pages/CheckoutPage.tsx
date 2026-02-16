import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft,
  Loader2,
  Copy,
  Users
} from 'lucide-react';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { Checkbox } from "@/app/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";
import type { Event, CustomField } from "@/app/types";
import { formatCurrency, formatDate, formatTime } from "@/app/utils/helpers";
import { PaymentMethodSelection } from "@/app/components/PaymentMethodSelection";
import api from "@/app/services/api";
import { pendingOrderStorage } from "@/app/utils/pendingOrderStorage";

interface CheckoutState {
  event: Event;
  selectedTickets: Record<string, number>;
}

interface ParticipantData {
  ticketId: string;
  ticketName: string;
  isSameAsBuyer: boolean;
  data: Record<string, string>;
  customFieldResponses: Record<string, string>;
}

export function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const locationState = location.state as CheckoutState | null;
  
  // Save state to component state to prevent loss
  const [checkoutData, setCheckoutData] = useState<CheckoutState | null>(null);
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [primaryContactIndex, setPrimaryContactIndex] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('MANUAL_JAGO');
  
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
              email: user.email,
              phone: user.phone || ''
            }
          };
        }
        return updated;
      });
    }
  }, [user, participants.length, primaryContactIndex]);

  // Initialize participants based on selected tickets - RUN ONCE
  useEffect(() => {
    if (!locationState || !locationState.event || !locationState.selectedTickets) {
      return;
    }

    const participantsList: ParticipantData[] = [];
    Object.entries(locationState.selectedTickets).forEach(([ticketId, quantity]) => {
      const ticket = locationState.event.ticket_types?.find((t: any) => String(t.id) === ticketId);
      if (!ticket) {
        return;
      }

      // Create a participant entry for each ticket
      for (let i = 0; i < quantity; i++) {
        participantsList.push({
          ticketId,
          ticketName: ticket.name,
          isSameAsBuyer: false,
          data: {},
          customFieldResponses: {}
        });
      }
    });

    setParticipants(participantsList);
    setCheckoutData(locationState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initialize ONLY ONCE on mount

  useEffect(() => {
    // Check if there's an active pending order
    const activePendingOrder = pendingOrderStorage.getActive();
    if (activePendingOrder) {
      toast.info("Anda memiliki pesanan yang belum diselesaikan");
      navigate(`/payment/${activePendingOrder.orderId}`);
      return;
    }

    // Redirect if no state - CHECK ONLY ONCE on mount
    if (!locationState || !locationState.event || !locationState.selectedTickets) {
      toast.error("Silakan pilih tiket terlebih dahulu");
      navigate('/');
      return;
    }

    // Check if selectedTickets is actually populated
    const hasTickets = Object.keys(locationState.selectedTickets).length > 0;
    if (!hasTickets) {
      toast.error("Silakan pilih tiket terlebih dahulu");
      navigate('/');
      return;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Parse custom fields from event
  useEffect(() => {
    if (!checkoutData?.event?.custom_fields) return;

    try {
      const parsed = JSON.parse(checkoutData.event.custom_fields);
      if (Array.isArray(parsed)) {
        setCustomFields(parsed);
      }
    } catch (error) {
      console.error('Failed to parse custom fields:', error);
    }
  }, [checkoutData?.event?.custom_fields]);

  if (!checkoutData || !checkoutData.event || !checkoutData.selectedTickets) {
    return null;
  }

  const { event, selectedTickets } = checkoutData;

  // Show loading while participants are being initialized
  if (participants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTotalQuantity = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(selectedTickets).reduce((sum, [ticketId, quantity]) => {
      const ticket = event.ticket_types?.find(t => String(t.id) === ticketId);
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

  const handleCustomFieldChange = (index: number, fieldName: string, value: string) => {
    setParticipants(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        customFieldResponses: {
          ...updated[index].customFieldResponses,
          [fieldName]: value
        }
      };
      return updated;
    });
  };

  const applyToAll = () => {
    const firstParticipantData = participants[0]?.data;
    if (!firstParticipantData || !firstParticipantData.fullName) {
      toast.error("Isi data Peserta 1 terlebih dahulu");
      return;
    }

    setParticipants(prev => {
      return prev.map((p, idx) => {
        if (idx === 0) return p;
        return {
          ...p,
          data: {
            ...p.data,
            fullName: firstParticipantData.fullName,
            email: firstParticipantData.email,
            phone: firstParticipantData.phone
          }
        };
      });
    });
    toast.success("Data Peserta 1 diterapkan ke semua peserta");
  };

  const getAdminFee = () => {
    // Default 5% if not specified
    const percentage = event.fee_percentage !== undefined ? event.fee_percentage : 5;
    return (getTotalPrice() * percentage) / 100;
  };

  const getTotalAmount = () => {
    return getTotalPrice() + getAdminFee();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For multiple tickets, validate participant data
    if (!isSingleTicket) {
      // First, validate basic required fields
      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        
        // Check basic participant fields
        if (!participant.data.fullName?.trim()) {
          toast.error(`Peserta ${i + 1}: Nama lengkap wajib diisi`);
          scrollToParticipant(i);
          return;
        }
        
        if (!participant.data.email?.trim() || !participant.data.email.includes('@')) {
          toast.error(`Peserta ${i + 1}: Email tidak valid`);
          scrollToParticipant(i);
          return;
        }
        
        if (!participant.data.phone?.trim()) {
          toast.error(`Peserta ${i + 1}: Nomor telepon wajib diisi`);
          scrollToParticipant(i);
          return;
        }
        
        // Validate custom fields
        for (const field of customFields) {
          if (field.required) {
            const value = participant.customFieldResponses[field.name];
            if (!value || !value.trim()) {
              toast.error(`Peserta ${i + 1}: ${field.name} wajib diisi`);
              scrollToParticipant(i);
              return;
            }
          }
        }
      }
    }

    setLoading(true);

    try {
      // Group participants by ticket ID to construct nested attendees structure
      const itemsMap = new Map<number, any>();

      participants.forEach(p => {
        const ticketId = Number(p.ticketId);
        if (!itemsMap.has(ticketId)) {
           const ticket = event.ticket_types?.find(t => t.id === ticketId);
           itemsMap.set(ticketId, {
             ticket_type_id: ticketId,
             quantity: 0,
             attendees: [],
              // Add other cart item props if backend strictly requires them in 'items' root
              // But strictly speaking CheckoutRequest type only enforced nested structure.
              // We'll keep extra props if originally sent to be safe or if backend uses them for email rendering not from DB.
             event_id: event.id,
             event_title: event.title,
             event_date: event.date,
             event_time: event.time || '00:00:00',
             event_image: event.image || '',
             ticket_type_name: ticket?.name || '',
             ticket_price: ticket?.price || 0,
           });
        }
        
        const item = itemsMap.get(ticketId);
        item.quantity += 1;
        item.attendees.push({
          name: p.data.fullName,
          email: p.data.email,
          phone: p.data.phone,
          custom_field_responses: Object.keys(p.customFieldResponses).length > 0 
            ? JSON.stringify(p.customFieldResponses) 
            : undefined
        });
      });

      const items = Array.from(itemsMap.values());

      const payload = {
        items,
        payment_method: paymentMethod,
        customer_info: {
          name: participants[primaryContactIndex].data.fullName,
          email: participants[primaryContactIndex].data.email,
          phone: participants[primaryContactIndex].data.phone,
        }
      };

      const response = await api.orders.create(payload as any);

      if (response.success && response.data) {
        toast.success("Pesanan berhasil dibuat!");
        const orderIdentifier = response.data.order_number || response.data.id;
        navigate(`/payment/${orderIdentifier}`);
      } else {
        throw new Error(response.message || "Gagal membuat pesanan");
      }
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || "Terjadi kesalahan saat memproses pesanan");
    } finally {
      setLoading(false);
    }
  };

  const totalQuantity = getTotalQuantity();
  const totalPrice = getTotalPrice();
  const adminFee = getAdminFee();
  const totalAmount = getTotalAmount();
  const isSingleTicket = totalQuantity === 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
           {/* ... Navbar content ... */}
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
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Peserta</h2>
                    {!isSingleTicket && (
                      <p className="text-sm text-gray-600">
                        Pilih salah satu peserta sebagai <strong>Contact Person Utama</strong>
                      </p>
                    )}
                  </div>
                  {!isSingleTicket && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={applyToAll}
                        className="text-primary border-primary hover:bg-primary-light gap-2"
                    >
                        <Copy className="h-4 w-4" />
                        Gunakan data yang sama untuk semua
                    </Button>
                  )}
                </div>
              
                <form onSubmit={handleSubmit} className="space-y-6">
                  {participants.length > 0 && (
                    <div className="space-y-6">
                      {participants.map((participant, index) => (
                        <div 
                          key={index} 
                          ref={(el) => { participantRefs.current[index] = el; }}
                        >
                          <Card 
                            className={`p-4 border-2 transition-all ${primaryContactIndex === index ? 'border-primary bg-primary-light shadow-md' : 'bg-gray-50 border-gray-200'}`}
                          >
                            {/* ... Participant inputs ... */}
                            <div className="flex items-center gap-3 mb-4">
                              {!isSingleTicket && (
                                <Checkbox
                                  id={`primary-${index}`}
                                  checked={primaryContactIndex === index}
                                  onCheckedChange={() => setPrimaryContactIndex(index)}
                                />
                              )}
                              <label htmlFor={`primary-${index}`} className="font-semibold text-lg text-gray-900 cursor-pointer flex items-center gap-2">
                                <Users className="h-5 w-5 text-gray-400" />
                                Peserta {index + 1} - {participant.ticketName}
                                {primaryContactIndex === index && !isSingleTicket && (
                                  <span className="ml-2 text-sm font-normal text-primary">(CP Utama)</span>
                                )}
                              </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`participant-${index}-fullName`}>
                                  Nama Lengkap <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`participant-${index}-fullName`}
                                  type="text"
                                  placeholder="Masukkan nama lengkap peserta"
                                  value={participant.data.fullName || ''}
                                  onChange={(e) => handleParticipantInputChange(index, 'fullName', e.target.value)}
                                  disabled={loading}
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`participant-${index}-email`}>
                                  Email <span className="text-red-500">*</span>
                                  {primaryContactIndex === index && !isSingleTicket && (
                                    <span className="text-xs font-normal text-primary ml-1">(CP)</span>
                                  )}
                                </Label>
                                <Input
                                  id={`participant-${index}-email`}
                                  type="email"
                                  placeholder="email@example.com"
                                  value={participant.data.email || ''}
                                  onChange={(e) => handleParticipantInputChange(index, 'email', e.target.value)}
                                  disabled={loading}
                                  required
                                />
                              </div>

                              <div className="space-y-2 col-span-1 md:col-span-2">
                                <Label htmlFor={`participant-${index}-phone`}>
                                  Nomor Telepon <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`participant-${index}-phone`}
                                  type="tel"
                                  placeholder="08123456789"
                                  value={participant.data.phone || ''}
                                  onChange={(e) => handleParticipantInputChange(index, 'phone', e.target.value)}
                                  disabled={loading}
                                  required
                                />
                              </div>

                              {/* Custom Fields */}
                              {customFields.length > 0 && customFields.map((field) => (
                                <div key={field.name} className="space-y-2 col-span-1 md:col-span-2">
                                  <Label htmlFor={`participant-${index}-custom-${field.name}`}>
                                    {field.name} {field.required && <span className="text-red-500">*</span>}
                                  </Label>
                                  {field.type === 'text' ? (
                                    <Input
                                      id={`participant-${index}-custom-${field.name}`}
                                      type="text"
                                      placeholder={`Masukkan ${field.name.toLowerCase()}`}
                                      value={participant.customFieldResponses[field.name] || ''}
                                      onChange={(e) => handleCustomFieldChange(index, field.name, e.target.value)}
                                      disabled={loading}
                                      required={field.required}
                                    />
                                  ) : field.type === 'select' && field.options ? (
                                    <select
                                      id={`participant-${index}-custom-${field.name}`}
                                      value={participant.customFieldResponses[field.name] || ''}
                                      onChange={(e) => handleCustomFieldChange(index, field.name, e.target.value)}
                                      disabled={loading}
                                      required={field.required}
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <option value="">Pilih {field.name}</option>
                                      {field.options.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  <PaymentMethodSelection
                    selectedMethod={paymentMethod}
                    onSelectMethod={setPaymentMethod}
                    disabled={loading}
                  />

                  <Separator />

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary-hover"
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

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-36">
              <h2 className="text-2xl font-bold mb-4">Ringkasan Pesanan</h2>

              <div className="mb-4">
                <img 
                  src={event.image || ''} 
                  alt={event.title}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <h3 className="text-xl font-semibold">{event.title}</h3>
                <div className="text-gray-600 mt-1 text-base space-y-1">
                  <p>{formatDate(event.event_date)} · {formatTime(event.event_time ??'')}</p>
                  <p>{event.venue}, {event.city}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3 mb-4">
                {Object.entries(selectedTickets).map(([ticketId, quantity]) => {
                  const ticket = event.ticket_types?.find((t: any) => String(t.id) === ticketId);
                  if (!ticket) return null;
                  const price = ticket.price;

                  return (
                    <div key={ticketId} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <span className="text-gray-600 text-sm">
                        {ticket.name} × {quantity}
                      </span>
                      <span className="font-semibold text-primary-hover">
                        {formatCurrency(price * quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <div className="space-y-2 mb-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal Tiket</span>
                    <span className="font-medium text-gray-900">{formatCurrency(totalPrice)}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Biaya Layanan ({event.fee_percentage || 5}%)</span>
                    <span className="font-medium text-gray-900">{formatCurrency(adminFee)}</span>
                 </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 bg-primary-light p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Tiket:</span>
                  <span className="font-semibold">{totalQuantity}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total Bayar:</span>
                  <span className="text-primary">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}