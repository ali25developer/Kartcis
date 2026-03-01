import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function ResendVerificationBanner() {
  const { resendVerification } = useAuth();
  const [cooldown, setCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  const handleResendClick = async () => {
    if (cooldown > 0 || isLoading) return;

    setIsLoading(true);
    try {
      await resendVerification();
      setCooldown(60);
    } catch (error: any) {
      // Check if it's a rate limit error to start cooldown anyway
      if (error?.message?.includes('wait') || error?.message?.includes('tunggu')) {
        setCooldown(60);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <span>
      {' '}
      <button 
        onClick={handleResendClick} 
        disabled={cooldown > 0 || isLoading}
        className="text-amber-900 font-bold underline decoration-amber-400 hover:text-amber-700 disabled:no-underline disabled:text-amber-600/70 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading 
          ? '[Mengirim...]' 
          : cooldown > 0 
            ? `[Kirim ulang dalam ${cooldown}s]`
            : '[Klik di sini untuk kirim ulang email verifikasi]'
        }
      </button>
    </span>
  );
}
