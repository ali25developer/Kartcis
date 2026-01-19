import { useState, useMemo, useEffect, useRef } from "react";
import { ShoppingCart, User, Search, LogOut, Ticket, Menu, X, Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { EventCard } from "./components/EventCard";
import { EventDetail } from "./components/EventDetail";
import { Cart, CartItem } from "./components/Cart";
import { Checkout } from "./components/Checkout";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { MyTickets } from "./components/MyTickets";
import { VirtualAccountDetail } from "./components/VirtualAccountDetail";
import { HelpModal } from "./components/HelpModal";
import { PaymentSuccess } from "./components/PaymentSuccess";
import { Header } from "./components/Header";
import { SponsorSection } from "./components/SponsorSection";
import { Toaster } from "./components/ui/sonner";
import { toast } from "@/app/utils/toast";
import { useAuth } from "./contexts/AuthContext";
import { useCart } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { EventsProvider } from "./contexts/EventsContext";
import { CartProvider } from "./contexts/CartContext";
import { eventService, api } from "./services/api";
import type { Event, TicketType, PurchasedTicket, HelpModalType } from "./types";
import { pendingOrderStorage, type PendingOrder } from "./utils/pendingOrderStorage";

function AppContent() {
  const { isAuthenticated, logout } = useAuth();
  const { items: cartItems, itemCount, addItem, updateQuantity, removeItem, clearCart } = useCart();

  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<string[]>(['Semua']);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [purchasedTickets, setPurchasedTickets] = useState<PurchasedTicket[]>([
    // Upcoming Event 1
    {
      id: 'ticket-001',
      eventId: '1', // Jakarta Marathon
      eventTitle: 'Jakarta Marathon 2026',
      eventDate: '2026-03-15',
      eventTime: '05:00',
      venue: 'Monas',
      city: 'Jakarta',
      ticketType: '10K Race',
      quantity: 2,
      price: 180000,
      eventImage: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800',
      orderDate: '2026-01-05T10:30:00Z',
      ticketCode: 'KARTCIS-JKM2026-A1',
      eventStatus: 'active',
    },
    // Upcoming Event 2
    {
      id: 'ticket-002',
      eventId: '8', // Jazz Festival Jakarta
      eventTitle: 'Jazz Festival Jakarta 2026',
      eventDate: '2026-04-20',
      eventTime: '18:00',
      venue: 'JCC Senayan',
      city: 'Jakarta',
      ticketType: 'VIP',
      quantity: 1,
      price: 750000,
      eventImage: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800',
      orderDate: '2026-01-10T14:20:00Z',
      ticketCode: 'KARTCIS-JZF2026-V3',
      eventStatus: 'active',
    },
    // Past Event 1
    {
      id: 'ticket-003',
      eventId: '11', // Digital Marketing Workshop
      eventTitle: 'Digital Marketing Workshop',
      eventDate: '2025-12-10',
      eventTime: '09:00',
      venue: 'Kota Kasablanka',
      city: 'Jakarta',
      ticketType: 'Regular',
      quantity: 1,
      price: 350000,
      eventImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      orderDate: '2025-12-01T08:15:00Z',
      ticketCode: 'KARTCIS-DMW2025-R8',
      eventStatus: 'active',
    },
    // Past Event 2
    {
      id: 'ticket-004',
      eventId: '14', // Bali Food Festival
      eventTitle: 'Bali Food Festival',
      eventDate: '2025-11-20',
      eventTime: '16:00',
      venue: 'Pantai Kuta',
      city: 'Bali',
      ticketType: 'Early Bird',
      quantity: 2,
      price: 150000,
      eventImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
      orderDate: '2025-11-01T16:45:00Z',
      ticketCode: 'KARTCIS-BFF2025-E2',
      eventStatus: 'active',
    },
    // Cancelled Event
    {
      id: 'ticket-005',
      eventId: '16', // Bandung Coffee & Music Fest
      eventTitle: 'Bandung Coffee & Music Fest',
      eventDate: '2026-02-25',
      eventTime: '10:00',
      venue: 'Gedung Sate',
      city: 'Bandung',
      ticketType: 'Regular Entry',
      quantity: 2,
      price: 75000,
      eventImage: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800',
      orderDate: '2026-01-08T12:00:00Z',
      ticketCode: 'KARTCIS-BCM2026-R5',
      eventStatus: 'cancelled',
      cancelReason: 'Event dibatalkan karena renovasi venue yang tidak terduga. Dana akan dikembalikan 100% dalam 7 hari kerja ke metode pembayaran Anda.',
    },
  ]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMyTicketsOpen, setIsMyTicketsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isVADetailOpen, setIsVADetailOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const bannerScrollRef = useRef<HTMLDivElement>(null);
  const [currentBannerSlide, setCurrentBannerSlide] = useState(0);
  const [isBannerAutoPlaying, setIsBannerAutoPlaying] = useState(true);
  const bannerAutoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [helpModalType, setHelpModalType] = useState<HelpModalType | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [isPaymentSuccessOpen, setIsPaymentSuccessOpen] = useState(false);
  const [successOrderDetails, setSuccessOrderDetails] = useState<any>(null);
  const [pendingOrderTimeLeft, setPendingOrderTimeLeft] = useState<number>(0);

  // Load pending order from localStorage on mount (for all users)
  useEffect(() => {
    const activePendingOrder = pendingOrderStorage.getActive();
    if (activePendingOrder) {
      setPendingOrder(activePendingOrder);
      // Calculate time left
      const timeLeft = Math.floor((activePendingOrder.expiryTime - Date.now()) / 1000);
      setPendingOrderTimeLeft(timeLeft > 0 ? timeLeft : 0);
    }
  }, []);

  // Countdown timer for pending order
  useEffect(() => {
    if (!pendingOrder || pendingOrderTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setPendingOrderTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          // Order expired
          pendingOrderStorage.updateStatus(pendingOrder.orderId, 'expired');
          setPendingOrder(null);
          toast.error('Waktu pembayaran habis', {
            description: 'Silakan buat pesanan baru',
            action: {
              label: 'Tutup',
              onClick: () => {},
            },
          });
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingOrder, pendingOrderTimeLeft]);

  // When user logs out, keep showing their pending order if exists
  useEffect(() => {
    if (!isAuthenticated) {
      const activePendingOrder = pendingOrderStorage.getActive();
      if (activePendingOrder) {
        setPendingOrder(activePendingOrder);
      }
    }
  }, [isAuthenticated]);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate total pages (1 card per page on mobile, 3 on desktop)
  const cardsPerPage = isMobile ? 1 : 3;
  const totalPages = Math.ceil(featuredEvents.length / cardsPerPage);

  // Debounce search query
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Auto-slide for featured events
  useEffect(() => {
    if (!isAutoPlaying || totalPages === 0) return;

    autoPlayIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % totalPages;
        scrollToSlide(next);
        return next;
      });
    }, 4000); // Change slide every 4 seconds

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [isAutoPlaying, totalPages]);

  // Auto-slide for banners
  useEffect(() => {
    if (!isBannerAutoPlaying) return;

    bannerAutoPlayIntervalRef.current = setInterval(() => {
      setCurrentBannerSlide((prev) => {
        const next = (prev + 1) % 2; // 2 banners total
        scrollToBannerSlide(next);
        return next;
      });
    }, 5000); // Change banner every 5 seconds

    return () => {
      if (bannerAutoPlayIntervalRef.current) {
        clearInterval(bannerAutoPlayIntervalRef.current);
      }
    };
  }, [isBannerAutoPlaying]);

  const scrollToSlide = (pageIndex: number) => {
    if (scrollContainerRef.current) {
      const cardWidth = 360; // card width
      const gap = 24; // gap between cards
      const pageWidth = (cardWidth + gap) * cardsPerPage;
      scrollContainerRef.current.scrollTo({
        left: pageIndex * pageWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleSlideClick = (pageIndex: number) => {
    setCurrentSlide(pageIndex);
    scrollToSlide(pageIndex);
    // Pause auto-play when user manually clicks
    setIsAutoPlaying(false);
    // Resume after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const cardWidth = 360;
      const gap = 24;
      const pageWidth = (cardWidth + gap) * cardsPerPage;
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const newIndex = Math.round(scrollLeft / pageWidth);
      
      if (newIndex !== currentSlide && newIndex >= 0 && newIndex < totalPages) {
        setCurrentSlide(newIndex);
        // Pause auto-play when user manually scrolls
        setIsAutoPlaying(false);
        // Resume after 10 seconds
        setTimeout(() => setIsAutoPlaying(true), 10000);
      }
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const newScrollPosition = direction === 'left'
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollToBannerSlide = (slideIndex: number) => {
    if (bannerScrollRef.current) {
      const container = bannerScrollRef.current;
      const bannerWidth = container.offsetWidth;
      container.scrollTo({
        left: slideIndex * bannerWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleBannerSlideClick = (slideIndex: number) => {
    setCurrentBannerSlide(slideIndex);
    scrollToBannerSlide(slideIndex);
    // Pause auto-play when user manually clicks
    setIsBannerAutoPlaying(false);
    // Resume after 10 seconds
    setTimeout(() => setIsBannerAutoPlaying(true), 10000);
  };

  const handleBannerScroll = () => {
    if (bannerScrollRef.current) {
      const container = bannerScrollRef.current;
      const bannerWidth = container.offsetWidth;
      const scrollLeft = container.scrollLeft;
      const newIndex = Math.round(scrollLeft / bannerWidth);
      
      if (newIndex !== currentBannerSlide && newIndex >= 0 && newIndex < 2) {
        setCurrentBannerSlide(newIndex);
        // Pause auto-play when user manually scrolls
        setIsBannerAutoPlaying(false);
        // Resume after 10 seconds
        setTimeout(() => setIsBannerAutoPlaying(true), 10000);
      }
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await eventService.getAll();
      setEvents(response.events);
      setCategories(['Semua', ...response.categories.map(c => c.name)]);
      setFeaturedEvents(response.featuredEvents);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Gagal memuat event', {
        action: {
          label: 'Tutup',
          onClick: () => {},
        },
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (selectedCategory !== "Semua") {
      filtered = filtered.filter(
        (event) => event.category === selectedCategory,
      );
    }

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.organizer.toLowerCase().includes(query) ||
          event.venue.toLowerCase().includes(query) ||
          event.city.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [events, selectedCategory, debouncedSearchQuery]);

  const handleAddToCart = (
    eventId: string,
    ticketTypeId: string,
    quantity: number,
  ) => {
    const event = events.find((e) => e.id === eventId);
    const ticketType = event?.ticketTypes.find(
      (t) => t.id === ticketTypeId,
    );

    if (!event || !ticketType) return;

    addItem({
      event_id: parseInt(eventId),
      ticket_type_id: parseInt(ticketTypeId),
      quantity,
      event_title: event.title,
      event_date: event.date,
      event_time: event.time,
      event_image: event.image,
      ticket_type_name: ticketType.name,
      ticket_price: ticketType.price,
    });

    toast.success("Berhasil ditambahkan ke keranjang!", {
      action: {
        label: "Tutup",
        onClick: () => {},
      },
    });
    setSelectedEvent(null);
  };

  const handleUpdateCartQuantity = (
    eventId: string,
    ticketTypeId: string,
    newQuantity: number,
  ) => {
    updateQuantity(parseInt(eventId), parseInt(ticketTypeId), newQuantity);
  };

  const handleRemoveFromCart = (
    eventId: string,
    ticketTypeId: string,
  ) => {
    removeItem(parseInt(eventId), parseInt(ticketTypeId));
    toast.info("Item dihapus dari keranjang", {
      action: {
        label: "Tutup",
        onClick: () => {},
      },
    });
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleShowVirtualAccount = async (
    bank: string, 
    amount: number, 
    customerInfo: { name: string; email: string; phone: string }
  ) => {
    try {
      // Create order via API
      const response = await api.orders.create({
        items: cartItems,
        payment_method: bank,
        customer_info: customerInfo,
      });

      if (response.success && response.data) {
        setCurrentOrder(response.data);
        
        // Save to localStorage for pending order tracking
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
        const pendingOrderData: PendingOrder = {
          orderId: response.data.order_number,
          vaNumber: response.data.payment_details?.va_number || '',
          bank: bank,
          amount: amount,
          expiryTime: expiryTime,
          createdAt: Date.now(),
          orderDetails: {
            items: cartItems.map(item => ({
              eventTitle: item.event_title,
              ticketType: item.ticket_type_name,
              quantity: item.quantity,
              price: item.ticket_price,
              eventImage: item.event_image,
            })),
            customerInfo: customerInfo,
          },
          status: 'pending',
        };
        
        pendingOrderStorage.add(pendingOrderData);
        setPendingOrder(pendingOrderData);
        
        // Calculate and set time left
        const timeLeft = Math.floor((expiryTime - Date.now()) / 1000);
        setPendingOrderTimeLeft(timeLeft);
        
        setIsCheckoutOpen(false);
        setIsVADetailOpen(true);
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error('Gagal membuat pesanan', {
        action: {
          label: 'Tutup',
          onClick: () => {},
        },
      });
    }
  };

  const handleChangePaymentMethod = () => {
    // Restore cart items from pending order if cart is empty
    if (pendingOrder && cartItems.length === 0) {
      // Need to reconstruct cart items from pending order
      pendingOrder.orderDetails.items.forEach((item) => {
        // Find the event to get event_id and ticket_type_id
        const event = events.find(e => e.title === item.eventTitle);
        if (event) {
          const ticketType = event.ticketTypes.find(t => t.name === item.ticketType);
          if (ticketType) {
            addItem({
              event_id: parseInt(event.id),
              ticket_type_id: parseInt(ticketType.id),
              quantity: item.quantity,
              event_title: item.eventTitle,
              event_date: event.date,
              event_time: event.time,
              event_image: item.eventImage,
              ticket_type_name: item.ticketType,
              ticket_price: item.price,
            });
          }
        }
      });
    }
    
    setIsVADetailOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleVAComplete = () => {
    handleCheckoutComplete();
    setIsVADetailOpen(false);
  };

  const handleCheckoutComplete = () => {
    // Only save to "Tiket Saya" if user is logged in
    if (isAuthenticated) {
      // Convert cart items to tickets for V44 compatibility
      const newTickets: PurchasedTicket[] = cartItems.map((item, index) => {
        const event = events.find((e) => e.id === item.event_id.toString());
        return {
          id: `ticket-${Date.now()}-${index}`,
          eventTitle: item.event_title,
          eventDate: item.event_date,
          eventTime: item.event_time || "19:00",
          venue: event?.venue || "",
          city: event?.city || "",
          ticketType: item.ticket_type_name,
          quantity: item.quantity,
          price: item.ticket_price,
          eventImage: item.event_image,
          orderDate: new Date().toISOString(),
          ticketCode: `KARTCIS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        };
      });

      setPurchasedTickets([...purchasedTickets, ...newTickets]);
      toast.success("Tiket berhasil dibeli! Lihat di menu Tiket Saya", {
        action: {
          label: "Tutup",
          onClick: () => {},
        },
      });
    } else {
      // For non-logged in users, show toast to check email
      toast.success("Pembayaran berhasil!", {
        description: "E-ticket akan dikirim ke email Anda dalam beberapa menit.",
        action: {
          label: "Tutup",
          onClick: () => {},
        },
      });
    }
    
    clearCart();
    setIsCheckoutOpen(false);
  };

  const handlePaymentSuccess = () => {
    if (!pendingOrder) return;
    
    // Update status to paid
    pendingOrderStorage.updateStatus(pendingOrder.orderId, 'paid');
    
    // Prepare success details
    const successDetails = {
      orderId: pendingOrder.orderId,
      items: pendingOrder.orderDetails.items,
      customerInfo: pendingOrder.orderDetails.customerInfo,
      totalAmount: pendingOrder.amount,
    };
    
    setSuccessOrderDetails(successDetails);
    
    // If logged in, add to purchased tickets
    if (isAuthenticated) {
      const newTickets: PurchasedTicket[] = pendingOrder.orderDetails.items.map((item, index) => ({
        id: `ticket-${Date.now()}-${index}`,
        eventTitle: item.eventTitle,
        eventDate: new Date().toISOString().split('T')[0],
        eventTime: '19:00',
        venue: '',
        city: '',
        ticketType: item.ticketType,
        quantity: item.quantity,
        price: item.price,
        eventImage: item.eventImage,
        orderDate: new Date().toISOString(),
        ticketCode: `KARTCIS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        eventStatus: 'active',
      }));
      
      setPurchasedTickets([...purchasedTickets, ...newTickets]);
    }
    
    // Clear cart
    clearCart();
    
    // Remove from pending orders
    pendingOrderStorage.remove(pendingOrder.orderId);
    setPendingOrder(null);
    setPendingOrderTimeLeft(0);
    
    // Close VA modal and show success
    setIsVADetailOpen(false);
    setIsPaymentSuccessOpen(true);
  };

  const selectedEventData = selectedEvent
    ? events.find((e) => e.id === selectedEvent)
    : null;

  // Sample sponsor data
  const sponsors = [
    {
      id: "1",
      name: "Nike",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
      link: "https://nike.com",
    },
    {
      id: "2",
      name: "Adidas",
      image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400",
      link: "https://adidas.com",
    },
    {
      id: "3",
      name: "Spotify",
      image: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400",
      link: "https://spotify.com",
    },
    {
      id: "4",
      name: "GoPay",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400",
      link: "https://gopay.co.id",
    },
    {
      id: "5",
      name: "Tokopedia",
      image: "https://images.unsplash.com/photo-1557821552-17105176677c?w=400",
      link: "https://tokopedia.com",
    },
    {
      id: "6",
      name: "BCA",
      image: "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=400",
      link: "https://bca.co.id",
    },
  ];

  // Convert cart items to V44 CartItem format for components
  const v44CartItems: CartItem[] = cartItems.map(item => ({
    eventId: item.event_id.toString(),
    ticketTypeId: item.ticket_type_id.toString(),
    quantity: item.quantity,
    eventTitle: item.event_title,
    eventDate: item.event_date,
    ticketTypeName: item.ticket_type_name,
    ticketPrice: item.ticket_price,
    eventImage: item.event_image,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        cartCount={itemCount}
        onSearchChange={setSearchQuery}
        onCartClick={() => setIsCartOpen(true)}
        onMyTicketsClick={() => setIsMyTicketsOpen(true)}
        onLoginClick={() => setIsLoginOpen(true)}
        searchValue={searchQuery}
        pendingPayment={pendingOrder ? {
          orderId: pendingOrder.orderId,
          timeLeft: pendingOrderTimeLeft,
          onClick: () => {
            // Re-open VA modal with pending order data
            setIsVADetailOpen(true);
          }
        } : null}
      />

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-sky-600 to-sky-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">
            Temukan Event Terbaik di Indonesia
          </h1>
          <p className="text-lg text-sky-50 max-w-2xl">
            Marathon, Konser Musik, Workshop, dan Event Menarik Lainnya
          </p>
        </div>
      </div>

      {/* Featured Events */}
      {!searchQuery &&
        selectedCategory === "Semua" &&
        featuredEvents.length > 0 && (
          <section className="py-8 bg-white border-b">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Event Populer
                  </h2>
                  <Badge className="bg-orange-500 hover:bg-orange-600 border-0 text-white">
                    Hot
                  </Badge>
                </div>
                <div className="hidden md:flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      const newIndex = currentSlide > 0 ? currentSlide - 1 : totalPages - 1;
                      handleSlideClick(newIndex);
                    }}
                    className="h-9 w-9"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      const newIndex = (currentSlide + 1) % totalPages;
                      handleSlideClick(newIndex);
                    }}
                    className="h-9 w-9"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div 
                className="overflow-x-auto pb-4 -mx-4 px-4 scroll-smooth snap-x" 
                ref={scrollContainerRef} 
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
                onScroll={handleScroll}
              >
                <div className="flex gap-6 min-w-max">
                  {featuredEvents.map((event, index) => (
                    <div key={event.id} className="w-[320px] md:w-[360px] flex-shrink-0 snap-center md:snap-start">
                      <EventCard
                        event={event}
                        onClick={() => setSelectedEvent(event.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {/* Bullet Indicators */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleSlideClick(index)}
                    className={`transition-all duration-300 rounded-full ${
                      index === currentSlide
                        ? 'w-8 h-2 bg-sky-600'
                        : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to page ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

      {/* Banner Sponsor Section - Slider */}
      {!searchQuery && selectedCategory === "Semua" && (
        <section className="py-6 bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Promo & Informasi
              </h2>
            </div>
            <div className="relative mx-4 md:mx-0">
              <div className="relative h-[280px]">
                <div 
                  className="overflow-x-auto scroll-smooth snap-x snap-mandatory h-full" 
                  ref={bannerScrollRef}
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  onMouseEnter={() => setIsBannerAutoPlaying(false)}
                  onMouseLeave={() => setIsBannerAutoPlaying(true)}
                  onScroll={handleBannerScroll}
                >
                  <div className="flex h-full">
                    {/* Banner 1 - Event Gratis */}
                    <div className="snap-center h-full flex-shrink-0 pr-6" style={{ width: '100%' }}>
                      <div 
                        className="relative rounded-xl overflow-hidden cursor-pointer group h-full w-full"
                        onClick={() => {
                          toast.info("Promo Event Gratis", {
                            description: "Event akademik dan charity gratis untuk mahasiswa!",
                            action: {
                              label: 'Tutup',
                              onClick: () => {},
                            },
                          });
                        }}
                      >
                        <img
                          src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&h=400&fit=crop"
                          alt="Promo Event Gratis"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>

                    {/* Banner 2 - Sport Promo */}
                    <div className="snap-center h-full flex-shrink-0" style={{ width: '100%' }}>
                      <div 
                        className="relative rounded-xl overflow-hidden cursor-pointer group h-full w-full"
                        onClick={() => {
                          toast.info("Promo Olahraga", {
                            description: "Diskon 20% untuk semua event olahraga!",
                            action: {
                              label: 'Tutup',
                              onClick: () => {},
                            },
                          });
                        }}
                      >
                        <img
                          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=400&fit=crop"
                          alt="Promo Olahraga"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Arrows - Desktop */}
                <button
                  onClick={() => {
                    const newIndex = currentBannerSlide > 0 ? 0 : 1;
                    handleBannerSlideClick(newIndex);
                  }}
                  className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white shadow-xl hover:shadow-2xl items-center justify-center transition-all hover:scale-110 border border-gray-200"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-700" />
                </button>
                <button
                  onClick={() => {
                    const newIndex = (currentBannerSlide + 1) % 2;
                    handleBannerSlideClick(newIndex);
                  }}
                  className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white shadow-xl hover:shadow-2xl items-center justify-center transition-all hover:scale-110 border border-gray-200"
                >
                  <ChevronRight className="h-6 w-6 text-gray-700" />
                </button>
              </div>
            </div>
            {/* Bullet Indicators */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {[0, 1].map((index) => (
                <button
                  key={index}
                  onClick={() => handleBannerSlideClick(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentBannerSlide
                      ? 'w-8 h-2 bg-sky-600'
                      : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sponsor Partners Section */}
      {!searchQuery && selectedCategory === "Semua" && (
        <SponsorSection
          title="Partner & Sponsor Kami"
          sponsors={sponsors}
          variant="square"
        />
      )}

      {/* All Events */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {searchQuery
                ? `Hasil Pencarian "${searchQuery}"`
                : "Semua Event"}
            </h2>
            <p className="text-gray-600">
              {filteredEvents.length} event
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Badge
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`cursor-pointer whitespace-nowrap transition-all !text-sm !px-3 !py-1.5 !font-medium ${
                  selectedCategory === category
                    ? "bg-sky-600 text-white hover:bg-sky-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
                variant={
                  selectedCategory === category
                    ? "default"
                    : "outline"
                }
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="text-center py-20 bg-white rounded-lg border">
              <Loader2 className="h-12 w-12 animate-spin text-sky-600 mx-auto mb-4" />
              <p className="text-xl text-gray-600">
                Memuat event...
              </p>
            </div>
          ) : isSearching ? (
            <div className="text-center py-20 bg-white rounded-lg border">
              <Loader2 className="h-12 w-12 animate-spin text-sky-600 mx-auto mb-4" />
              <p className="text-xl text-gray-600">
                Mencari event...
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border">
              <p className="text-xl text-gray-600">
                Event tidak ditemukan
              </p>
              <p className="text-gray-500 mt-2">
                Coba ubah filter atau kata kunci pencarian
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => setSelectedEvent(event.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold text-blue-600 mb-4">
                KARTCIS.ID
              </h3>
              <p className="text-gray-600 text-sm">
                Platform terpercaya untuk pembelian tiket event
                di Indonesia.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">
                Kategori
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li 
                  className="hover:text-blue-600 cursor-pointer"
                  onClick={() => {
                    setSelectedCategory('Olahraga');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Event Olahraga
                </li>
                <li 
                  className="hover:text-blue-600 cursor-pointer"
                  onClick={() => {
                    setSelectedCategory('Musik');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Konser Musik
                </li>
                <li 
                  className="hover:text-blue-600 cursor-pointer"
                  onClick={() => {
                    setSelectedCategory('Workshop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Workshop
                </li>
                <li 
                  className="hover:text-blue-600 cursor-pointer"
                  onClick={() => {
                    setSelectedCategory('Seminar');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Seminar
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">
                Bantuan
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="hover:text-blue-600 cursor-pointer" onClick={() => setHelpModalType('cara-pesan')}>
                  Cara Pesan
                </li>
                <li className="hover:text-blue-600 cursor-pointer" onClick={() => setHelpModalType('syarat-ketentuan')}>
                  Syarat & Ketentuan
                </li>
                <li className="hover:text-blue-600 cursor-pointer" onClick={() => setHelpModalType('kebijakan-privasi')}>
                  Kebijakan Privasi
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">
                Hubungi Kami
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Email: info@kartcis.id</li>
                <li>Phone: 021-1234-5678</li>
                <li className="hover:text-blue-600 cursor-pointer">
                  Instagram
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
            © 2026 KARTCIS.ID. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedEventData && (
        <EventDetail
          event={selectedEventData}
          onClose={() => setSelectedEvent(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={v44CartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleCheckout}
      />

      <Checkout
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={v44CartItems}
        onComplete={handleCheckoutComplete}
        onShowVirtualAccount={handleShowVirtualAccount}
      />

      <MyTickets
        isOpen={isMyTicketsOpen}
        onClose={() => setIsMyTicketsOpen(false)}
        tickets={purchasedTickets}
        onEventClick={(eventId) => {
          setSelectedEvent(eventId);
          setIsMyTicketsOpen(false);
        }}
      />

      {pendingOrder && (
        <VirtualAccountDetail
          isOpen={isVADetailOpen}
          onClose={() => setIsVADetailOpen(false)}
          bank={pendingOrder.bank}
          amount={pendingOrder.amount}
          orderId={pendingOrder.orderId}
          onComplete={handleVAComplete}
          onChangePaymentMethod={handleChangePaymentMethod}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {helpModalType && (
        <HelpModal
          type={helpModalType}
          onClose={() => setHelpModalType(null)}
        />
      )}

      <Login
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
      />

      <Register
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
      />

      <PaymentSuccess
        isOpen={isPaymentSuccessOpen}
        onClose={() => setIsPaymentSuccessOpen(false)}
        orderDetails={successOrderDetails || {
          orderId: '',
          items: [],
          customerInfo: { name: '', email: '', phone: '' },
          totalAmount: 0
        }}
        onViewMyTickets={() => setIsMyTicketsOpen(true)}
      />

      <Toaster position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <EventsProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </EventsProvider>
    </AuthProvider>
  );
}