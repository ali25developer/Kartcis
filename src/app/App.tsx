import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router";
import { Toaster } from "sonner";
import { Header } from "./components/Header";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { HelpModal } from "./components/HelpModal";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { EventsProvider } from "./contexts/EventsContext";
import { HomePage } from "./pages/HomePage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { PaymentPage } from "./pages/PaymentPage";
import { PaymentSuccessPage } from "./pages/PaymentSuccessPage";
import { MyTicketsPage } from "./pages/MyTicketsPage";
import { pendingOrderStorage } from "./utils/pendingOrderStorage";
import type { HelpModalType } from "./types";

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [helpModalType, setHelpModalType] = useState<HelpModalType | null>(null);
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [pendingOrderTimeLeft, setPendingOrderTimeLeft] = useState<number>(0);

  // Load pending order from localStorage on mount (for all users)
  useEffect(() => {
    const activePendingOrder = pendingOrderStorage.getActive();
    if (activePendingOrder) {
      setPendingOrder(activePendingOrder);
      // Calculate time left
      const timeLeft = Math.floor((activePendingOrder.expiryTime - Date.now()) / 1000);
      setPendingOrderTimeLeft(timeLeft > 0 ? timeLeft : 0);
    }
  }, []);

  // Listen for storage changes to update pending order state
  useEffect(() => {
    const checkPendingOrder = () => {
      const activePendingOrder = pendingOrderStorage.getActive();
      if (activePendingOrder) {
        setPendingOrder(activePendingOrder);
        const timeLeft = Math.floor((activePendingOrder.expiryTime - Date.now()) / 1000);
        setPendingOrderTimeLeft(timeLeft > 0 ? timeLeft : 0);
      } else {
        setPendingOrder(null);
        setPendingOrderTimeLeft(0);
      }
    };

    // Listen to custom event for pending order changes
    window.addEventListener('storage', checkPendingOrder);
    
    // Also check periodically in case of same-tab changes
    const interval = setInterval(checkPendingOrder, 1000);

    return () => {
      window.removeEventListener('storage', checkPendingOrder);
      clearInterval(interval);
    };
  }, []);

  // Countdown timer for pending order
  useEffect(() => {
    if (!pendingOrder || pendingOrderTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setPendingOrderTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          // Order expired
          pendingOrderStorage.updateStatus(pendingOrder.orderId, 'expired');
          setPendingOrder(null);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingOrder, pendingOrderTimeLeft]);

  // When user logs out, keep showing their pending order if exists
  useEffect(() => {
    if (!isAuthenticated) {
      const activePendingOrder = pendingOrderStorage.getActive();
      if (activePendingOrder) {
        setPendingOrder(activePendingOrder);
      }
    }
  }, [isAuthenticated]);

  const handlePendingPaymentClick = () => {
    if (pendingOrder) {
      navigate(`/payment/${pendingOrder.orderId}`);
    }
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
  };

  const handleRegisterSuccess = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  // Protected Route wrapper - use Navigate instead of setState
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
      if (!isAuthenticated) {
        setShowLogin(true);
      }
    }, []);

    if (!isAuthenticated) {
      return null;
    }
    return <>{children}</>;
  };

  // Hide header on payment pages for cleaner UX
  const showHeader = !location.pathname.startsWith('/payment/');

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" richColors />
      
      {showHeader && (
        <Header
          onLoginClick={() => setShowLogin(true)}
          pendingPayment={
            pendingOrder && pendingOrderTimeLeft > 0
              ? {
                  orderId: pendingOrder.orderId,
                  timeLeft: pendingOrderTimeLeft,
                  onClick: handlePendingPaymentClick
                }
              : null
          }
        />
      )}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/event/:eventId" element={<EventDetailPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/payment/:orderId" element={<PaymentPage />} />
        <Route path="/payment/success/:orderId" element={<PaymentSuccessPage />} />
        <Route 
          path="/my-tickets" 
          element={
            <ProtectedRoute>
              <MyTicketsPage />
            </ProtectedRoute>
          } 
        />
      </Routes>

      {/* Login Modal */}
      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
          onRegisterClick={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}

      {/* Register Modal */}
      {showRegister && (
        <Register
          onClose={() => setShowRegister(false)}
          onSuccess={handleRegisterSuccess}
          onLoginClick={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}

      {/* Help Modal */}
      {helpModalType && (
        <HelpModal
          type={helpModalType}
          onClose={() => setHelpModalType(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EventsProvider>
          <AppLayout />
        </EventsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}