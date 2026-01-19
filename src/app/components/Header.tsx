import { ShoppingCart, User, Search, Menu, X, Ticket, LogIn, Clock, AlertCircle, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/app/utils/toast';

interface HeaderProps {
  cartCount: number;
  onSearchChange: (value: string) => void;
  onCartClick: () => void;
  onMyTicketsClick: () => void;
  onLoginClick: () => void;
  searchValue: string;
  pendingPayment?: {
    orderId: string;
    timeLeft: number; // in seconds
    onClick: () => void;
  } | null;
}

export function Header({ cartCount, onSearchChange, onCartClick, onMyTicketsClick, onLoginClick, searchValue, pendingPayment }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Berhasil logout', {
      action: {
        label: 'Tutup',
        onClick: () => {},
      },
    });
    setIsMobileMenuOpen(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}j ${minutes}m`;
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-sky-600">KARTCIS.ID</span>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari event, lokasi..."
                className="pl-10 bg-gray-50 border-gray-200"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={onMyTicketsClick} className="text-gray-700">
                  <User className="h-5 w-5 mr-2" />
                  {user?.name || 'Tiket Saya'}
                </Button>
                <Button variant="ghost" onClick={handleLogout} className="text-gray-700">
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={onLoginClick} className="text-gray-700">
                <LogIn className="h-5 w-5 mr-2" />
                Login
              </Button>
            )}
            <Button variant="ghost" onClick={onCartClick} className="relative text-gray-700">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 border-0">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari event..."
              className="pl-10 bg-gray-50 border-gray-200"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            {isAuthenticated ? (
              <div className="space-y-1">
                <div className="px-4 py-2 text-sm text-gray-600">
                  Halo, <span className="font-medium text-gray-900">{user?.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => { onMyTicketsClick(); setIsMobileMenuOpen(false); }}
                  className="w-full justify-start text-gray-700"
                >
                  <User className="h-5 w-5 mr-2" />
                  Tiket Saya
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="w-full justify-start text-gray-700"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }}
                className="w-full justify-start text-gray-700"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Login
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={() => { onCartClick(); setIsMobileMenuOpen(false); }}
              className="w-full justify-start text-gray-700 relative"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Keranjang
              {cartCount > 0 && (
                <Badge className="ml-2 h-5 px-2 bg-red-500 border-0">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Pending Payment Banner */}
      {pendingPayment && (
        <div 
          onClick={pendingPayment.onClick}
          className="bg-amber-500 text-white cursor-pointer hover:bg-amber-600 transition-colors"
        >
          <div className="container mx-auto px-4 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span className="font-medium text-sm">Menunggu Pembayaran</span>
                  <span className="text-xs sm:text-sm opacity-90">
                    Order #{pendingPayment.orderId}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="font-semibold text-sm">{formatTime(pendingPayment.timeLeft)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}