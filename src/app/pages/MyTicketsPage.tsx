import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, Loader2 } from 'lucide-react';
import { Button } from "@/app/components/ui/button";
import { useAuth } from "@/app/contexts/AuthContext";
import { api } from "@/app/services/api";
import type { Ticket as ApiTicket } from "@/app/types";
import type { Ticket } from "@/app/components/MyTickets";
import QRCode from 'qrcode';
import { createPortal } from 'react-dom';
import { TicketCard } from "@/app/components/TicketCard";

export function MyTicketsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upcomingTickets, setUpcomingTickets] = useState<Ticket[]>([]);
  const [pastTickets, setPastTickets] = useState<Ticket[]>([]);
  const [selectedTicketForQR, setSelectedTicketForQR] = useState<Ticket | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await api.tickets.getMyTickets();
            if (response.success && response.data) {
                // Helper to map API ticket to Component Ticket
                const mapTicket = (t: ApiTicket): Ticket => ({
                    id: t.id.toString(),
                    eventId: t.event_id.toString(),
                    eventTitle: t.event?.title || 'Unknown Event',
                    eventDate: t.event?.event_date || '',
                    eventTime: t.event?.event_time || '',
                    venue: t.event?.venue || '',
                    city: t.event?.city || '',
                    ticketType: t.ticket_type?.name || 'Standard',
                    quantity: 1,
                    price: t.ticket_type?.price || 0,
                    eventImage: t.event?.image || '',
                    orderDate: t.created_at,
                    ticketCode: t.ticket_code,
                    customFieldResponses: t.custom_field_responses,
                    eventStatus: t.event?.status === 'cancelled' ? 'cancelled' : 'active',
                    cancelReason: t.event?.cancel_reason
                });

                const upcoming = (response.data.upcoming || []).map(mapTicket);
                // Ensure upcoming are sorted by date ascending (soonest first)
                upcoming.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
                setUpcomingTickets(upcoming);

                const past = (response.data.past || []).map(mapTicket);
                // Ensure past are sorted by date descending (most recent first)
                past.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
                setPastTickets(past);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    if (user) {
        fetchTickets();
    }
  }, [user]);

  // Generate QR code when modal opens
  useEffect(() => {
    if (selectedTicketForQR && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, selectedTicketForQR.ticketCode, { 
        width: 200,
        margin: 2,
        color: {
          dark: '#b31356',
          light: '#ffffff'
        }
      });
    }
  }, [selectedTicketForQR]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return 'Tanggal tidak valid';
      }
      return date.toLocaleDateString('id-ID', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch (error) {
      return 'Tanggal tidak valid';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleEventClick = (eventId: string | number) => {
    navigate(`/event/${eventId}`);
  };

  const hasNoTickets = upcomingTickets.length === 0 && pastTickets.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-primary to-primary-hover">
            <h1 className="text-3xl font-bold text-white">Tiket Saya</h1>
            <p className="text-sky-100 mt-1">
              {user ? `Halo ${user.name}, kelola dan akses semua tiket Anda` : 'Kelola dan akses semua tiket Anda'}
            </p>
          </div>

          <div className="p-6">
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : hasNoTickets ? (
              <div className="text-center py-12">
                <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Belum Ada Tiket</h3>
                <p className="text-gray-600 mb-4">Tiket yang sudah dibeli akan muncul di sini</p>
                <Button 
                  onClick={() => navigate('/')}
                  className="bg-primary hover:bg-primary-hover"
                >
                  Jelajahi Event
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Upcoming Events */}
                {upcomingTickets.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Mendatang</h2>
                    <div className="space-y-4">
                      {upcomingTickets.map((ticket) => (
                        <TicketCard 
                          key={ticket.id} 
                          ticket={ticket} 
                          formatPrice={formatPrice} 
                          formatDate={formatDate} 
                          isUpcoming 
                          onEventClick={handleEventClick}
                          onShowQR={() => {
                            setSelectedTicketForQR(ticket);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Events */}
                {pastTickets.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Selesai</h2>
                    <div className="space-y-4">
                      {pastTickets.map((ticket) => (
                        <TicketCard 
                          key={ticket.id} 
                          ticket={ticket} 
                          formatPrice={formatPrice} 
                          formatDate={formatDate} 
                          isUpcoming={false} 
                          onEventClick={handleEventClick} 
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global QR Code Modal */}
      {selectedTicketForQR && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4"
          onClick={() => {
            setSelectedTicketForQR(null);
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">QR Code Tiket</h3>
              <p className="text-sm text-gray-600 mb-4">{selectedTicketForQR.eventTitle}</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4 flex items-center justify-center">
                <canvas ref={qrCanvasRef} id={`qr-${selectedTicketForQR.id}`} />
              </div>
              
              <p className="text-xs text-gray-600 mb-1">Kode Tiket</p>
              <p className="font-mono font-semibold text-primary mb-4">{selectedTicketForQR.ticketCode}</p>
              
              <Button 
                type="button"
                onClick={() => {
                  setSelectedTicketForQR(null);
                }}
                className="w-full bg-primary hover:bg-primary-hover"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
