import { X, Building2, CreditCard, Wallet, ChevronDown, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { CartItem } from './Cart';
import { useState, useMemo } from 'react';
import { toast } from '@/app/utils/toast';
import { events } from '../data/events';
import { useAuth } from '../contexts/AuthContext';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onComplete: () => void;
  onShowVirtualAccount?: (bank: string, amount: number, customerInfo: { name: string; email: string; phone: string }) => void;
}

type PaymentMethod = 'virtual_account' | 'credit_card' | 'ewallet';

interface RegistrationData {
  [key: string]: string;
}

export function Checkout({ isOpen, onClose, items, onComplete, onShowVirtualAccount }: CheckoutProps) {
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });
  const [registrationForms, setRegistrationForms] = useState<{[key: string]: RegistrationData[]}>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('virtual_account');
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [selectedEwallet, setSelectedEwallet] = useState<string>('');
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  // Get events that need registration forms
  const itemsWithForms = useMemo(() => {
    return items.map(item => {
      const event = events.find(e => e.id === item.eventId);
      return {
        ...item,
        registrationForm: event?.registrationForm
      };
    }).filter(item => item.registrationForm && item.registrationForm.length > 0);
  }, [items]);

  // Initialize registration forms
  useMemo(() => {
    const initialForms: {[key: string]: RegistrationData[]} = {};
    itemsWithForms.forEach(item => {
      const key = `${item.eventId}-${item.ticketTypeId}`;
      if (!registrationForms[key]) {
        initialForms[key] = Array(item.quantity).fill(null).map(() => ({}));
      }
    });
    if (Object.keys(initialForms).length > 0) {
      setRegistrationForms(prev => ({ ...prev, ...initialForms }));
    }
  }, [itemsWithForms]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const totalPrice = items.reduce((sum, item) => sum + (item.ticketPrice * item.quantity), 0);
  const serviceFee = totalPrice * 0.05;
  const grandTotal = totalPrice + serviceFee;

  const updateRegistrationField = (itemKey: string, participantIndex: number, fieldId: string, value: string) => {
    setRegistrationForms(prev => ({
      ...prev,
      [itemKey]: prev[itemKey]?.map((form, index) => 
        index === participantIndex ? { ...form, [fieldId]: value } : form
      ) || []
    }));
  };

  const validateRegistrationForms = () => {
    for (const item of itemsWithForms) {
      const key = `${item.eventId}-${item.ticketTypeId}`;
      const forms = registrationForms[key] || [];
      
      for (let i = 0; i < item.quantity; i++) {
        const participantForm = forms[i] || {};
        const requiredFields = item.registrationForm?.filter(f => f.required) || [];
        
        for (const field of requiredFields) {
          if (!participantForm[field.fieldId] || participantForm[field.fieldId].trim() === '') {
            toast.error(`Mohon lengkapi ${field.label} untuk ${item.eventTitle} - Peserta ${i + 1}`, {
              action: {
                label: 'Tutup',
                onClick: () => {},
              },
            });
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate registration forms first
    if (itemsWithForms.length > 0 && !validateRegistrationForms()) {
      return;
    }
    
    // Validate payment method selection
    if (paymentMethod === 'virtual_account' && !selectedBank) {
      toast.error('Pilih bank untuk Virtual Account', {
        action: {
          label: 'Tutup',
          onClick: () => {},
        },
      });
      return;
    }
    
    if (paymentMethod === 'ewallet' && !selectedEwallet) {
      toast.error('Pilih e-wallet untuk pembayaran', {
        action: {
          label: 'Tutup',
          onClick: () => {},
        },
      });
      return;
    }
    
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      
      // For Virtual Account, show VA detail page
      if (paymentMethod === 'virtual_account' && onShowVirtualAccount) {
        onShowVirtualAccount(selectedBank, grandTotal, { name: formData.fullName, email: formData.email, phone: formData.phone });
        onClose();
      } else {
        // For other payment methods
        toast.success('Pembayaran berhasil!', {
          action: {
            label: 'Tutup',
            onClick: () => {},
          },
        });
        onComplete();
        onClose();
      }
    }, 2000);
  };

  const renderField = (field: any, itemKey: string, participantIndex: number, value: string) => {
    const fieldId = `${itemKey}-${participantIndex}-${field.fieldId}`;
    
    switch (field.type) {
      case 'select':
        return (
          <div key={fieldId}>
            <Label htmlFor={fieldId} className="mb-1.5">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <select
              id={fieldId}
              required={field.required}
              value={value || ''}
              onChange={(e) => updateRegistrationField(itemKey, participantIndex, field.fieldId, e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="">Pilih {field.label}</option>
              {field.options?.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );
      
      case 'textarea':
        return (
          <div key={fieldId}>
            <Label htmlFor={fieldId} className="mb-1.5">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <textarea
              id={fieldId}
              required={field.required}
              value={value || ''}
              onChange={(e) => updateRegistrationField(itemKey, participantIndex, field.fieldId, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
            />
          </div>
        );
      
      default:
        return (
          <div key={fieldId}>
            <Label htmlFor={fieldId} className="mb-1.5">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={fieldId}
              type={field.type}
              required={field.required}
              value={value || ''}
              onChange={(e) => updateRegistrationField(itemKey, participantIndex, field.fieldId, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen py-8 px-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="max-w-4xl mx-auto bg-white rounded-lg overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Pembayaran</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - Form */}
              <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Registration Forms */}
                  {itemsWithForms.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-sky-600" />
                        Data Peserta
                      </h3>
                      <div className="space-y-6">
                        {itemsWithForms.map(item => {
                          const itemKey = `${item.eventId}-${item.ticketTypeId}`;
                          return (
                            <div key={itemKey} className="space-y-4">
                              <div className="bg-sky-50 p-3 rounded-lg border border-sky-200">
                                <p className="font-medium text-gray-900">{item.eventTitle}</p>
                                <p className="text-sm text-gray-600">{item.ticketTypeName} - {item.quantity} tiket</p>
                              </div>
                              
                              {Array(item.quantity).fill(null).map((_, participantIndex) => (
                                <Card key={participantIndex} className="p-4 border-gray-200">
                                  <p className="font-medium text-gray-900 mb-3">Peserta {participantIndex + 1}</p>
                                  <div className="space-y-3">
                                    {item.registrationForm?.map(field => {
                                      const formData = registrationForms[itemKey]?.[participantIndex] || {};
                                      return renderField(field, itemKey, participantIndex, formData[field.fieldId] || '');
                                    })}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Buyer Data */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-sky-600" />
                      Data Pemesan
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fullName" className="mb-1.5">Nama Lengkap</Label>
                        <Input
                          id="fullName"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Nama sesuai KTP"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="mb-1.5">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@example.com"
                        />
                        {!isAuthenticated && (
                          <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-md">
                            <p className="text-xs text-amber-800">
                              <span className="font-medium">E-ticket akan dikirim ke email ini.</span> Pastikan email sudah benar.
                            </p>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="phone" className="mb-1.5">Nomor HP</Label>
                        <Input
                          id="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="08123456789"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-sky-600" />
                      Metode Pembayaran
                    </h3>
                    
                    {/* Payment Method Selection */}
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={() => setShowPaymentOptions(!showPaymentOptions)}
                        className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-sky-500 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {paymentMethod === 'virtual_account' && <Building2 className="h-5 w-5 text-sky-600" />}
                          {paymentMethod === 'credit_card' && <CreditCard className="h-5 w-5 text-sky-600" />}
                          {paymentMethod === 'ewallet' && <Wallet className="h-5 w-5 text-sky-600" />}
                          <div className="text-left">
                            <div className="font-medium text-gray-900">
                              {paymentMethod === 'virtual_account' && 'Transfer Bank (Virtual Account)'}
                              {paymentMethod === 'credit_card' && 'Kartu Kredit / Debit'}
                              {paymentMethod === 'ewallet' && 'E-Wallet'}
                            </div>
                            {paymentMethod === 'virtual_account' && selectedBank && (
                              <div className="text-sm text-gray-600">{selectedBank}</div>
                            )}
                            {paymentMethod === 'ewallet' && selectedEwallet && (
                              <div className="text-sm text-gray-600">{selectedEwallet}</div>
                            )}
                          </div>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showPaymentOptions ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Payment Options Dropdown */}
                      {showPaymentOptions && (
                        <div className="mt-2 border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
                          {/* Virtual Account */}
                          <div>
                            <div
                              onClick={() => setPaymentMethod('virtual_account')}
                              className="w-full text-left cursor-pointer"
                            >
                              <div className={`p-3 rounded-lg border-2 transition-colors ${paymentMethod === 'virtual_account' ? 'border-sky-600 bg-sky-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                <div className="font-medium text-gray-900 mb-1">Transfer Bank (Virtual Account)</div>
                                <p className="text-sm text-gray-600 mb-3">Transfer melalui ATM, Internet Banking & Mobile Banking</p>
                                
                                {paymentMethod === 'virtual_account' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {['BCA', 'Mandiri', 'BNI', 'BRI', 'Permata'].map((bank) => (
                                      <div
                                        key={bank}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedBank(bank);
                                        }}
                                        className={`p-2 text-sm rounded border transition-colors cursor-pointer ${selectedBank === bank ? 'border-sky-600 bg-sky-50 text-sky-600 font-medium' : 'border-gray-300 bg-white text-gray-700 hover:border-sky-300'}`}
                                      >
                                        {bank}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Credit/Debit Card */}
                          <div>
                            <div
                              onClick={() => setPaymentMethod('credit_card')}
                              className="w-full text-left cursor-pointer"
                            >
                              <div className={`p-3 rounded-lg border-2 transition-colors ${paymentMethod === 'credit_card' ? 'border-sky-600 bg-sky-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                <div className="font-medium text-gray-900 mb-1">Kartu Kredit / Debit</div>
                                <p className="text-sm text-gray-600">Masukkan informasi kartu untuk pembayaran praktis</p>
                              </div>
                            </div>
                          </div>

                          {/* E-Wallet */}
                          <div>
                            <div
                              onClick={() => setPaymentMethod('ewallet')}
                              className="w-full text-left cursor-pointer"
                            >
                              <div className={`p-3 rounded-lg border-2 transition-colors ${paymentMethod === 'ewallet' ? 'border-sky-600 bg-sky-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                <div className="font-medium text-gray-900 mb-1">E-Wallet</div>
                                <p className="text-sm text-gray-600 mb-3">Bayar instan lewat dompet digital</p>
                                
                                {paymentMethod === 'ewallet' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {['DANA', 'GoPay', 'ShopeePay', 'LinkAja', 'OVO'].map((wallet) => (
                                      <div
                                        key={wallet}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedEwallet(wallet);
                                        }}
                                        className={`p-2 text-sm rounded border transition-colors cursor-pointer ${selectedEwallet === wallet ? 'border-sky-600 bg-sky-50 text-sky-600 font-medium' : 'border-gray-300 bg-white text-gray-700 hover:border-sky-300'}`}
                                      >
                                        {wallet}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Payment Details Form - Only show for credit card */}
                    {paymentMethod === 'credit_card' && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cardNumber" className="mb-1.5">Nomor Kartu</Label>
                          <Input
                            id="cardNumber"
                            required
                            value={formData.cardNumber}
                            onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiryDate" className="mb-1.5">Berlaku Hingga</Label>
                            <Input
                              id="expiryDate"
                              required
                              value={formData.expiryDate}
                              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                              placeholder="MM/YY"
                              maxLength={5}
                            />
                          </div>
                          <div>
                            <Label htmlFor="cvv" className="mb-1.5">CVV</Label>
                            <Input
                              id="cvv"
                              required
                              value={formData.cvv}
                              onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                              placeholder="123"
                              maxLength={3}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Info for Virtual Account */}
                    {paymentMethod === 'virtual_account' && selectedBank && (
                      <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-lg">
                        <p className="text-sm text-gray-700">
                          Nomor Virtual Account {selectedBank} akan ditampilkan setelah checkout.
                        </p>
                      </div>
                    )}

                    {/* Info for E-Wallet */}
                    {paymentMethod === 'ewallet' && selectedEwallet && (
                      <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-lg">
                        <p className="text-sm text-gray-700">
                          Anda akan diarahkan ke aplikasi {selectedEwallet} untuk menyelesaikan pembayaran.
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-sky-600 hover:bg-sky-700"
                  >
                    {isProcessing ? 'Memproses...' : `Bayar ${formatPrice(grandTotal)}`}
                  </Button>
                </form>
              </div>

              {/* Right Column - Order Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Ringkasan Pesanan</h3>
                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <Card key={`${item.eventId}-${item.ticketTypeId}`} className="p-4 border-gray-200">
                      <div className="flex gap-3 mb-3">
                        <img 
                          src={item.eventImage} 
                          alt={item.eventTitle}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">
                            {item.eventTitle}
                          </h4>
                          <p className="text-xs text-sky-600">
                            {item.ticketTypeName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{item.quantity}x {formatPrice(item.ticketPrice)}</span>
                        <span className="font-semibold text-gray-900">
                          {formatPrice(item.ticketPrice * item.quantity)}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Biaya Layanan</span>
                    <span>{formatPrice(serviceFee)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                    <span>Total</span>
                    <span>{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-sky-50 border border-sky-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    ✉️ E-ticket akan dikirim ke email setelah pembayaran berhasil.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}