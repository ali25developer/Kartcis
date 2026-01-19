import { X, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

export interface CartItem {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  eventTitle: string;
  eventDate: string;
  ticketTypeName: string;
  ticketPrice: number;
  eventImage: string;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (eventId: string, ticketTypeId: string, newQuantity: number) => void;
  onRemoveItem: (eventId: string, ticketTypeId: string) => void;
  onCheckout: () => void;
}

export function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem, onCheckout }: CartProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const totalPrice = items.reduce((sum, item) => sum + (item.ticketPrice * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30"
        onClick={onClose}
      />
      
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full md:w-[450px] bg-white shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">Keranjang</h2>
              {totalItems > 0 && (
                <span className="bg-sky-600 text-white text-sm px-2.5 py-1 rounded-full">
                  {totalItems}
                </span>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart className="h-16 w-16 text-gray-300 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Keranjang Kosong</h3>
                <p className="text-gray-600 text-sm">Yuk, mulai pilih tiket event favoritmu!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <Card key={`${item.eventId}-${item.ticketTypeId}`} className="p-3 border-gray-200">
                    <div className="flex gap-3">
                      <img 
                        src={item.eventImage} 
                        alt={item.eventTitle}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {item.eventTitle}
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">
                          {formatDate(item.eventDate)}
                        </p>
                        <p className="text-sm text-sky-600 font-medium">
                          {item.ticketTypeName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-gray-300"
                          onClick={() => onUpdateQuantity(item.eventId, item.ticketTypeId, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold text-gray-900 w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-gray-300"
                          onClick={() => onUpdateQuantity(item.eventId, item.ticketTypeId, item.quantity + 1)}
                          disabled={item.quantity >= 10}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm">
                          {formatPrice(item.ticketPrice * item.quantity)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onRemoveItem(item.eventId, item.ticketTypeId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-600">Total ({totalItems} tiket)</span>
                <span className="text-xl font-bold text-gray-900">{formatPrice(totalPrice)}</span>
              </div>
              <Button 
                onClick={onCheckout}
                className="w-full bg-sky-600 hover:bg-sky-700"
              >
                Lanjut ke Pembayaran
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}