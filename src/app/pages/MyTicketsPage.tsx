import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Clock, Download, QrCode, Loader2 } from 'lucide-react';
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { useAuth } from "@/app/contexts/AuthContext";
import { api } from "@/app/services/api";
import type { Ticket as ApiTicket } from "@/app/types";
import type { Ticket } from "@/app/components/MyTickets";
import QRCode from 'qrcode';
import { useRef } from 'react';
import { createPortal } from 'react-dom';

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
          dark: '#0284c7',
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
          <div className="p-6 border-b bg-gradient-to-r from-sky-600 to-sky-700">
            <h1 className="text-3xl font-bold text-white">Tiket Saya</h1>
            <p className="text-sky-100 mt-1">
              {user ? `Halo ${user.name}, kelola dan akses semua tiket Anda` : 'Kelola dan akses semua tiket Anda'}
            </p>
          </div>

          <div className="p-6">
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
                </div>
            ) : hasNoTickets ? (
              <div className="text-center py-12">
                <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Belum Ada Tiket</h3>
                <p className="text-gray-600 mb-4">Tiket yang sudah dibeli akan muncul di sini</p>
                <Button 
                  onClick={() => navigate('/')}
                  className="bg-sky-600 hover:bg-sky-700"
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
              <p className="font-mono font-semibold text-sky-600 mb-4">{selectedTicketForQR.ticketCode}</p>
              
              <Button 
                type="button"
                onClick={() => {
                  setSelectedTicketForQR(null);
                }}
                className="w-full bg-sky-600 hover:bg-sky-700"
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

function TicketCard({ 
  ticket, 
  formatPrice, 
  formatDate,
  isUpcoming,
  onEventClick,
  onShowQR
}: { 
  ticket: Ticket; 
  formatPrice: (price: number) => string;
  formatDate: (date: string) => string;
  isUpcoming: boolean;
  onEventClick?: (eventId: string | number) => void;
  onShowQR?: () => void;
}) {
  const isCancelled = ticket.eventStatus === 'cancelled';

  const handleDownloadTicket = async () => {
    try {
      // Create ticket data
      const ticketData = {
        ticketCode: ticket.ticketCode,
        eventTitle: ticket.eventTitle,
        eventDate: formatDate(ticket.eventDate),
        eventTime: ticket.eventTime,
        venue: `${ticket.venue}, ${ticket.city}`,
        ticketType: ticket.ticketType,
        quantity: ticket.quantity,
        totalPrice: formatPrice(ticket.price * ticket.quantity)
      };

      // Generate QR Code as data URL
      const qrDataUrl = await QRCode.toDataURL(ticket.ticketCode, { width: 200 });

      // Create HTML content for PDF
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              .ticket { border: 2px solid #0284c7; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; }
              .logo { font-size: 24px; font-weight: bold; color: #0284c7; }
              .event-name { font-size: 20px; font-weight: bold; margin: 15px 0 10px; }
              .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .label { color: #6b7280; }
              .value { font-weight: 600; }
              .qr-section { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #cbd5e1; }
              .ticket-code { font-family: monospace; font-size: 18px; font-weight: bold; color: #0284c7; margin-top: 15px; }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <div class="logo">KARTCIS.ID</div>
                <div class="event-name">${ticketData.eventTitle}</div>
              </div>
              
              <div class="info-row">
                <span class="label">Tanggal</span>
                <span class="value">${ticketData.eventDate}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Waktu</span>
                <span class="value">${ticketData.eventTime} WIB</span>
              </div>
              
              <div class="info-row">
                <span class="label">Lokasi</span>
                <span class="value">${ticketData.venue}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Jenis Tiket</span>
                <span class="value">${ticketData.ticketType}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Jumlah</span>
                <span class="value">${ticketData.quantity} tiket</span>
              </div>
              
              <div class="info-row">
                <span class="label">Total Harga</span>
                <span class="value">${ticketData.totalPrice}</span>
              </div>
              
              <div class="qr-section">
                <img src="${qrDataUrl}" alt="QR Code" style="width: 200px; height: 200px;" />
                <div class="ticket-code">${ticketData.ticketCode}</div>
              </div>
            </div>
          </body>
        </html>
      `;

      // Open print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for images to load before printing
        setTimeout(() => {
          printWindow.print();
        }, 250);
      } else {
        alert('Pop-up blocked. Please allow pop-ups to download tickets.');
      }
    } catch (error) {
      console.error('Error downloading ticket:', error);
      alert('Terjadi kesalahan saat mendownload tiket. Silakan coba lagi.');
    }
  };

  return (
    <Card className={`overflow-hidden border ${isCancelled ? 'border-gray-300 bg-gray-50' : isUpcoming ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
      <div className="flex flex-col md:flex-row">
        {/* Event Image */}
        <div className="md:w-48 aspect-[16/9] md:aspect-auto relative">
          <img 
            src={ticket.eventImage} 
            alt={ticket.eventTitle}
            className={`w-full h-full object-cover ${isCancelled ? 'grayscale' : ''}`}
          />
        </div>

        {/* Ticket Info */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              {/* Clickable Event Title */}
              {ticket.eventId && onEventClick ? (
                <h3 
                  className={`font-semibold mb-1 cursor-pointer hover:text-sky-600 transition-colors ${isCancelled ? 'text-gray-600 hover:text-gray-700' : 'text-gray-900'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(ticket.eventId!);
                  }}
                >
                  {ticket.eventTitle}
                </h3>
              ) : (
                <h3 className={`font-semibold mb-1 ${isCancelled ? 'text-gray-600' : 'text-gray-900'}`}>{ticket.eventTitle}</h3>
              )}
              {isCancelled ? (
                <Badge className="bg-gray-900 text-white border-0">
                  Dibatalkan
                </Badge>
              ) : (
                <Badge className={isUpcoming ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}>
                  {isUpcoming ? 'Akan Datang' : 'Selesai'}
                </Badge>
              )}
            </div>
            <Badge className="bg-sky-50 text-sky-700 border-sky-200">
              {ticket.ticketType}
            </Badge>
          </div>

          {/* Cancel Reason */}
          {isCancelled && ticket.cancelReason && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900">{ticket.cancelReason}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-2 mb-4">
            <div className={`flex items-center text-sm ${isCancelled ? 'text-gray-500' : 'text-gray-700'}`}>
              <Calendar className={`h-4 w-4 mr-2 flex-shrink-0 ${isCancelled ? 'text-gray-400' : 'text-sky-600'}`} />
              {formatDate(ticket.eventDate)}
            </div>
            <div className={`flex items-center text-sm ${isCancelled ? 'text-gray-500' : 'text-gray-700'}`}>
              <Clock className={`h-4 w-4 mr-2 flex-shrink-0 ${isCancelled ? 'text-gray-400' : 'text-sky-600'}`} />
              {ticket.eventTime} WIB
            </div>
            {/* Clickable Location - opens Google Maps */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ticket.venue + ', ' + ticket.city)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center text-sm md:col-span-2 hover:text-sky-600 transition-colors cursor-pointer ${isCancelled ? 'text-gray-500 hover:text-gray-600' : 'text-gray-700'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <MapPin className={`h-4 w-4 mr-2 flex-shrink-0 ${isCancelled ? 'text-gray-400' : 'text-sky-600'}`} />
              {ticket.venue}, {ticket.city}
            </a>
          </div>

          {/* Custom Field Responses */}
          {ticket.customFieldResponses && (() => {
            try {
              const responses = JSON.parse(ticket.customFieldResponses);
              const entries = Object.entries(responses);
              if (entries.length > 0) {
                return (
                  <div className="mt-3 p-3 bg-sky-50 border border-sky-200 rounded-lg">
                    <p className="text-xs font-semibold text-sky-900 mb-2">Informasi Tambahan</p>
                    <div className="space-y-1">
                      {entries.map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{key}:</span>
                          <span className={`font-medium ${isCancelled ? 'text-gray-500' : 'text-gray-900'}`}>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            } catch (error) {
              console.error('Failed to parse custom field responses:', error);
            }
            return null;
          })()}

          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <p className="text-xs text-gray-600">Kode Tiket</p>
              <p className={`text-sm font-mono font-semibold ${isCancelled ? 'text-gray-500' : 'text-gray-900'}`}>{ticket.ticketCode}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">{ticket.quantity} tiket</p>
              <p className={`font-semibold ${isCancelled ? 'text-gray-500' : 'text-gray-900'}`}>{formatPrice(ticket.price * ticket.quantity)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isUpcoming && !isCancelled && (
          <div className="flex md:flex-col gap-2 p-4 border-t md:border-t-0 md:border-l md:w-44">
            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onShowQR) {
                  onShowQR();
                }
              }}
              className="flex-1 bg-sky-600 hover:bg-sky-700"
            >
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Button>
            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDownloadTicket();
              }}
              variant="outline" 
              className="flex-1 border-gray-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}