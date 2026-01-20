import { User, Menu, X, LogIn, Clock, AlertCircle, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/app/utils/toast';

interface HeaderProps {
  onLoginClick: () => void;
  pendingPayment?: {
    orderId: string;
    timeLeft: number; // in seconds
    onClick: () => void;
  } | null;
}

export function Header({ onLoginClick, pendingPayment }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

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

  const handleMyTicketsClick = () => {
    navigate('/my-tickets');
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    navigate('/');
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
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
            <span className="text-xl font-semibold text-sky-600">KARTCIS.ID</span>
          </div>

          {/* Spacer for center alignment */}
          <div className="flex-1"></div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={handleMyTicketsClick} className="text-gray-700">
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
                  onClick={handleMyTicketsClick}
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