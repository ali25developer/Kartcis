import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../services/authApi';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ResendVerificationBanner } from '../components/ResendVerificationBanner';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  const hasFetched = useRef(false);

  useEffect(() => {
    // strict mode wrapper
    if (hasFetched.current) return;
    hasFetched.current = true;

    const verify = async () => {
      if (!email || !token) {
        setStatus('error');
        setMessage('Link verifikasi tidak valid. Parameter email atau token hilang.');
        return;
      }

      try {
        const response = await authApi.verifyEmail(email, token);
        if (response.success) {
          setStatus('success');
          setMessage(response.message || 'Email berhasil diverifikasi.');
        } else {
          setStatus('error');
          setMessage(response.message || 'Link verifikasi tidak valid atau sudah kadaluarsa.');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Terjadi kesalahan saat memverifikasi email.');
      }
    };

    verify();
  }, [email, token]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verifikasi Email
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 flex flex-col items-center text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Memverifikasi...</h3>
              <p className="mt-2 text-sm text-gray-500">
                Mohon tunggu sebentar sementara kami memverifikasi email Anda.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Verifikasi Berhasil!</h3>
              <p className="mt-2 text-sm text-gray-500 mb-6">
                {message}
              </p>
              <Button onClick={() => navigate('/my-tickets')} className="w-full">
                Ke Dasbor Tiket Saya
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Verifikasi Gagal</h3>
              <p className="mt-2 text-sm text-gray-500 mb-6">
                {message}
              </p>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full mb-3">
                Kembali ke Beranda
              </Button>
              <div className="text-sm mt-2 text-gray-600">
                Butuh link baru? <ResendVerificationBanner />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
