import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { api } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { toast } from 'sonner';
import { Save, Loader2, Facebook, Twitter, Instagram, Mail, Phone, MapPin, Settings, Percent, Wallet } from 'lucide-react';

export function AdminSettings({ activeTab }: { activeTab?: string }) {
  const [settings, setSettings] = useState({
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    fee_percentage: '5.0'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      const response = await api.settings.get();
      // Need to cast or check type because ApiResponse can be generic
      // Assuming response.data is Record<string, string>
      if (response && response.data) {
        setSettings(prev => ({
            ...prev,
            ...response.data
        }));
      }
    } catch (error) {
      toast.error('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.settings.update(settings);
      toast.success('Pengaturan berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Pengaturan Situs
          </h2>
          <p className="text-gray-500 mt-1">Kelola informasi kontak dan tautan sosial media yang tampil di footer.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary-hover text-white">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Simpan Perubahan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Configuration */}
        <Card className="p-6 border-t-4 border-t-green-500 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b pb-2">
             <Wallet className="h-5 w-5 text-green-600" />
             Konfigurasi Bisnis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Global Admin Fee (%)</label>
              <div className="relative">
                <Percent className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  className="pl-10"
                  type="number"
                  min="0"
                  step="0.1"
                  value={settings.fee_percentage} 
                  onChange={e => handleChange('fee_percentage', e.target.value)} 
                  placeholder="5.0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Biaya ini akan diterapkan untuk semua event, kecuali jika EO memiliki biaya khusus.</p>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6 border-t-4 border-t-primary">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b pb-2">
            <Mail className="h-5 w-5 text-primary" />
            Informasi Kontak
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Support</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  className="pl-10"
                  value={settings.contact_email} 
                  onChange={e => handleChange('contact_email', e.target.value)} 
                  placeholder="support@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  className="pl-10"
                  value={settings.contact_phone} 
                  onChange={e => handleChange('contact_phone', e.target.value)} 
                  placeholder="(+62) ..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Kantor</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea 
                  className="pl-10 min-h-[100px]"
                  value={settings.contact_address} 
                  onChange={e => handleChange('contact_address', e.target.value)} 
                  placeholder="Alamat lengkap..."
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Social Media */}
        <Card className="p-6 border-t-4 border-t-blue-500">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b pb-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Sosial Media
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
              <div className="relative">
                <Facebook className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  className="pl-10"
                  value={settings.facebook_url} 
                  onChange={e => handleChange('facebook_url', e.target.value)} 
                  placeholder="https://facebook.com/..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Twitter (X) URL</label>
              <div className="relative">
                <Twitter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  className="pl-10"
                  value={settings.twitter_url} 
                  onChange={e => handleChange('twitter_url', e.target.value)} 
                  placeholder="https://twitter.com/..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
              <div className="relative">
                <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  className="pl-10"
                  value={settings.instagram_url} 
                  onChange={e => handleChange('instagram_url', e.target.value)} 
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
