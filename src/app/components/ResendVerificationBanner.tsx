import { useAuth } from '../contexts/AuthContext';

export function ResendVerificationBanner() {
  const { resendVerification, verificationCooldown, isResendingVerification } = useAuth();

  const handleResendClick = async () => {
    try {
      await resendVerification();
    } catch (error) {
      // Error is handled in the context
    }
  };

  return (
    <span>
      {' '}
      <button 
        onClick={handleResendClick} 
        disabled={verificationCooldown > 0 || isResendingVerification}
        className="text-amber-900 font-bold underline decoration-amber-400 hover:text-amber-700 disabled:no-underline disabled:text-amber-600/70 disabled:cursor-not-allowed transition-colors"
      >
        {isResendingVerification 
          ? '[Mengirim...]' 
          : verificationCooldown > 0 
            ? `[Kirim ulang dalam ${verificationCooldown}s]`
            : '[Klik di sini untuk kirim ulang email verifikasi]'
        }
      </button>
    </span>
  );
}
