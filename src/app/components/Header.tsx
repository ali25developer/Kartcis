import { User, Menu, X, LogIn, Clock, LogOut, Shield, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    if (seconds <= 0) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (hours > 0) parts.push(hours.toString().padStart(2, '0'));
    parts.push(minutes.toString().padStart(2, '0'));
    parts.push(secs.toString().padStart(2, '0'));
    
    return parts.join(':');
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
                {user?.role === 'admin' && (
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      navigate('/admin');
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                  >
                    <Shield className="h-5 w-5 mr-2" />
                    Admin
                  </Button>
                )}
                <Button variant="ghost" onClick={handleMyTicketsClick} className="text-gray-700">
                  <User className="h-5 w-5 mr-2" />
                  { 'Tiket Saya'}
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
                {user?.role === 'admin' && (
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      navigate('/admin');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                  >
                    <Shield className="h-5 w-5 mr-2" />
                    Admin Dashboard
                  </Button>
                )}
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
          className="bg-gradient-to-r from-amber-500 to-orange-600 text-white cursor-pointer hover:from-amber-600 hover:to-orange-700 transition-all shadow-md animate-in slide-in-from-top duration-500"
        >
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-full animate-pulse">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-3">
                  <span className="font-bold text-sm tracking-wide">MENUNGGU PEMBAYARAN</span>
                  <div className="flex items-center gap-1.5 opacity-90 text-xs">
                    <span className="bg-white/10 px-2 py-0.5 rounded">#{pendingPayment.orderId}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-black/10 px-3 py-1 rounded-lg border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-white/70">Sisa Waktu:</span>
                  <span className="font-mono font-bold text-sm tabular-nums">
                    {formatTime(pendingPayment.timeLeft)}
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-xs font-bold border-l border-white/20 pl-4">
                  BAYAR SEKARANG
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}