
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Phone, Lock, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card } from '@/app/components/ui/card';
import { toast } from 'sonner';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    password_confirmation?: string;
  }>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
      toast.error('Anda harus login untuk mengakses halaman ini');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Pre-fill form data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    }

    if (!formData.email) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.phone) {
      newErrors.phone = 'Nomor HP wajib diisi';
    } else if (!/^08\d{8,12}$/.test(formData.phone)) {
        // Adjust regex as needed
        // newErrors.phone = 'Format nomor HP tidak valid';
    }

    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'Password minimal 6 karakter';
      }
      if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = 'Konfirmasi password tidak cocok';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Only send password if text is entered
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        ...(formData.password ? { 
            password: formData.password, 
            password_confirmation: formData.password_confirmation 
        } : {})
      };

      await updateProfile(payload);
      
      // Clear password fields on success
      setFormData(prev => ({
        ...prev,
        password: '',
        password_confirmation: ''
      }));
      
    } catch (error) {
      // Error is handled in context/api
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
        <div className="min-h-screen pt-24 pb-12 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
           <div className="p-6 border-b bg-gradient-to-r from-primary to-primary-hover">
            <h1 className="text-3xl font-bold text-white">Profil Saya</h1>
            <p className="text-sky-100 mt-1">
              Kelola informasi pribadi dan keamanan akun Anda
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">
                Informasi Pribadi
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    Nama Lengkap
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={errors.name ? 'border-red-500' : ''}
                    placeholder="Nama Lengkap Anda"
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={errors.email ? 'border-red-500' : ''}
                    placeholder="email@contoh.com"
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    Nomor Telepon
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className={errors.phone ? 'border-red-500' : ''}
                    placeholder="08xxxxxxxxxx"
                  />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-4 pt-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2 bg-yellow-50 p-2 rounded text-yellow-800 border-yellow-200">
                <Lock className="h-5 w-5" />
                Ganti Password
                <span className="text-xs font-normal ml-auto text-yellow-700">Isi hanya jika ingin mengubah password</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password Baru</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                      placeholder="Minimal 6 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_confirmation">Konfirmasi Password</Label>
                  <div className="relative">
                    <Input
                      id="password_confirmation"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.password_confirmation}
                      onChange={(e) => setFormData(prev => ({ ...prev, password_confirmation: e.target.value }))}
                      className={errors.password_confirmation ? 'border-red-500 pr-10' : 'pr-10'}
                      placeholder="Ulangi password baru"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password_confirmation && <p className="text-xs text-red-500">{errors.password_confirmation}</p>}
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary-hover min-w-[120px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
