import { Calendar, MapPin, Users } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import type { Event } from '../types';

interface EventCardProps {
  event: Event;
  onClick: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return 'Tanggal belum ditentukan';
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

  const totalAvailable = event.ticket_types && Array.isArray(event.ticket_types) && event.ticket_types.length > 0 
    ? event.ticket_types.reduce((sum, t) => sum + (Number(t.available) || 0), 0)
    : 0;
    
  const soldOutPercentage = event.quota && event.quota > 0 
    ? ((event.quota - totalAvailable) / event.quota) * 100
    : 0;
  
  // Status checks
  const isSoldOut = event.status === 'sold_out' || (event.ticket_types && event.ticket_types.length > 0 && totalAvailable === 0);
  const isCancelled = event.status === 'cancelled';
  const isCompleted = event.status === 'completed';
  
  // Check if any ticket has discount (using originalPrice which is optional in TicketType)
  const lowestTicket = event.ticket_types && Array.isArray(event.ticket_types) && event.ticket_types.length > 0 
    ? event.ticket_types.reduce((min, ticket) => 
        ticket.price < min.price ? ticket : min
      , event.ticket_types[0])
    : null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group bg-white border-gray-200 flex flex-col h-full" onClick={onClick}>
      <div className="relative aspect-[16/9] overflow-hidden flex-shrink-0">
        <img 
          src={event.image || '/placeholder-event.jpg'} 
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Status Badges */}
        {isSoldOut && !isCompleted && !isCancelled && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge className="bg-red-600 border-0 text-base px-4 py-1.5 font-bold">
              SOLD OUT
            </Badge>
          </div>
        )}
        {isCompleted && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge className="bg-gray-700 border-0 text-base px-4 py-1.5 font-bold">
              EVENT SELESAI
            </Badge>
          </div>
        )}
        {isCancelled && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge className="bg-gray-900 border-0 text-base px-4 py-1.5 font-bold">
              DIBATALKAN
            </Badge>
          </div>
        )}
        
        {event.is_featured && event.status === 'published' && !isSoldOut && (
          <Badge className="absolute top-3 left-3 bg-accent-orange border-0 text-gray-900 shadow-md font-bold text-xs px-2.5 py-0.5">
            Populer
          </Badge>
        )}
        {event.category && (
          <Badge className="absolute top-3 right-3 bg-white text-gray-900 border-0 text-sm px-2.5 py-0.5">
            {event.category.name}
          </Badge>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-xl font-semibold text-gray-900 mb-1 line-clamp-1">
          {event.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3">{event.organizer}</p>

        <div className="space-y-2 mb-4 min-h-[72px]">
          <div className="flex items-center text-sm text-gray-700">
            <Calendar className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
            <span className="line-clamp-1">{formatDate(event.date || event.event_date)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <MapPin className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
            <span className="line-clamp-1">{event.venue}, {event.city}</span>
          </div>
          {!isSoldOut && !isCancelled && (
            <div className="flex items-center text-sm text-gray-700">
              <Users className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
              <span className="line-clamp-1">Sisa {totalAvailable.toLocaleString('id-ID')} tiket</span>
            </div>
          )}
        </div>

        {soldOutPercentage > 80 && !isSoldOut && !isCancelled && (
          <div className="mb-3">
            <Badge className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
              Hampir Habis
            </Badge>
          </div>
        )}

        <div className="flex items-end justify-between pt-3 border-t gap-3 mt-auto">
          <div className="flex-1 min-w-0">
            <div className="h-[74px] flex flex-col justify-end">
              <p className="text-xs text-gray-500 mb-1">Mulai dari</p>
              {lowestTicket && lowestTicket.originalPrice && lowestTicket.originalPrice > lowestTicket.price ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-400 line-through">
                      {formatPrice(lowestTicket.originalPrice)}
                    </p>
                    <Badge className="bg-accent-orange text-white border-0 text-xs px-1.5 py-0">
                      {Math.round((1 - lowestTicket.price / lowestTicket.originalPrice) * 100)}%
                    </Badge>
                  </div>
                  <p className="font-bold text-primary text-2xl leading-none">
                    {formatPrice(lowestTicket.price)}
                  </p>
                </div>
              ) : (
                <p className="font-bold text-primary text-2xl leading-none">
                  {formatPrice(event.min_price || lowestTicket?.price || 0)}
                </p>
              )}
            </div>
          </div>
          <Button className="bg-primary hover:bg-primary-hover flex-shrink-0">
            Lihat Detail
          </Button>
        </div>
      </div>
    </Card>
  );
}