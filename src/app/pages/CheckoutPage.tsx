import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft,
  Loader2,
  Copy,
  Users,
  BadgePercent,
  Info,
  Upload,
  Timer
} from 'lucide-react';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { Checkbox } from "@/app/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/app/components/ui/select";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { useAuth } from "@/app/contexts/AuthContext";
import type { Event, CustomField, FlashSale } from "@/app/types";
import { formatCurrency, formatDate, formatTime } from "@/app/utils/helpers";

import api, { uploadCustomFieldFile, formatAssetUrl } from "@/app/services/api";
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

  const [showGuestConfirmation, setShowGuestConfirmation] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({});
  
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [currentTimeTick, setCurrentTimeTick] = useState<Date>(new Date());

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ 
    code: string; 
    discount_amount: number; 
    type: string;
    affected_ticket_type_ids?: number[];
    is_global?: boolean;
    discount_value?: number;
    max_discount_amount?: number;
  } | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  
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

  useEffect(() => {
    if (!checkoutData?.event?.id) return;
    
    const fetchFlashSalesData = async () => {
      try {
        const response = await api.flashSales.getAll({ event_id: checkoutData.event.id });
        if (response.success && response.data) {
          setFlashSales(response.data);
        }
      } catch (e) {
        console.error('Error fetching rebutan kartcis:', e);
      }
    };
    fetchFlashSalesData();

    const timer = setInterval(() => setCurrentTimeTick(new Date()), 1000);
    return () => clearInterval(timer);
  }, [checkoutData?.event?.id]);

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



  const getActiveFlashSale = (ticketId: number) => {
    const currentHour = String(currentTimeTick.getHours()).padStart(2, '0');
    const currentMin = String(currentTimeTick.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHour}:${currentMin}`;
    
    // Get local date in YYYY-MM-DD
    const year = currentTimeTick.getFullYear();
    const month = String(currentTimeTick.getMonth() + 1).padStart(2, '0');
    const day = String(currentTimeTick.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;

    return flashSales.find(fs => {
       if (!fs.is_active || fs.ticket_type_id !== ticketId) return false;
       if (fs.sold >= fs.quota) return false;
       
       // Date check
       if (!fs.flash_date || fs.flash_date.split('T')[0] !== currentDate) return false;
       
       // Time check
       if (currentTime < fs.start_time || currentTime >= fs.end_time) return false;
       
       return true;
    });
  };

  const getCountdown = (endTime: string) => {
    const [endHour, endMin] = endTime.split(':').map(Number);
    const end = new Date(currentTimeTick);
    end.setHours(endHour, endMin, 0, 0);

    const diff = end.getTime() - currentTimeTick.getTime();
    if (diff <= 0) return '00:00:00';

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };


  const getTotalQuantity = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(selectedTickets).reduce((sum, [ticketId, quantity]) => {
      const ticket = event.ticket_types?.find(t => String(t.id) === ticketId);
      if (!ticket) return sum;
      
      const activeFS = getActiveFlashSale(ticket.id);
      const price = activeFS ? activeFS.flash_price : ticket.price;
      
      return sum + (price * quantity);
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

  const handleFileUpload = async (index: number, fieldName: string, file: File) => {
    setUploadProgress(prev => ({...prev, [`${index}-${fieldName}`]: true}));
    
    try {
      const url = await uploadCustomFieldFile(file);
      handleCustomFieldChange(index, fieldName, url);
      toast.success(`Berhasil mengunggah ${fieldName}`);
    } catch (error: any) {
       toast.error(error.message || 'Terjadi kesalahan saat mengunggah file');
    } finally {
       setUploadProgress(prev => ({...prev, [`${index}-${fieldName}`]: false}));
    }
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

  const getDiscountAmount = () => {
    if (!appliedVoucher) return 0;
    
    // If affected_ticket_type_ids is present, calculate discount specifically for those items
    if (appliedVoucher.affected_ticket_type_ids && !appliedVoucher.is_global) {
      let totalDiscount = 0;
      const affectedIds = appliedVoucher.affected_ticket_type_ids;

      Object.entries(selectedTickets).forEach(([ticketId, quantity]) => {
        if (affectedIds.includes(Number(ticketId))) {
          const ticket = event.ticket_types?.find(t => String(t.id) === ticketId);
          if (ticket) {
            const activeFS = getActiveFlashSale(ticket.id);
            const price = activeFS ? activeFS.flash_price : ticket.price;
            
            if (appliedVoucher.type === 'percent') {
              totalDiscount += (price * quantity * (appliedVoucher.discount_value || 0)) / 100;
            } else {
              // For fixed/nominal, we use the value as is if it's per ticket or we just return the stored amount
            }
          }
        }
      });

      if (appliedVoucher.type === 'percent' && appliedVoucher.max_discount_amount && totalDiscount > appliedVoucher.max_discount_amount) {
        return appliedVoucher.max_discount_amount;
      }
      
      return appliedVoucher.type === 'percent' ? totalDiscount : appliedVoucher.discount_amount;
    }

    return appliedVoucher.discount_amount;
  };

  const getTotalAmount = () => {
    return Math.max(0, getTotalPrice() + getAdminFee() - getDiscountAmount());
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error("Masukkan kode voucher terlebih dahulu");
      return;
    }

    // Get email of the primary participant or logged in user
    const email = participants[primaryContactIndex]?.data?.email || user?.email;
    if (!email) {
      toast.error("Mohon lengkapi email Peserta Utama terlebih dahulu untuk menggunakan voucher.");
      scrollToParticipant(primaryContactIndex);
      return;
    }
    
    setIsApplyingVoucher(true);
    try {
      // Send all selected ticket IDs
      const ticketTypeIds = Object.keys(selectedTickets);
      const uppercaseCode = voucherCode.trim().toUpperCase();
      const response = await api.vouchers.validate(uppercaseCode, event.id, ticketTypeIds, email, user?.id);
      
      if (response.success && response.data) {
        const data = response.data;
        let discount = 0;
        
        // Calculate discount based on affected items
        if (data.is_global) {
          if (data.discount_type === 'percent') {
            discount = (getTotalPrice() * data.discount_value) / 100;
            if (data.max_discount_amount && discount > data.max_discount_amount) {
              discount = data.max_discount_amount;
            }
          } else {
            discount = data.discount_value || data.discount_amount || 0;
          }
        } else if (data.affected_ticket_type_ids) {
          let affectedTotalPrice = 0;
          data.affected_ticket_type_ids.forEach((id: number) => {
            const qty = selectedTickets[String(id)] || 0;
            const ticket = event.ticket_types?.find(t => t.id === id);
            if (ticket && qty > 0) {
              const activeFS = getActiveFlashSale(ticket.id);
              const price = activeFS ? activeFS.flash_price : ticket.price;
              affectedTotalPrice += price * qty;
            }
          });

          if (data.discount_type === 'percent') {
            discount = (affectedTotalPrice * data.discount_value) / 100;
            if (data.max_discount_amount && discount > data.max_discount_amount) {
              discount = data.max_discount_amount;
            }
          } else {
            discount = data.discount_value || data.discount_amount || 0;
          }
        }

        const finalDiscount = data.discount_amount !== undefined ? data.discount_amount : discount;

        if (finalDiscount <= 0) {
            toast.error("Voucher ini tidak berlaku untuk tiket yang Anda pilih");
            return;
        }

        setAppliedVoucher({
          code: voucherCode.toUpperCase(),
          discount_amount: finalDiscount,
          type: data.discount_type,
          affected_ticket_type_ids: data.affected_ticket_type_ids,
          is_global: data.is_global,
          discount_value: data.discount_value,
          max_discount_amount: data.max_discount_amount
        });
        toast.success("Voucher berhasil diterapkan!");
      } else {
        if (response.message && response.message.includes("sudah pernah menggunakan voucher")) {
          toast.error("Maaf, voucher ini hanya dapat digunakan satu kali per pengguna.");
        } else {
          toast.error(response.message || "Kode Voucher tidak valid!");
        }
        setAppliedVoucher(null);
      }
    } catch (error) {
      toast.error("Gagal memvalidasi voucher");
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherCode("");
    setAppliedVoucher(null);
    toast.info("Voucher dilepas");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isAnyUploading = Object.values(uploadProgress).some(progress => progress);
    if (isAnyUploading) {
      toast.error('Mohon tunggu hingga semua file selesai diunggah.');
      return;
    }

    if (user && user.email_verified_at === null) {
      toast.error("Email Anda belum diverifikasi. Silakan verifikasi email Anda terlebih dahulu sebelum memesan tiket.", {
        duration: 5000,
      });
      return;
    }

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
        
        const participantTicketId = Number(participant.ticketId);
        const applicableFields = customFields.filter(f => !f.ticket_type_ids || f.ticket_type_ids.length === 0 || f.ticket_type_ids.includes(participantTicketId));

        // Validate custom fields
        for (const field of applicableFields) {
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

    if (!user) {
      setShowGuestConfirmation(true);
      return;
    }

    processCheckout();
  };

  const processCheckout = async () => {
    setLoading(true);

    try {
      // Group participants by ticket ID to construct nested attendees structure
      const itemsMap = new Map<number, any>();

      participants.forEach(p => {
        const ticketId = Number(p.ticketId);
        if (!itemsMap.has(ticketId)) {
           const ticket = event.ticket_types?.find(t => t.id === ticketId);
           const activeFS = getActiveFlashSale(ticketId);
           const price = activeFS ? activeFS.flash_price : (ticket?.price || 0);

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
             ticket_price: price,
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
        payment_method: 'FLIP',
        voucher_code: appliedVoucher?.code || "",
        customer_info: {
          name: participants[primaryContactIndex].data.fullName,
          email: participants[primaryContactIndex].data.email,
          phone: participants[primaryContactIndex].data.phone,
        }
      };

      const response = await api.orders.create(payload as any);

      if (response.success && response.data) {
        toast.success("Pesanan berhasil dibuat!");
        
        // Use payment_url from Flip if available
        if (response.data.payment_url) {
          let url = response.data.payment_url;
          // Ensure URL is absolute to prevent relative redirect issues
          if (!url.startsWith('http')) {
            url = 'https://' + url;
          }
          window.location.href = url;
        } else {
          const orderIdentifier = response.data.order_number || response.data.id;
          navigate(`/payment/${orderIdentifier}`);
        }
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

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 order-2 lg:order-1">
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
                                  {customFields
                                    .filter(f => !f.ticket_type_ids || f.ticket_type_ids.length === 0 || f.ticket_type_ids.includes(Number(participant.ticketId)))
                                    .map((field, fieldIdx) => (
                                  <div key={`field-${index}-${fieldIdx}`} className="space-y-3 col-span-1 md:col-span-2 bg-white/50 p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex flex-col gap-1">
                                      <Label htmlFor={`participant-${index}-custom-${field.name}`} className="text-gray-900 font-bold text-sm">
                                        {field.name} {field.required && <span className="text-red-500">*</span>}
                                      </Label>
                                      
                                      {field.description && (
                                        <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                          {field.description}
                                        </p>
                                      )}
                                    </div>

                                    {field.attachment_url && (
                                      <div className="flex flex-col gap-2">
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <div className="relative group cursor-zoom-in w-fit">
                                              <div className="overflow-hidden rounded-lg border-2 border-primary/20 shadow-sm group-hover:border-primary transition-all">
                                                <img 
                                                  src={formatAssetUrl(field.attachment_url)} 
                                                  alt={`Petunjuk ${field.name}`} 
                                                  className="h-24 md:h-32 w-auto object-cover bg-white group-hover:scale-105 transition-transform duration-300" 
                                                />
                                              </div>
                                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                                                <Info className="text-white opacity-0 group-hover:opacity-100 h-6 w-6" />
                                              </div>
                                            </div>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-transparent shadow-none">
                                            <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl">
                                              <DialogHeader className="p-4 border-b bg-gray-50/80 backdrop-blur-sm">
                                                <DialogTitle className="flex items-center gap-2 text-gray-900">
                                                  <Info className="h-5 w-5 text-primary" />
                                                  Petunjuk: {field.name}
                                                </DialogTitle>
                                              </DialogHeader>
                                              <div className="p-2 flex items-center justify-center bg-gray-100/50 min-h-[300px]">
                                                <img 
                                                  src={formatAssetUrl(field.attachment_url)} 
                                                  alt={`Petunjuk ${field.name} Full`} 
                                                  className="max-w-full max-h-[80vh] object-contain rounded-lg" 
                                                />
                                              </div>
                                              <div className="p-4 bg-gray-50 border-t text-xs text-center text-gray-400 font-medium">
                                                Gambar Petunjuk untuk Field {field.name}
                                              </div>
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                      </div>
                                    )}

                                    <div className="mt-1">
                                      {field.type === 'text' ? (
                                        <Input
                                          id={`participant-${index}-custom-${field.name}`}
                                          type="text"
                                          placeholder={`Masukkan ${field.name.toLowerCase()}`}
                                          value={participant.customFieldResponses[field.name] || ''}
                                          onChange={(e) => handleCustomFieldChange(index, field.name, e.target.value)}
                                          disabled={loading || uploadProgress[`${index}-${field.name}`]}
                                          required={field.required}
                                          className="h-10 border-gray-200 focus:border-primary bg-white"
                                        />
                                      ) : field.type === 'select' && field.options ? (
                                        <Select
                                          value={participant.customFieldResponses[field.name] || ''}
                                          onValueChange={(value) => handleCustomFieldChange(index, field.name, value)}
                                          disabled={loading}
                                        >
                                          <SelectTrigger className="h-10 w-full border-gray-200 bg-white">
                                            <SelectValue placeholder={`Pilih ${field.name}`} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {Array.from(new Set(field.options)).map((option, optIdx) => (
                                              <SelectItem key={`opt-${index}-${fieldIdx}-${optIdx}`} value={option}>
                                                {option}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                    ) : field.type === 'file' ? (
                                      <div className="space-y-3">
                                        <div className={`relative group w-full max-w-sm ${participant.customFieldResponses[field.name] && !uploadProgress[`${index}-${field.name}`] ? 'hidden' : 'block'}`}>
                                          <Input
                                            id={`participant-${index}-custom-${field.name}`}
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                handleFileUpload(index, field.name, file);
                                              }
                                            }}
                                            disabled={loading || uploadProgress[`${index}-${field.name}`]}
                                            required={field.required && !participant.customFieldResponses[field.name]}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                          />
                                          <div className={`p-4 flex items-center gap-4 bg-gray-50 border-2 border-dashed rounded-xl transition-all ${
                                            uploadProgress[`${index}-${field.name}`] ? 'border-primary bg-primary/5' : 'border-gray-300 group-hover:border-primary group-hover:bg-primary-light/10'
                                          }`}>
                                            <div className="flex-shrink-0">
                                              <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                                                uploadProgress[`${index}-${field.name}`] ? 'bg-primary text-white' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors'
                                              }`}>
                                                {uploadProgress[`${index}-${field.name}`] ? (
                                                  <Loader2 className="h-6 w-6 animate-spin" />
                                                ) : (
                                                  <Upload className="h-5 w-5" />
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-sm font-bold text-gray-700">
                                                {uploadProgress[`${index}-${field.name}`] ? 'Sedang Mengunggah...' : 'Pilih Bukti Gambar'}
                                              </span>
                                              <span className="text-xs text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Format: JPG, PNG, WEBP</span>
                                            </div>
                                          </div>
                                        </div>

                                        {participant.customFieldResponses[field.name] && !uploadProgress[`${index}-${field.name}`] ? (
                                          <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 w-full max-w-sm group">
                                            <img 
                                              src={formatAssetUrl(participant.customFieldResponses[field.name])} 
                                              alt="Preview Upload" 
                                              className="w-full h-48 object-cover object-center" 
                                            />
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 flex justify-between items-center transition-opacity">
                                              <a 
                                                href={formatAssetUrl(participant.customFieldResponses[field.name])} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-xs text-white hover:text-primary-light underline font-medium truncate max-w-[70%]"
                                              >
                                                Lihat File Full Size
                                              </a>
                                            </div>
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                              <Label 
                                                htmlFor={`participant-${index}-custom-${field.name}-replace`}
                                                className="text-sm font-semibold text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-lg border border-white/50"
                                              >
                                                Ganti Gambar
                                              </Label>
                                              <Input
                                                id={`participant-${index}-custom-${field.name}-replace`}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    handleFileUpload(index, field.name, file);
                                                  }
                                                }}
                                                disabled={loading || uploadProgress[`${index}-${field.name}`]}
                                                className="hidden"
                                              />
                                            </div>
                                          </div>
                                        ) : null}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary-hover mt-4"
                    size="lg"
                    disabled={loading || Object.values(uploadProgress).some(Boolean)}
                  >
                    {loading ? (
                       <>
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         Memproses...
                       </>
                     ) : (
                       'Bayar via Flip'
                     )}
                  </Button>
                </form>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1 order-1 lg:order-2">
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
                  
                  const activeFS = getActiveFlashSale(ticket.id);
                  const price = activeFS ? activeFS.flash_price : ticket.price;

                  const isVoucherAffected = appliedVoucher?.affected_ticket_type_ids?.includes(Number(ticketId)) || appliedVoucher?.is_global;
                  let itemDiscountedPrice = price;
                  
                  if (appliedVoucher && isVoucherAffected) {
                    if (appliedVoucher.type === 'percent') {
                      itemDiscountedPrice = price * (1 - (appliedVoucher.discount_value || 0) / 100);
                    }
                  }

                  const basePriceForStrike = activeFS ? ticket.price : price;
                  const hasDiscount = activeFS || (isVoucherAffected && itemDiscountedPrice < price);

                  return (
                    <div key={ticketId} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex flex-col text-sm">
                         <div className="flex items-center gap-2 font-medium">
                            <span className="text-gray-800">{ticket.name}</span>
                            {isVoucherAffected && appliedVoucher?.type === 'percent' && (
                              <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                {appliedVoucher.discount_value}% OFF
                              </span>
                            )}
                         </div>
                         <span className="text-gray-500 text-xs">
                           {quantity} tiket × {formatCurrency(price)}
                         </span>
                         {activeFS && (
                           <div className="flex items-center gap-1 mt-1 text-red-600 text-[10px] font-medium leading-none">
                             <Timer className="h-2.5 w-2.5" /> 
                             Rebutan Kartcis ({getCountdown(activeFS.end_time)})
                           </div>
                         )}
                      </div>
                      <div className="flex flex-col items-end">
                        {hasDiscount && (
                          <span className="text-xs text-gray-400 line-through mb-0.5">
                            {formatCurrency(basePriceForStrike * quantity)}
                          </span>
                        )}
                        <span className="font-semibold text-primary">
                          {formatCurrency(itemDiscountedPrice * quantity)}
                        </span>
                      </div>
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
                 {appliedVoucher && (
                   <div className="flex justify-between items-center text-sm text-green-600 font-medium">
                      <span>Voucher ({appliedVoucher.code})</span>
                      <span>-{formatCurrency(appliedVoucher.discount_amount)}</span>
                   </div>
                 )}
              </div>

              <Separator className="my-4" />

              {/* Voucher Input Section */}
              <div className="mb-4">
                <Label className="text-sm font-semibold mb-2 block">Kode Voucher</Label>
                {!appliedVoucher ? (
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Masukkan kode promo" 
                      value={voucherCode} 
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      className="uppercase"
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleApplyVoucher}
                      disabled={isApplyingVoucher || !voucherCode.trim()}
                      className="border-primary text-primary hover:bg-primary-light"
                    >
                      {isApplyingVoucher ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Terapkan'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <BadgePercent className="h-5 w-5" />
                      <div>
                         <p className="font-bold text-sm tracking-wide">{appliedVoucher.code}</p>
                         <p className="text-xs">Voucher berhasil dipakai</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleRemoveVoucher} className="text-green-700 hover:text-green-800 hover:bg-green-100 h-8">
                      Hapus
                    </Button>
                  </div>
                )}
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
 
               {/* Mobile Payment Info & Button */}
               
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={showGuestConfirmation} onOpenChange={setShowGuestConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lanjutkan Tanpa Login?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda saat ini belum login. Tiket akan dikirimkan ke email <strong>{participants[primaryContactIndex]?.data?.email}</strong>. 
              Pastikan email tersebut aktif dan penulisan tidak salah.
              <br /><br />
              Atau, Anda bisa kembali ke halaman sebelumnya untuk <strong>Login</strong> agar tiket tersimpan di dashboard akun Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Periksa Kembali</AlertDialogCancel>
            <AlertDialogAction onClick={processCheckout}>Lanjutkan Beli Tiket</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}