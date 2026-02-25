import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/app/utils/toast';

export function OauthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuth();

  useEffect(() => {
    // 1. Ambil token dari URL (?token=xxxx)
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      // 2. Simpan token ke localStorage (using auth_token to match existing logic)
      localStorage.setItem('auth_token', token);
      
      // 3. Update auth state
      checkAuth();
      
      // 4. Lempar ke Home (or specific page if needed)
      toast.success('Berhasil login dengan Google!');
      navigate('/');
    } else {
      // Jika gagal, balikkan ke home dengan error
      const error = params.get('error') || 'google_failed';
      toast.error('Gagal login dengan Google.');
      navigate(`/?error=${error}`);
    }
  }, [location, navigate, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary/60 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Memproses login...</p>
      </div>
    </div>
  );
}
