import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Header } from "./components/Header";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { ForgotPassword } from "./components/ForgotPassword";
import { HelpModal } from "./components/HelpModal";
import { ScrollToTop } from "./components/ScrollToTop";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { EventsProvider } from "./contexts/EventsContext";
import { HomePage } from "./pages/HomePage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { PaymentPage } from "./pages/PaymentPage";
import { PaymentSuccessPage } from "./pages/PaymentSuccessPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsPage } from "./pages/TermsPage";
import { RefundPolicyPage } from "./pages/RefundPolicyPage";
import { HowToOrderPage } from "./pages/HowToOrderPage";
import { Footer } from "./components/Footer";
import { MyTicketsPage } from "./pages/MyTicketsPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ProfilePage } from "./pages/ProfilePage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { pendingOrderStorage } from "./utils/pendingOrderStorage";
import api from "./services/api";
import type { HelpModalType } from "./types/index";

// Protected Route Component - defined outside to prevent re-creation
// Protected Route Component - defined outside to prevent re-creation
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (!isAuthenticated) {
    return null;
  }
  
  return <>{children}</>;
}

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
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
    const checkPendingOrder = async () => {
      const active = pendingOrderStorage.getActive();
      if (active) {
        // If we have a pending order locally, verify its REAL status with the server
        try {
          const response = await api.orders.checkStatus(active.orderId);
          if (response.success && response.data) {
            const serverStatus = response.data.status;
            if (serverStatus !== 'pending') {
              // If it's no longer pending on the server, remove it locally
              pendingOrderStorage.remove(active.orderId);
              setPendingOrder(null);
              setPendingOrderTimeLeft(0); // Also reset time left
              return;
            }
          }
        } catch (error) {
          console.error("Background status check failed:", error);
        }

        setPendingOrder((prev: any) => {
          // Only update if actually changed to prevent re-renders
          if (prev?.orderId === active.orderId) return prev;
          return active;
        });
        setPendingOrderTimeLeft(prev => {
          const newTimeLeft = Math.max(0, Math.floor((active.expiryTime - Date.now()) / 1000));
          return prev === newTimeLeft ? prev : newTimeLeft;
        });
      } else {
        setPendingOrder((prev: any) => prev === null ? prev : null);
        setPendingOrderTimeLeft(prev => prev === 0 ? prev : 0);
      }
    };

    // Run check immediately on mount/update (refresh or navigation)
    checkPendingOrder();

    // Listen to storage changes and custom app event
    window.addEventListener('storage', checkPendingOrder);
    window.addEventListener('pending-orders-changed', checkPendingOrder);
    
    // Check every 2 minutes (120000ms) instead of frequently
    const interval = setInterval(checkPendingOrder, 120000);

    return () => {
      window.removeEventListener('storage', checkPendingOrder);
      window.removeEventListener('pending-orders-changed', checkPendingOrder);
      clearInterval(interval);
    };
  }, [location.pathname]);

  // Countdown timer for pending order
  useEffect(() => {
    if (!pendingOrder || pendingOrderTimeLeft <= 0) return;
    
    // Don't run countdown timer on admin page to prevent re-renders
    if (location.pathname === '/admin') return;

    const timer = setInterval(() => {
      setPendingOrderTimeLeft((prev: number) => {
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
  }, [pendingOrder, pendingOrderTimeLeft, location.pathname]);

  // When user logs out, keep showing their pending order if exists
  useEffect(() => {
    if (!isAuthenticated) {
      const activePendingOrder = pendingOrderStorage.getActive();
      if (activePendingOrder) {
        setPendingOrder(activePendingOrder);
      }
    } else {
      // Auto-close auth modals if user becomes authenticated
      if (showLogin) setShowLogin(false);
      if (showRegister) setShowRegister(false);
    }
  }, [isAuthenticated, showLogin, showRegister]);

  const handlePendingPaymentClick = () => {
    if (pendingOrder) {
      navigate(`/payment/${pendingOrder.orderId}`);
    }
  };



  // Always show header
  const showHeader = true;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" richColors />
      <ScrollToTop />
      
      {showHeader && (
        <Header
          onLoginClick={() => setShowLogin(true)}
          pendingPayment={
            pendingOrder && pendingOrderTimeLeft > 0 && !location.pathname.includes(`/payment/${pendingOrder.orderId}`)
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
        
        {/* Support & Legal Pages */}
        <Route path="/cara-pesan" element={<HowToOrderPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/kebijakan-privasi" element={<PrivacyPolicyPage />} />
        <Route path="/terms-conditions" element={<TermsPage />} />
        <Route path="/syarat-ketentuan" element={<TermsPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        <Route 
          path="/my-tickets" 
          element={
            <ProtectedRoute>
              <MyTicketsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
      </Routes>

      <Footer />

      {/* Login Modal */}
      {showLogin && (
        <Login
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
          onSwitchToForgotPassword={() => {
            setShowLogin(false);
            setShowForgotPassword(true);
          }}
        />
      )}

      {/* Register Modal */}
      {showRegister && (
        <Register
          isOpen={showRegister}
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <ForgotPassword
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
          onBackToLogin={() => {
            setShowForgotPassword(false);
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