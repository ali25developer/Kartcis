
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card } from '@/app/components/ui/card';
import { authApi } from '@/app/services/authApi';
import { toast } from 'sonner';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !email) {
      setError('Link reset password tidak valid atau kedaluwarsa.');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token || !email) {
       setError('Token tidak valid.');
       return;
    }

    if (formData.password.length < 6) {
       setError('Password minimal 6 karakter.');
       return;
    }

    if (formData.password !== formData.confirmPassword) {
       setError('Konfirmasi password tidak cocok.');
       return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.resetPassword({
        email,
        token,
        password: formData.password,
        password_confirmation: formData.confirmPassword
      });

      if (response.success) {
        toast.success('Password berhasil diubah, silakan login kembali.');
        navigate('/');
        // Optionally trigger login modal if possible, but redirecting to home is fine for now.
        // The user can click login there.
      } else {
        setError(response.message || 'Gagal mereset password.');
        toast.error(response.message || 'Gagal mereset password.');
      }
    } catch (err) {
       setError('Terjadi kesalahan saat mereset password.');
       toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
     return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
           <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                 <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Link Tidak Valid</h2>
              <p className="text-gray-500 mb-6">Link reset password tidak valid atau sudah kedaluwarsa.</p>
              <Button onClick={() => navigate('/')} variant="outline">
                 Kembali ke Beranda
              </Button>
           </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Buat password baru untuk akun Anda.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 shadow sm:rounded-lg sm:px-10 border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
               <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
               </div>
            )}

            <div>
              <Label htmlFor="password">Password Baru</Label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pr-10"
                  placeholder="Minimal 6 karakter"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
              <div className="mt-1 relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pr-10"
                  placeholder="Ulangi password baru"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                   {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover"
                disabled={isLoading}
              >
                {isLoading ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Menyimpan...
                   </>
                ) : (
                   'Simpan Password'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
             <button 
                onClick={() => navigate('/')} 
                className="font-medium text-primary hover:text-primary-light0 flex items-center justify-center gap-1 mx-auto"
                type="button"
             >
                <ArrowLeft className="h-4 w-4" />
                Batal
             </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
