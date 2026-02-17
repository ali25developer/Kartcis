import { Calendar, MapPin, Clock, Download, QrCode } from 'lucide-react';
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import QRCode from 'qrcode';
import { Ticket } from "@/app/components/MyTickets";

interface TicketCardProps {
  ticket: Ticket;
  formatPrice: (price: number) => string;
  formatDate: (date: string) => string;
  isUpcoming: boolean;
  onEventClick?: (eventId: string | number) => void;
  onShowQR?: () => void;
}

export function TicketCard({
  ticket,
  formatPrice,
  formatDate,
  isUpcoming,
  onEventClick,
  onShowQR
}: TicketCardProps) {
  const isCancelled = ticket.eventStatus === 'cancelled';

  const handleDownloadTicket = async () => {
    try {
      const eventDate = formatDate(ticket.eventDate);
      const eventTime = ticket.eventTime;
      const venue = `${ticket.venue}, ${ticket.city}`;
      const ticketType = ticket.ticketType;
      const quantity = ticket.quantity;
      const totalPrice = formatPrice(ticket.price * ticket.quantity);

      const qrDataUrl = await QRCode.toDataURL(ticket.ticketCode, { width: 200 });

      const htmlContent = `
        <html>
          <head>
            <title>Tiket ${ticket.eventTitle} - ${ticket.ticketCode}</title>
            <style>
              @page { size: auto; margin: 0mm; }
              body { font-family: Arial, sans-serif; padding: 40px; }
              .ticket { border: 2px solid #b31356; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; }
              .logo { font-size: 24px; font-weight: bold; color: #b31356; }
              .event-name { font-size: 20px; font-weight: bold; margin: 15px 0 10px; }
              .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .label { color: #6b7280; }
              .value { font-weight: 600; }
              .qr-section { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #cbd5e1; }
              .ticket-code { font-family: monospace; font-size: 18px; font-weight: bold; color: #b31356; margin-top: 15px; }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <div class="logo">KARTCIS.ID</div>
                <div class="event-name">${ticket.eventTitle}</div>
              </div>
              <div class="info-row"><span class="label">Tanggal</span><span class="value">${eventDate}</span></div>
              <div class="info-row"><span class="label">Waktu</span><span class="value">${eventTime} WIB</span></div>
              <div class="info-row"><span class="label">Lokasi</span><span class="value">${venue}</span></div>
              <div class="info-row"><span class="label">Jenis Tiket</span><span class="value">${ticketType}</span></div>
              <div class="info-row"><span class="label">Jumlah</span><span class="value">${quantity} tiket</span></div>
              <div class="info-row"><span class="label">Total Harga</span><span class="value">${totalPrice}</span></div>
              <div class="qr-section">
                <img src="${qrDataUrl}" alt="QR Code" style="width: 200px; height: 200px;" />
                <div class="ticket-code">${ticket.ticketCode}</div>
              </div>
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.title = `Tiket ${ticket.eventTitle} - ${ticket.ticketCode}`;
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 250);
      } else {
        alert('Pop-up blocked. Please allow pop-ups to download tickets.');
      }
    } catch (error) {
      console.error('Error downloading ticket:', error);
      alert('Terjadi kesalahan saat mendownload tiket. Silakan coba lagi.');
    }
  };

  return (
    <Card className={`relative overflow-hidden border gap-0 shadow-sm transition-shadow hover:shadow-md bg-white ${isCancelled ? 'border-gray-200 opacity-80' : 'border-gray-200'}`}>
      <div className="flex flex-col md:flex-row min-h-[160px]">
        {/* Event Image - Seamlessly fitted to corner using Card's overflow-hidden */}
        <div className="md:w-56 aspect-[16/9] md:aspect-auto relative bg-gray-100 flex-shrink-0">
          <img 
            src={ticket.eventImage || '/placeholder-event.jpg'} 
            alt={ticket.eventTitle}
            className={`w-full h-full object-cover ${isCancelled ? 'grayscale' : ''}`}
          />
          {/* Subtle overlay on image bottom for mobile */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent md:hidden" />
        </div>

        {/* Info Section */}
        <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="pr-4">
                <h3 
                  className={`text-lg md:text-xl font-bold mb-1.5 leading-tight ${ticket.eventId && onEventClick ? 'cursor-pointer hover:text-primary transition-colors' : ''} ${isCancelled ? 'text-gray-400' : 'text-slate-900'}`}
                  onClick={() => ticket.eventId && onEventClick?.(ticket.eventId)}
                >
                  {ticket.eventTitle}
                </h3>
                <div className="flex flex-wrap gap-2 items-center">
                  {isCancelled ? (
                    <Badge variant="destructive" className="bg-gray-900 text-white border-0 text-[10px] uppercase font-bold px-2 py-0">Dibatalkan</Badge>
                  ) : (
                    <Badge className={`text-[10px] uppercase font-bold px-2 py-0 border-0 ${isUpcoming ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                      {isUpcoming ? 'Akan Datang' : 'Selesai'}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] uppercase font-bold border-slate-200 text-slate-500 px-2 py-0">
                    {ticket.ticketType}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
              <div className={`flex items-center text-sm ${isCancelled ? 'text-gray-400' : 'text-slate-600'}`}>
                <Calendar className={`h-4 w-4 mr-2.5 flex-shrink-0 ${isCancelled ? 'text-gray-300' : 'text-primary'}`} />
                <span className="font-medium">{formatDate(ticket.eventDate)}</span>
              </div>
              <div className={`flex items-center text-sm ${isCancelled ? 'text-gray-400' : 'text-slate-600'}`}>
                <Clock className={`h-4 w-4 mr-2.5 flex-shrink-0 ${isCancelled ? 'text-gray-300' : 'text-primary'}`} />
                <span className="font-medium">{ticket.eventTime} WIB</span>
              </div>
              <div className={`flex items-center text-sm sm:col-span-2 ${isCancelled ? 'text-gray-400' : 'text-slate-600'}`}>
                <MapPin className={`h-4 w-4 mr-2.5 flex-shrink-0 ${isCancelled ? 'text-gray-300' : 'text-primary'}`} />
                <span className="font-medium line-clamp-1">{ticket.venue}, {ticket.city}</span>
              </div>
            </div>

            {/* Custom Field Responses */}
            {ticket.customFieldResponses && (() => {
              try {
                const responses = JSON.parse(ticket.customFieldResponses);
                const entries = Object.entries(responses);
                if (entries.length > 0) {
                  return (
                    <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest leading-none">Detail Tambahan</p>
                      <div className="space-y-1">
                        {entries.map(([key, value]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-slate-500">{key}:</span>
                            <span className={`font-bold ${isCancelled ? 'text-slate-400' : 'text-slate-700'}`}>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              } catch (e) {}
              return null;
            })()}
          </div>

          <div className="flex items-center justify-between pt-5 border-t border-slate-50 mt-5">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-0.5">Kode Tiket</p>
              <p className={`text-sm font-mono font-bold ${isCancelled ? 'text-slate-300' : 'text-primary'}`}>{ticket.ticketCode}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-0.5">{ticket.quantity} tiket</p>
              <p className={`text-lg font-bold ${isCancelled ? 'text-slate-300' : 'text-slate-900'}`}>{formatPrice(ticket.price * ticket.quantity)}</p>
            </div>
          </div>
        </div>

        {/* Dashed Divider Stub Section (Desktop Only) */}
        <div className="hidden md:flex relative w-12 items-center justify-center bg-slate-50/50">
          <div className="absolute inset-y-0 left-1/2 w-px border-r-2 border-dashed border-slate-200" />
          
          {/* Half-Circle Notches - Clipping achieved by Card's overflow-hidden */}
          <div className="absolute -top-5 left-1/2 -ml-5 w-10 h-10 rounded-full bg-gray-50 border border-slate-200" />
          <div className="absolute -bottom-5 left-1/2 -ml-5 w-10 h-10 rounded-full bg-gray-50 border border-slate-200" />
        </div>

        {/* Action Buttons Section */}
        {isUpcoming && !isCancelled ? (
          <div className="flex md:flex-col justify-center gap-4 p-6 border-t md:border-t-0 border-slate-100 md:w-52 bg-slate-50/30">
            <Button 
               onClick={onShowQR}
               className="flex-1 md:w-full h-14 bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 rounded-2xl flex flex-col items-center justify-center gap-0.5 group/btn transition-all active:scale-95"
            >
               <QrCode className="h-5 w-5 transition-transform group-hover/btn:scale-110" />
               <span className="text-[10px] font-black uppercase tracking-widest leading-none">QR Code</span>
            </Button>
            
            <Button 
               variant="outline"
               onClick={handleDownloadTicket}
               className="flex-1 md:w-full h-14 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95"
            >
               <Download className="h-5 w-5" />
               <span className="text-[10px] font-black uppercase tracking-widest leading-none">Download</span>
            </Button>
          </div>
        ) : (
          <div className="flex md:flex-col items-center justify-center gap-2 p-6 md:w-52 bg-slate-50/10 opacity-50">
             <div className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-sm">
                <QrCode className="h-6 w-6 text-slate-300" />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {isCancelled ? 'Dibatalkan' : 'Selesai'}
             </p>
          </div>
        )}
      </div>
    </Card>
  );
}
