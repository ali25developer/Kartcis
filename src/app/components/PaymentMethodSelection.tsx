import { Wallet, CreditCard, QrCode, Building2 } from 'lucide-react';
import { Card } from './ui/card';
import { Label } from './ui/label';

export type PaymentMethodType = 'va' | 'ewallet' | 'qris' | 'credit_card';

interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  logo?: string;
}

interface PaymentMethodSelectionProps {
  selectedMethod: string;
  onSelectMethod: (methodId: string) => void;
  disabled?: boolean;
}

const paymentMethods: Record<PaymentMethodType, PaymentMethod[]> = {
  va: [
    { id: 'BCA', name: 'BCA Virtual Account', type: 'va' },
    { id: 'Mandiri', name: 'Mandiri Virtual Account', type: 'va' },
    { id: 'BNI', name: 'BNI Virtual Account', type: 'va' },
    { id: 'BRI', name: 'BRI Virtual Account', type: 'va' },
    { id: 'Permata', name: 'Permata Virtual Account', type: 'va' },
  ],
  ewallet: [
    { id: 'GoPay', name: 'GoPay', type: 'ewallet' },
    { id: 'OVO', name: 'OVO', type: 'ewallet' },
    { id: 'DANA', name: 'DANA', type: 'ewallet' },
    { id: 'ShopeePay', name: 'ShopeePay', type: 'ewallet' },
    { id: 'LinkAja', name: 'LinkAja', type: 'ewallet' },
  ],
  qris: [
    { id: 'QRIS', name: 'QRIS', type: 'qris' },
  ],
  credit_card: [
    { id: 'CreditCard', name: 'Kartu Kredit/Debit', type: 'credit_card' },
  ],
};

export function PaymentMethodSelection({ 
  selectedMethod, 
  onSelectMethod, 
  disabled 
}: PaymentMethodSelectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Metode Pembayaran
        </h2>
        <p className="text-sm text-gray-600">Pilih metode pembayaran yang Anda inginkan</p>
      </div>

      {/* Virtual Account */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">Virtual Account</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {paymentMethods.va.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelectMethod(method.id)}
              className={`py-2 px-3 border-2 rounded-lg text-center text-sm font-medium transition-all ${
                selectedMethod === method.id
                  ? 'border-sky-600 bg-sky-50 text-sky-700'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              disabled={disabled}
            >
              {method.id}
            </button>
          ))}
        </div>
      </div>

      {/* E-Wallet */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">E-Wallet</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {paymentMethods.ewallet.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelectMethod(method.id)}
              className={`py-2 px-3 border-2 rounded-lg text-center text-sm font-medium transition-all ${
                selectedMethod === method.id
                  ? 'border-sky-600 bg-sky-50 text-sky-700'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              disabled={disabled}
            >
              {method.id}
            </button>
          ))}
        </div>
      </div>

      {/* Others (QRIS & Credit Card) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">Others</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {paymentMethods.qris.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelectMethod(method.id)}
              className={`py-2 px-3 border-2 rounded-lg text-center text-sm font-medium transition-all ${
                selectedMethod === method.id
                  ? 'border-sky-600 bg-sky-50 text-sky-700'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              disabled={disabled}
            >
              {method.name}
            </button>
          ))}
          {paymentMethods.credit_card.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelectMethod(method.id)}
              className={`py-2 px-3 border-2 rounded-lg text-center text-sm font-medium transition-all ${
                selectedMethod === method.id
                  ? 'border-sky-600 bg-sky-50 text-sky-700'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              disabled={disabled}
            >
              {method.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function getPaymentMethodType(methodId: string): PaymentMethodType {
  for (const [type, methods] of Object.entries(paymentMethods)) {
    if (methods.some(m => m.id === methodId)) {
      return type as PaymentMethodType;
    }
  }
  return 'va'; // default
}