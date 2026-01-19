import { Calendar, MapPin, Clock, X, Minus, Plus, Check, Users, Phone, Mail, Globe, Instagram, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Event, TicketType } from '../data/events';
import { useState } from 'react';

interface EventDetailProps {
  event: Event;
  onClose: () => void;
  onAddToCart: (eventId: string, ticketTypeId: string, quantity: number) => void;
}

export function EventDetail({ event, onClose, onAddToCart }: EventDetailProps) {
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'description' | 'facilities' | 'agenda' | 'terms' | 'organizer' | 'faq'>('description');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratis';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const updateQuantity = (ticketTypeId: string, delta: number) => {
    setSelectedTickets(prev => {
      const current = prev[ticketTypeId] || 0;
      const newValue = Math.max(0, Math.min(10, current + delta));
      const updated = { ...prev };
      if (newValue === 0) {
        delete updated[ticketTypeId];
      } else {
        updated[ticketTypeId] = newValue;
      }
      return updated;
    });
  };

  const handleAddToCart = () => {
    Object.entries(selectedTickets).forEach(([ticketTypeId, quantity]) => {
      if (quantity > 0) {
        onAddToCart(event.id, ticketTypeId, quantity);
      }
    });
    setSelectedTickets({});
  };

  const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = Object.entries(selectedTickets).reduce((sum, [ticketTypeId, qty]) => {
    const ticket = event.ticketTypes.find(t => t.id === ticketTypeId);
    return sum + (ticket?.price || 0) * qty;
  }, 0);

  const totalAvailable = event.ticketTypes.reduce((sum, t) => sum + t.available, 0);

  // Check if event has detailed info
  const hasDetailedInfo = event.detailedDescription || event.facilities || event.agenda || event.terms || event.organizerInfo || event.faqs;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen py-8 px-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="max-w-4xl mx-auto bg-white rounded-lg overflow-hidden"
        >
          {/* Header Image */}
          <div className="relative aspect-[21/9] overflow-hidden">
            <img 
              src={event.image} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-white hover:bg-gray-100"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>

            {event.isFeatured && (
              <Badge className="absolute top-4 left-4 bg-orange-500 border-0">
                Populer
              </Badge>
            )}
          </div>

          <div className="p-6 md:p-8">
            {/* Event Info */}
            <div className="mb-6">
              <Badge className="mb-3 bg-sky-50 text-sky-700 border-sky-200">
                {event.category}
              </Badge>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {event.title}
              </h1>
              <p className="text-lg text-gray-600">oleh {event.organizer}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8 pb-8 border-b">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-sky-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tanggal</p>
                  <p className="text-gray-900 font-medium">{formatDate(event.date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-sky-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Waktu</p>
                  <p className="text-gray-900 font-medium">{event.time} WIB</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-sky-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Lokasi</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue}, ${event.city}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-900 font-medium hover:text-sky-600 transition-colors flex items-center gap-1 group"
                  >
                    <span>{event.venue}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <p className="text-sm text-gray-600">{event.city}</p>
                </div>
              </div>
            </div>

            {/* Status Alerts */}
            {event.status === 'sold-out' && (
              <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Badge className="bg-red-600 border-0">SOLD OUT</Badge>
                  <div>
                    <p className="font-semibold text-red-900 mb-1">Event Sudah Penuh</p>
                    <p className="text-sm text-red-700">Semua tiket untuk event ini sudah habis terjual.</p>
                  </div>
                </div>
              </div>
            )}

            {event.status === 'cancelled' && (
              <div className="mb-8 bg-gray-50 border border-gray-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Badge className="bg-gray-900 border-0">DIBATALKAN</Badge>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Event Dibatalkan</p>
                    {event.cancelReason && (
                      <p className="text-sm text-gray-700">{event.cancelReason}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Simple Description (for events without detailed info) */}
            {!hasDetailedInfo && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Tentang Event</h2>
                <p className="text-gray-700 leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* Event Details with Tabs (for events with detailed info) */}
            {hasDetailedInfo && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Informasi Event</h2>
                
                {/* Tabs */}
                <div className="flex overflow-x-auto gap-2 mb-4 border-b pb-2">
                  {event.detailedDescription && (
                    <button
                      onClick={() => setActiveTab('description')}
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                        activeTab === 'description'
                          ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Deskripsi
                    </button>
                  )}
                  {event.facilities && event.facilities.length > 0 && (
                    <button
                      onClick={() => setActiveTab('facilities')}
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                        activeTab === 'facilities'
                          ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Fasilitas
                    </button>
                  )}
                  {event.agenda && event.agenda.length > 0 && (
                    <button
                      onClick={() => setActiveTab('agenda')}
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                        activeTab === 'agenda'
                          ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Rundown
                    </button>
                  )}
                  {event.terms && event.terms.length > 0 && (
                    <button
                      onClick={() => setActiveTab('terms')}
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                        activeTab === 'terms'
                          ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Syarat & Ketentuan
                    </button>
                  )}
                  {event.organizerInfo && (
                    <button
                      onClick={() => setActiveTab('organizer')}
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                        activeTab === 'organizer'
                          ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Info Organizer
                    </button>
                  )}
                  {event.faqs && event.faqs.length > 0 && (
                    <button
                      onClick={() => setActiveTab('faq')}
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                        activeTab === 'faq'
                          ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      FAQ
                    </button>
                  )}
                </div>

                {/* Tab Content */}
                <div className="bg-gray-50 rounded-lg p-6">
                  {/* Description Tab */}
                  {activeTab === 'description' && event.detailedDescription && (
                    <div className="space-y-4">
                      {event.detailedDescription.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="text-gray-700 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Facilities Tab */}
                  {activeTab === 'facilities' && event.facilities && (
                    <div>
                      <p className="text-gray-700 mb-4">Setiap peserta akan mendapatkan:</p>
                      <ul className="space-y-3">
                        {event.facilities.map((facility, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{facility}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Agenda Tab */}
                  {activeTab === 'agenda' && event.agenda && (
                    <div className="space-y-4">
                      {event.agenda.map((item, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="flex-shrink-0 w-20">
                            <Badge className="bg-sky-600 text-white border-0">{item.time}</Badge>
                          </div>
                          <p className="text-gray-700 flex-1">{item.activity}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Terms Tab */}
                  {activeTab === 'terms' && event.terms && (
                    <ul className="space-y-3">
                      {event.terms.map((term, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-xs font-semibold">
                            {idx + 1}
                          </span>
                          <span className="text-gray-700 flex-1">{term}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Organizer Tab */}
                  {activeTab === 'organizer' && event.organizerInfo && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.organizerInfo.name}</h3>
                        {event.organizerInfo.description && (
                          <p className="text-gray-700 leading-relaxed mb-4">{event.organizerInfo.description}</p>
                        )}
                      </div>
                      <div className="space-y-3 border-t pt-4">
                        {event.organizerInfo.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-sky-600" />
                            <span className="text-gray-700">{event.organizerInfo.phone}</span>
                          </div>
                        )}
                        {event.organizerInfo.email && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-sky-600" />
                            <span className="text-gray-700">{event.organizerInfo.email}</span>
                          </div>
                        )}
                        {event.organizerInfo.website && (
                          <div className="flex items-center gap-3">
                            <Globe className="h-5 w-5 text-sky-600" />
                            <a 
                              href={`https://${event.organizerInfo.website}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sky-600 hover:text-sky-700 flex items-center gap-1"
                            >
                              {event.organizerInfo.website}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                        {event.organizerInfo.instagram && (
                          <div className="flex items-center gap-3">
                            <Instagram className="h-5 w-5 text-sky-600" />
                            <a 
                              href={`https://instagram.com/${event.organizerInfo.instagram.replace('@', '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sky-600 hover:text-sky-700 flex items-center gap-1"
                            >
                              {event.organizerInfo.instagram}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* FAQ Tab */}
                  {activeTab === 'faq' && event.faqs && (
                    <div className="space-y-3">
                      {event.faqs.map((faq, idx) => (
                        <Card key={idx} className="border border-gray-200">
                          <button
                            onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                            className="w-full p-4 flex items-start justify-between gap-4 text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-medium text-gray-900">{faq.question}</span>
                            {expandedFaq === idx ? (
                              <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            )}
                          </button>
                          {expandedFaq === idx && (
                            <div className="px-4 pb-4">
                              <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ticket Types */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Pilih Tiket</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{totalAvailable} tiket tersedia</span>
                </div>
              </div>
              <div className="space-y-3">
                {event.ticketTypes.map((ticket) => (
                  <TicketTypeCard
                    key={ticket.id}
                    ticket={ticket}
                    quantity={selectedTickets[ticket.id] || 0}
                    onQuantityChange={(delta) => updateQuantity(ticket.id, delta)}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            </div>

            {/* Checkout Summary */}
            {totalTickets > 0 && (
              <div className="mt-8 pt-6 border-t bg-gray-50 -mx-6 md:-mx-8 px-6 md:px-8 py-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-600 text-sm">Total ({totalTickets} tiket)</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(totalPrice)}</p>
                  </div>
                  <Button 
                    onClick={handleAddToCart}
                    className="bg-sky-600 hover:bg-sky-700 px-8"
                  >
                    Tambah ke Keranjang
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketTypeCard({ 
  ticket, 
  quantity, 
  onQuantityChange, 
  formatPrice 
}: { 
  ticket: TicketType; 
  quantity: number; 
  onQuantityChange: (delta: number) => void;
  formatPrice: (price: number) => string;
}) {
  const availabilityPercent = (ticket.available / ticket.total) * 100;
  const isLowStock = availabilityPercent < 20 && availabilityPercent > 0;
  const isSoldOut = ticket.available === 0;

  return (
    <Card className={`p-4 border ${isSoldOut ? 'bg-gray-50 border-gray-200' : 'border-gray-200 hover:border-sky-300'} transition-colors`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`font-semibold ${isSoldOut ? 'text-gray-500' : 'text-gray-900'}`}>
              {ticket.name}
            </h3>
            {isSoldOut && (
              <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                Habis
              </Badge>
            )}
            {isLowStock && !isSoldOut && (
              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                Sisa {ticket.available}
              </Badge>
            )}
          </div>
          
          {ticket.originalPrice && ticket.originalPrice > ticket.price ? (
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-400 line-through">
                  {formatPrice(ticket.originalPrice)}
                </p>
                <p className={`text-xl font-bold ${isSoldOut ? 'text-gray-500' : 'text-sky-600'}`}>
                  {formatPrice(ticket.price)}
                </p>
                <Badge className="bg-orange-500 text-white border-0 text-xs">
                  Hemat {Math.round((1 - ticket.price / ticket.originalPrice) * 100)}%
                </Badge>
              </div>
            </div>
          ) : (
            <p className={`text-xl font-bold mb-2 ${isSoldOut ? 'text-gray-500' : 'text-sky-600'}`}>
              {formatPrice(ticket.price)}
            </p>
          )}

          <p className={`text-sm mb-2 ${isSoldOut ? 'text-gray-500' : 'text-gray-600'}`}>
            {ticket.description}
          </p>

          <p className={`text-xs ${isSoldOut ? 'text-gray-500' : 'text-gray-500'}`}>
            Tersedia: {ticket.available} / {ticket.total}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isSoldOut ? (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onQuantityChange(-1)}
                disabled={quantity === 0}
                className="h-9 w-9 border-gray-300"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold text-gray-900 w-8 text-center">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onQuantityChange(1)}
                disabled={quantity >= 10 || quantity >= ticket.available}
                className="h-9 w-9 border-gray-300"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="text-gray-500 px-4">
              Tidak Tersedia
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
