import { Calendar, MapPin, Clock, Users } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Event } from '../data/events';

interface EventCardProps {
  event: Event;
  onClick: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Tanggal tidak valid';
      }
      return date.toLocaleDateString('id-ID', { 
        weekday: 'short', 
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Tanggal tidak valid';
    }
  };

  const formatPrice = (price: number) => {
    if (!price || price === 0) return 'Gratis';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const totalAvailable = event.ticketTypes && Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0 
    ? event.ticketTypes.reduce((sum, t) => sum + (Number(t.available) || 0), 0)
    : 0;
  const soldOutPercentage = event.quota && event.quota > 0 
    ? ((event.quota - totalAvailable) / event.quota) * 100
    : 0;
  
  // Auto-detect sold out: either status is 'sold-out' OR totalAvailable is 0
  const isSoldOut = event.status === 'sold-out' || totalAvailable === 0;
  const isCancelled = event.status === 'cancelled';
  
  // Check if any ticket has discount
  const hasDiscount = event.ticketTypes && Array.isArray(event.ticketTypes) && event.ticketTypes.some(t => t.originalPrice && t.originalPrice > t.price);
  const lowestTicket = event.ticketTypes && Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0 
    ? event.ticketTypes.reduce((min, ticket) => 
        ticket.price < min.price ? ticket : min
      , event.ticketTypes[0])
    : null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group bg-white border-gray-200" onClick={onClick}>
      <div className="relative aspect-[16/9] overflow-hidden">
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Status Badges */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge className="bg-red-600 border-0 text-base px-4 py-1.5">
              SOLD OUT
            </Badge>
          </div>
        )}
        {isCancelled && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge className="bg-gray-900 border-0 text-base px-4 py-1.5">
              DIBATALKAN
            </Badge>
          </div>
        )}
        
        {event.isFeatured && !isSoldOut && !isCancelled && (
          <Badge className="absolute top-3 left-3 bg-orange-500 border-0 text-sm px-2.5 py-0.5">
            Populer
          </Badge>
        )}
        <Badge className="absolute top-3 right-3 bg-white text-gray-900 border-0 text-sm px-2.5 py-0.5">
          {event.category}
        </Badge>
      </div>

      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-1 line-clamp-1">
          {event.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3">{event.organizer}</p>

        <div className="space-y-2 mb-4 min-h-[72px]">
          <div className="flex items-center text-sm text-gray-700">
            <Calendar className="h-4 w-4 mr-2 text-sky-600 flex-shrink-0" />
            <span className="line-clamp-1">{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <MapPin className="h-4 w-4 mr-2 text-sky-600 flex-shrink-0" />
            <span className="line-clamp-1">{event.venue}, {event.city}</span>
          </div>
          {!isSoldOut && !isCancelled && (
            <div className="flex items-center text-sm text-gray-700">
              <Users className="h-4 w-4 mr-2 text-sky-600 flex-shrink-0" />
              <span className="line-clamp-1">Sisa {totalAvailable.toLocaleString('id-ID')} tiket</span>
            </div>
          )}
        </div>

        {soldOutPercentage > 80 && !isSoldOut && !isCancelled && (
          <div className="mb-3">
            <Badge variant="outline" className="text-sm text-amber-600 border-amber-200 bg-amber-50">
              Hampir Habis
            </Badge>
          </div>
        )}

        <div className="flex items-end justify-between pt-3 border-t gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">Mulai dari</p>
            {lowestTicket && lowestTicket.originalPrice && lowestTicket.originalPrice > lowestTicket.price ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-400 line-through">
                    {formatPrice(lowestTicket.originalPrice)}
                  </p>
                  <Badge className="bg-orange-500 text-white border-0 text-xs px-1.5 py-0">
                    {Math.round((1 - lowestTicket.price / lowestTicket.originalPrice) * 100)}%
                  </Badge>
                </div>
                <p className="font-bold text-sky-600 text-2xl">
                  {formatPrice(lowestTicket.price)}
                </p>
              </div>
            ) : (
              <p className="font-bold text-sky-600 text-2xl">
                {lowestTicket ? formatPrice(lowestTicket.price) : formatPrice(event.price?.min || 0)}
              </p>
            )}
          </div>
          <Button className="bg-sky-600 hover:bg-sky-700 flex-shrink-0">
            Lihat Detail
          </Button>
        </div>
      </div>
    </Card>
  );
}