


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
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Metode Pembayaran
        </h2>
        <p className="text-sm text-gray-500 mb-6">Pilih salah satu metode pembayaran di bawah ini</p>
      </div>

      <div className="pt-2">
         <div className="bg-white border-2 border-primary rounded-xl p-6 text-center shadow-sm">
            <h3 className="text-lg font-bold text-primary-hover mb-2">Transfer Bank (Verifikasi Instan)</h3>
            <p className="text-sm text-gray-600 mb-4">Transfer ke rekening Bank Jago kami. Sistem akan memverifikasi pembayaran Anda secara otomatis dalam hitungan menit.</p>
            <button
               type="button"
               onClick={() => onSelectMethod('MANUAL_JAGO')}
               className={`w-full py-4 border-2 rounded-xl text-center font-bold text-lg transition-all shadow-sm ${
                 selectedMethod === 'MANUAL_JAGO'
                   ? 'border-primary bg-primary text-white shadow-lg scale-[1.02]'
                   : 'border-primary bg-white text-primary hover:bg-primary-light hover:scale-[1.01]'
               }`}
               disabled={disabled}
            >
               Bank Jago (Automatic Verification)
            </button>
            <div className="mt-6 flex items-center justify-center gap-4 opacity-90 transition-opacity hover:opacity-100">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Supported by</span>
               <img src="/assets/bank-jago-new.png" alt="Bank Jago" className="h-6" />
            </div>
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