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
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsPage } from "./pages/TermsPage";
import { RefundPolicyPage } from "./pages/RefundPolicyPage";
import { HowToOrderPage } from "./pages/HowToOrderPage";
import { Footer } from "./components/Footer";
import { MyTicketsPage } from "./pages/MyTicketsPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ProfilePage } from "./pages/ProfilePage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { OauthCallbackPage } from "./pages/OauthCallbackPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { pendingOrderStorage } from "./utils/pendingOrderStorage";
import api from "./services/api";
import type { HelpModalType } from "./types/index";

// Protected Route Component - defined outside to prevent re-creation
// Protected Route Component - defined outside to prevent re-creation
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, resendVerification } = useAuth();
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
  
  if (user && user.email_verified_at === null) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-5">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Verifikasi Email Diperlukan</h2>
          <p className="text-gray-600 mb-8 text-sm leading-relaxed">
            Halaman ini hanya dapat diakses oleh akun yang sudah memverifikasi emailnya. 
            Silakan cek kotak masuk email Anda dan klik link verifikasi yang telah kami kirimkan demi keamanan akun Anda.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => resendVerification()} 
              className="w-full bg-[#ffd54c] hover:bg-[#e6bf44] text-gray-900 font-bold py-3 px-4 rounded-lg transition-colors shadow-sm"
            >
              Kirim Ulang Email Verifikasi
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors shadow-sm"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  
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
      
      // If user is logged in, ensure the pending order belongs to them
      if (active && isAuthenticated && user && active.customerInfo?.email !== user.email) {
        setPendingOrder(null);
        setPendingOrderTimeLeft(0);
        return;
      }

      if (active) {
        // If we have a pending order locally, verify its REAL status with the server
        // Skip background check if we are already on the checkout or payment page to avoid duplication
        const isPaymentPage = location.pathname.includes('/payment/') || location.pathname === '/checkout';
        
        if (!isPaymentPage) {
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
  }, [location.pathname, isAuthenticated, user?.email]);

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
        
        {/* Support & Legal Pages */}
        <Route path="/cara-pesan" element={<HowToOrderPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/kebijakan-privasi" element={<PrivacyPolicyPage />} />
        <Route path="/terms-conditions" element={<TermsPage />} />
        <Route path="/syarat-ketentuan" element={<TermsPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/oauth/callback" element={<OauthCallbackPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        
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