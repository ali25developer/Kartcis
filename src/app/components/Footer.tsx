import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function Footer() {
  const [settings, setSettings] = useState({
    contact_email: 'support@kartcis.id',
    contact_phone: '(+62) 8312-7246-830',
    contact_address: 'Lorem ipsum, dolor sit amet consectetur adipisicing elit.',
    facebook_url: 'https://facebook.com/alirohmansyah25',
    twitter_url: 'https://twitter.com/alirohmansyah25',
    instagram_url: 'https://instagram.com/alirohmansyah25'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.settings.get();
        if (response && response.data) {
          setSettings(prev => ({
            ...prev,
            ...response.data
          }));
        }
      } catch (error) {
        console.error('Failed to load settings', error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & About */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="bg-[#ffd54c] p-1 rounded-md">
                <img src="/assets/logo.png" alt="Kartcis Logo" className="h-8 w-auto" />
              </div>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Platform pembelian tiket event terpercaya. Temukan dan beli tiket konser, workshop, dan event seru lainnya dengan mudah dan aman.
            </p>
            <div className="flex space-x-4">
              {settings.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings.twitter_url && (
                <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {settings.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Tautan Cepat</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link 
                  to="/" 
                  state={{ scrollTo: 'top' }}
                  className="text-gray-500 hover:text-primary transition-colors"
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link 
                  to="/" 
                  state={{ scrollTo: 'search' }}
                  className="text-gray-500 hover:text-primary transition-colors"
                >
                  Cari Event
                </Link>
              </li>
              <li>
                <Link to="/my-tickets" className="text-gray-500 hover:text-primary transition-colors">
                  Tiket Saya
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Dukungan & Legal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/cara-pesan" className="text-gray-500 hover:text-primary transition-colors">
                  Cara Pesan
                </Link>
              </li>
              <li>
                <Link to="/syarat-ketentuan" className="text-gray-500 hover:text-primary transition-colors">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link to="/kebijakan-privasi" className="text-gray-500 hover:text-primary transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-gray-500 hover:text-primary transition-colors">
                  Kebijakan Refund
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Hubungi Kami</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 text-gray-500">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>{settings.contact_address}</span>
              </li>
              <li className="flex items-center gap-3 text-gray-500">
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <span>{settings.contact_phone}</span>
              </li>
              <li className="flex items-center gap-3 text-gray-500">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <span>{settings.contact_email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Kartcis. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link to="/privacy-policy" className="hover:text-gray-600">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-gray-600">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
