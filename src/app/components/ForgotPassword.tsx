
import { X, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useState } from 'react';
import { authApi } from '@/app/services/authApi';
import { toast } from '@/app/utils/toast';

interface ForgotPasswordProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

export function ForgotPassword({ isOpen, onClose, onBackToLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword(email);
      
      if (response.success) {
        setIsSuccess(true);
        toast.success(response.message || 'Link reset password telah dikirim ke email Anda.');
        setEmail('');
      } else {
        toast.error(response.message || 'Gagal mengirim email reset password.');
      }
    } catch (error) {
       toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-lg w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Lupa Password</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
             <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
                   <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Cek Email Anda</h3>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                   Kami telah mengirimkan instruksi untuk mereset password ke email yang Anda masukkan. Silakan cek inbox atau folder spam Anda.
                </p>
                <div className="space-y-3">
                   <Button 
                      onClick={onClose} 
                      className="w-full bg-primary hover:bg-primary-hover"
                   >
                      Tutup
                   </Button>
                   <Button 
                      onClick={onBackToLogin}
                      variant="outline" 
                      className="w-full"
                   >
                      Kembali ke Login
                   </Button>
                </div>
             </div>
          ) : (
             <>
               <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Masukkan alamat email yang terdaftar pada akun Anda. Kami akan mengirimkan link untuk mereset password Anda.
               </p>

               <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="mt-1.5 relative">
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        placeholder="nama@email.com"
                        disabled={isLoading}
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-hover"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                       <>
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         Mengirim...
                       </>
                    ) : (
                       'Kirim Link Reset'
                    )}
                  </Button>
               </form>

               <div className="mt-6 text-center pt-6 border-t border-gray-100">
                  <button 
                     type="button"
                     onClick={onBackToLogin} 
                     className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2 mx-auto transition-colors"
                  >
                     <ArrowLeft className="h-4 w-4" />
                     Kembali ke Login
                  </button>
               </div>
             </>
          )}
        </div>
      </div>
    </div>
  );
}
