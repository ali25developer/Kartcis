import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { EventCard } from "@/app/components/EventCard";
import { SponsorSection } from "@/app/components/SponsorSection";
import type { Event } from "@/app/types";
import api from "@/app/services/api";
import { useEvents } from "@/app/contexts/EventsContext";

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation(); // Keep track of location state
  const searchInputRef = useRef<HTMLInputElement>(null); // Ref for input focus
  
  const { categories: contextCategories, featuredEvents: contextFeaturedEvents, loading: contextLoading } = useEvents();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<string[]>(['Semua']);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [currentBannerSlide, setCurrentBannerSlide] = useState(0);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const featuredSectionRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic for search/home changes
  useEffect(() => {
    // If state contains 'scrollTo', handle it
    if (location.state?.scrollTo === 'search') {
      setTimeout(() => {
        // Manual custom smooth scroll calculation for better control
        if (searchBarRef.current) {
            const headerOffset = 100; // Adjust based on your header height
            const elementPosition = searchBarRef.current.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
            searchInputRef.current?.focus({ preventScroll: true });
        }
      }, 100);
      // Clear state to prevent re-scroll
      navigate(location.pathname, { replace: true, state: {} });
    } else if (location.state?.scrollTo === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate(location.pathname, { replace: true, state: {} });
    } else if (location.pathname === '/' && !location.state?.scrollTo) {
        // Just standard home navigation
    }
  }, [location.state, location.pathname, navigate]);

  // Load events and featured data
  useEffect(() => {
    const fetchEvents = async () => {
      if (currentPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const eventsRes = await api.events.getAll({
          page: currentPage,
          limit: 12,
          search: debouncedSearchQuery,
          category: selectedCategory === "Semua" ? undefined : selectedCategory
        });

        if (eventsRes.success && eventsRes.data) {
          const newEvents = eventsRes.data.events;
          const paginationData = eventsRes.data.pagination;

          if (currentPage === 1) {
            setEvents(newEvents);
          } else {
            setEvents(prev => [...prev, ...newEvents]);
          }

          setHasMore(paginationData.current_page < paginationData.total_pages);
        }
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchEvents();
  }, [currentPage, debouncedSearchQuery, selectedCategory]);

  // Handle Search/Category Change
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
  }, [debouncedSearchQuery, selectedCategory]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (loading || !hasMore) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
        setCurrentPage(prev => prev + 1);
      }
    }, { threshold: 0.1 });

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loading, loadingMore, hasMore]);

  // Sync categories and featured from context
  useEffect(() => {
    if (contextCategories.length > 0) {
      setCategories(['Semua', ...contextCategories.map(c => c.name)]);
    }
  }, [contextCategories]);

  useEffect(() => {
    if (contextFeaturedEvents.length > 0) {
      setFeaturedEvents(contextFeaturedEvents);
    } else if (!contextLoading) {
      // If context failed or is empty, try direct fetch as fallback for featured
      const fetchFeatured = async () => {
        try {
          const res = await api.events.getFeatured();
          if (res.success && res.data) setFeaturedEvents(res.data);
        } catch (e) { console.error(e); }
      };
      fetchFeatured();
    }
  }, [contextFeaturedEvents, contextLoading]);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debounce search query
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Calculate total pages for carousel
  const cardsPerPage = isMobile ? 1 : 3;
  const totalPages = Math.ceil(featuredEvents.length / cardsPerPage);

  const scrollToSlide = (index: number) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = index * scrollContainerRef.current.offsetWidth;
    scrollContainerRef.current.scrollTo({
      left: scrollAmount,
      behavior: 'smooth'
    });
  };

  // Auto-slide for featured events
  useEffect(() => {
    if (!isAutoPlaying || totalPages === 0) return;

    autoPlayIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % totalPages;
        scrollToSlide(next);
        return next;
      });
    }, 4000);

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [isAutoPlaying, totalPages]);

  // Auto-slide for banners
  // useEffect(() => {
  //   const bannerTimer = setInterval(() => {
  //     setCurrentBannerSlide((prev) => (prev + 1) % 3);
  //   }, 5000);

  //   return () => clearInterval(bannerTimer);
  // }, []);

  const handlePrevSlide = () => {
    setIsAutoPlaying(false);
    const newSlide = currentSlide === 0 ? totalPages - 1 : currentSlide - 1;
    setCurrentSlide(newSlide);
    scrollToSlide(newSlide);
  };

  const handleNextSlide = () => {
    setIsAutoPlaying(false);
    const newSlide = (currentSlide + 1) % totalPages;
    setCurrentSlide(newSlide);
    scrollToSlide(newSlide);
  };

  // No client-side filtering needed anymore as we fetch from server
  const filteredEvents = events;

  const handleEventClick = (eventId: string | number) => {
    navigate(`/event/${eventId}`);
  };

  const handleBannerAction = (action: string) => {
    if (action === 'tickets') {
      navigate('/my-tickets');
    } else {
      const targetId = action === 'featured' ? 'featured-events' : 'search-bar';
      const element = document.getElementById(targetId);
      if (element) {
        const header = document.querySelector('header');
        const headerHeight = header ? header.offsetHeight : 0;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - headerHeight - 20; // 20px extra padding

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner Carousel */}
      <div className="relative w-full h-[300px] md:h-[400px] bg-gradient-to-r from-primary to-primary-hover overflow-hidden">
        {[
          {
            title: "Temukan Event Impianmu",
            subtitle: "Marathon, Konser, Workshop & Lebih Banyak Lagi",
            cta: "Jelajahi Event",
            action: "browse"
          },
          // {
          //   title: "Beli Tiket dengan Mudah",
          //   subtitle: "Proses Cepat & Aman dengan Virtual Account",
          //   cta: "Lihat Event Populer",
          //   action: "featured"
          // },
          // {
          //   title: "Kelola Tiketmu",
          //   subtitle: "Akses Tiket Kapan Saja, Di Mana Saja",
          //   cta: "Lihat Tiket Saya",
          //   action: "tickets"
          // }
        ].map((banner, index) => (
          <div
            key={index}
            className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${
              currentBannerSlide === index 
                ? 'opacity-100 z-10 scale-100' 
                : 'opacity-0 pointer-events-none z-0 scale-95'
            }`}
          >
            <div className="text-center px-4 max-w-4xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white uppercase tracking-tight">{banner.title}</h1>
              <p className="text-lg md:text-2xl mb-8 text-white/90 font-medium">{banner.subtitle}</p>
              <button
                className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-primary-hover bg-white rounded-xl hover:bg-primary-light transition-all active:scale-95 shadow-2xl hover:shadow-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentBannerSlide === index) {
                    handleBannerAction(banner.action);
                  }
                }}
              >
                {banner.cta}
              </button>
            </div>
          </div>
        ))}
        
        {/* Banner Indicators */}
        {/* <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              onClick={() => setCurrentBannerSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentBannerSlide === index ? 'bg-white w-8' : 'bg-white/50'
              }`}
            />
          ))}
        </div> */}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8" id="search-bar">
          <div className="relative max-w-2xl mx-auto" ref={searchBarRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Cari event berdasarkan nama, kota, atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-6 text-lg rounded-full border-2 border-gray-200 focus:border-primary-light0"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-primary" />
            )}
          </div>
        </div>

        {/* Featured Events Carousel */}
        {!searchQuery && featuredEvents.length > 0 && (
          <div className="mb-12" id="featured-events" ref={featuredSectionRef}>
            <h2 className="text-3xl font-bold mb-6">Populer</h2>
            <div className="relative">
              <div 
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {featuredEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="flex-shrink-0 snap-start"
                    style={{ width: isMobile ? '100%' : 'calc(33.333% - 1rem)' }}
                  >
                    <EventCard 
                      event={event}
                      onClick={() => handleEventClick(event.id)}
                    />
                  </div>
                ))}
              </div>

              {/* Navigation Buttons */}
              {totalPages > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-lg"
                    onClick={handlePrevSlide}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-lg"
                    onClick={handleNextSlide}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Slide Indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentSlide(index);
                      scrollToSlide(index);
                      setIsAutoPlaying(false);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      currentSlide === index ? 'bg-primary w-8' : 'bg-gray-300 w-2'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Events Grid */}
        <div>
          <h2 className="text-3xl font-bold mb-4">
            {searchQuery ? `Hasil Pencarian (${filteredEvents.length})` : 'Semua Event'}
          </h2>
          
          {/* Category Filter - Only show when not searching */}
          {!searchQuery && (
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className={`cursor-pointer px-4 py-2 text-sm ${
                    selectedCategory === category
                      ? "bg-primary hover:bg-primary-hover"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchQuery 
                  ? "Tidak ada event yang sesuai dengan pencarian" 
                  : "Tidak ada event tersedia"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard 
                    key={event.id}
                    event={event}
                    onClick={() => handleEventClick(event.id)}
                  />
                ))}
              </div>

              {/* Infinite Scroll Sentinel & Loader */}
              <div ref={sentinelRef} className="h-20 flex justify-center items-center mt-8">
                {loadingMore && (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-gray-500">Memuat lebih banyak event...</p>
                  </div>
                )}
                {!hasMore && events.length > 0 && (
                  <p className="text-gray-400 text-sm">Semua event sudah ditampilkan</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sponsor Section */}
        <SponsorSection />
      </div>
    </div>
  );
}