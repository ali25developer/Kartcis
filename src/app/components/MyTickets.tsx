import { X, Calendar, MapPin, Clock, Download, QrCode } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';

export interface Ticket {
  id: string;
  eventId?: string; // Add eventId for navigation
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  city: string;
  ticketType: string;
  quantity: number;
  price: number;
  eventImage: string;
  orderDate: string;
  ticketCode: string;
  eventStatus?: 'active' | 'cancelled'; // Status of the event
  cancelReason?: string; // Reason if event is cancelled
}

interface MyTicketsProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
  onEventClick?: (eventId: string) => void;
}

export function MyTickets({ isOpen, onClose, tickets, onEventClick }: MyTicketsProps) {
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

  const isUpcoming = (dateStr: string) => {
    try {
      const eventDate = new Date(dateStr);
      const today = new Date();
      return !isNaN(eventDate.getTime()) && eventDate > today;
    } catch (error) {
      return false;
    }
  };

  const upcomingTickets = (tickets || []).filter(t => isUpcoming(t.eventDate) && t.eventStatus !== 'cancelled');
  const pastTickets = (tickets || []).filter(t => !isUpcoming(t.eventDate) && t.eventStatus !== 'cancelled');

  if (!isOpen) return null;

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
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Tiket Saya</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="p-6">
            {tickets.length === 0 ? (
              <div className="text-center py-12">
                <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Belum Ada Tiket</h3>
                <p className="text-gray-600">Tiket yang sudah dibeli akan muncul di sini</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Upcoming Events */}
                {upcomingTickets.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Event Mendatang</h3>
                    <div className="space-y-3">
                      {upcomingTickets.map((ticket) => (
                        <TicketCard key={ticket.id} ticket={ticket} formatPrice={formatPrice} formatDate={formatDate} isUpcoming onEventClick={onEventClick} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Events */}
                {pastTickets.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Event Selesai</h3>
                    <div className="space-y-3">
                      {pastTickets.map((ticket) => (
                        <TicketCard key={ticket.id} ticket={ticket} formatPrice={formatPrice} formatDate={formatDate} isUpcoming={false} onEventClick={onEventClick} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketCard({ 
  ticket, 
  formatPrice, 
  formatDate,
  isUpcoming,
  onEventClick
}: { 
  ticket: Ticket; 
  formatPrice: (price: number) => string;
  formatDate: (date: string) => string;
  isUpcoming: boolean;
  onEventClick?: (eventId: string) => void;
}) {
  const isCancelled = ticket.eventStatus === 'cancelled';
  const [showQRModal, setShowQRModal] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code when modal opens
  useEffect(() => {
    if (showQRModal && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, ticket.ticketCode, { 
        width: 200,
        margin: 2,
        color: {
          dark: '#0284c7',
          light: '#ffffff'
        }
      });
    }
  }, [showQRModal, ticket.ticketCode]);

  const handleShowQR = () => {
    setShowQRModal(true);
  };

  const handleDownloadTicket = async () => {
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
              <div class="logo">MASUP.ID</div>
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
    }
  };

  return (
    <>
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
                    className={`font-semibold mb-1 cursor-pointer hover:text-blue-600 transition-colors ${isCancelled ? 'text-gray-600 hover:text-gray-700' : 'text-gray-900'}`}
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
              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
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
                <Calendar className={`h-4 w-4 mr-2 flex-shrink-0 ${isCancelled ? 'text-gray-400' : 'text-blue-600'}`} />
                {formatDate(ticket.eventDate)}
              </div>
              <div className={`flex items-center text-sm ${isCancelled ? 'text-gray-500' : 'text-gray-700'}`}>
                <Clock className={`h-4 w-4 mr-2 flex-shrink-0 ${isCancelled ? 'text-gray-400' : 'text-blue-600'}`} />
                {ticket.eventTime} WIB
              </div>
              {/* Clickable Location - opens Google Maps */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ticket.venue + ', ' + ticket.city)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center text-sm md:col-span-2 hover:text-blue-600 transition-colors cursor-pointer ${isCancelled ? 'text-gray-500 hover:text-gray-600' : 'text-gray-700'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <MapPin className={`h-4 w-4 mr-2 flex-shrink-0 ${isCancelled ? 'text-gray-400' : 'text-blue-600'}`} />
                {ticket.venue}, {ticket.city}
              </a>
            </div>

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
                onClick={handleShowQR}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </Button>
              <Button 
                onClick={handleDownloadTicket}
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

      {/* QR Code Modal */}
      {showQRModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowQRModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">QR Code Tiket</h3>
              <p className="text-sm text-gray-600 mb-4">{ticket.eventTitle}</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4 flex items-center justify-center">
                <canvas ref={qrCanvasRef} id={`qr-${ticket.id}`} />
              </div>
              
              <p className="text-xs text-gray-600 mb-1">Kode Tiket</p>
              <p className="font-mono font-semibold text-blue-600 mb-4">{ticket.ticketCode}</p>
              
              <Button 
                onClick={() => setShowQRModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}