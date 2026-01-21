import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { EventCard } from "@/app/components/EventCard";
import { SponsorSection } from "@/app/components/SponsorSection";
import type { Event } from "@/app/types";
import { events as eventsData, categories as categoriesData } from "@/app/data/events";

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [currentBannerSlide, setCurrentBannerSlide] = useState(0);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Load data from static import
  useEffect(() => {
    setLoading(true);
    try {
      setEvents(eventsData);
      setCategories(categoriesData);
      setFeaturedEvents(eventsData.filter(e => e.isFeatured));
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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
  useEffect(() => {
    const bannerTimer = setInterval(() => {
      setCurrentBannerSlide((prev) => (prev + 1) % 3);
    }, 5000);

    return () => clearInterval(bannerTimer);
  }, []);

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

  // Filter events based on category and search
  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (selectedCategory !== "Semua") {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.city.toLowerCase().includes(query) ||
        event.venue.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [events, selectedCategory, debouncedSearchQuery]);

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  const scrollToSearchBar = () => {
    if (searchBarRef.current) {
      searchBarRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus on search input after scrolling
      setTimeout(() => {
        const input = searchBarRef.current?.querySelector('input');
        input?.focus();
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner Carousel */}
      <div className="relative w-full h-[300px] md:h-[400px] bg-gradient-to-r from-sky-600 to-sky-800 overflow-hidden">
        {[
          {
            title: "Temukan Event Impianmu",
            subtitle: "Marathon, Konser, Workshop & Lebih Banyak Lagi",
            cta: "Jelajahi Event"
          },
          {
            title: "Beli Tiket dengan Mudah",
            subtitle: "Proses Cepat & Aman dengan Virtual Account",
            cta: "Mulai Sekarang"
          },
          {
            title: "Kelola Tiketmu",
            subtitle: "Akses Tiket Kapan Saja, Di Mana Saja",
            cta: "Lihat Tiket"
          }
        ].map((banner, index) => (
          <div
            key={index}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${
              currentBannerSlide === index ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="text-center text-white px-4 max-w-4xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">{banner.title}</h1>
              <p className="text-lg md:text-2xl mb-8 text-white">{banner.subtitle}</p>
              <Button 
                size="lg" 
                className="bg-white text-sky-600 hover:bg-sky-50"
                onClick={() => {
                  if (index === 2) {
                    navigate('/my-tickets');
                  } else {
                    scrollToSearchBar();
                  }
                }}
              >
                {banner.cta}
              </Button>
            </div>
          </div>
        ))}
        
        {/* Banner Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              onClick={() => setCurrentBannerSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentBannerSlide === index ? 'bg-white w-8' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto" ref={searchBarRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Cari event berdasarkan nama, kota, atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-6 text-lg rounded-full border-2 border-gray-200 focus:border-sky-500"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-sky-600" />
            )}
          </div>
        </div>

        {/* Featured Events Carousel */}
        {!searchQuery && featuredEvents.length > 0 && (
          <div className="mb-12">
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
                      currentSlide === index ? 'bg-sky-600 w-8' : 'bg-gray-300 w-2'
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
                      ? "bg-sky-600 hover:bg-sky-700"
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
              <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard 
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sponsor Section */}
        <SponsorSection />
      </div>
    </div>
  );
}