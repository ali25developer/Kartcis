


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

export function PaymentMethodSelection(_props: PaymentMethodSelectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Metode Pembayaran
        </h2>
        <p className="text-sm text-gray-500 mb-6">Pilih salah satu metode pembayaran di bawah ini</p>
      </div>

      <div className="pt-2">
         <div className="bg-white border-2 border-primary rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0">
               <div className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                  Terpilih
               </div>
            </div>
            
            <div className="flex items-start gap-4">
               <div className="bg-primary/10 p-3 rounded-xl">
                  <img src="/assets/logo-flip.png" alt="Flip" className="h-6 w-auto object-contain" />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">Pembayaran Online (Flip)</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                     Mendukung QRIS, Virtual Account (BCA, Mandiri, BNI, dll), dan E-Wallet dengan verifikasi otomatis secara real-time.
                  </p>
               </div>
            </div>

            <div className="mt-6 flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[11px] font-bold text-gray-600 uppercase">Sistem Aktif & Otomatis</span>
               </div>
               <span className="text-[10px] text-gray-400 font-medium italic">Klik tombol di bawah untuk lanjut</span>
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