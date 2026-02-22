import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Loader2 
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { formatCurrency } from '@/app/utils/helpers';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/app/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';
import { adminApi } from '@/app/services/adminApi';
import type { Voucher } from '@/app/types';

interface AdminVouchersProps {
  activeTab: string;
}

export function AdminVouchers({ activeTab }: AdminVouchersProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage] = useState(1);
  const [events, setEvents] = useState<{id: number, title: string, ticket_types: {id: number, name: string}[]}[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percent',
    discount_value: '',
    max_discount_amount: '',
    max_uses: '100',
    event_id: 'all',
    ticket_type_id: 'all',
    expires_at: '',
    is_active: true
  });
  
  // Delete
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Status toggle
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [openEventCombobox, setOpenEventCombobox] = useState(false);
  const [openTicketCombobox, setOpenTicketCombobox] = useState(false);

  // Default limit
  const limit = 10;

  const fetchVouchers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.vouchers.getAll({
        page: currentPage,
        limit,
        search: searchQuery
      });
      if (response.success && response.data) {
        setVouchers(response.data.vouchers);
      }
    } catch (error) {
       // handled by generic toast/log
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    if (activeTab === 'vouchers') {
      fetchVouchers();
      fetchEvents();
    }
  }, [activeTab, fetchVouchers]);

  const fetchEvents = async () => {
    try {
      const response = await adminApi.events.getAll({ limit: 100 });
      if (response.success && response.data) {
        setEvents(response.data.events.map(e => ({ 
          id: e.id, 
          title: e.title,
          ticket_types: e.ticket_types || [] 
        })));
      }
    } catch (error) {
       console.error("Gagal mengambil events", error);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      code: '',
      discount_type: 'percent',
      discount_value: '',
      max_discount_amount: '',
      max_uses: '100',
      event_id: 'all',
      ticket_type_id: 'all',
      expires_at: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (voucher: Voucher) => {
    setEditingId(voucher.id);
    setFormData({
      code: voucher.code,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value.toString(),
      max_discount_amount: voucher.max_discount_amount ? voucher.max_discount_amount.toString() : '',
      max_uses: voucher.max_uses.toString(),
      event_id: voucher.event_id ? voucher.event_id.toString() : 'all',
      ticket_type_id: voucher.ticket_type_id ? voucher.ticket_type_id.toString() : 'all',
      // Convert UTC 'Z' to local datetime-local format 'YYYY-MM-DDTHH:mm'
      expires_at: voucher.expires_at ? new Date(voucher.expires_at).toISOString().slice(0, 16) : '',
      is_active: voucher.is_active
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.discount_value || !formData.expires_at) {
        toast.error("Mohon isi field yang wajib");
        return;
    }
    
    setIsSubmitting(true);
    try {
      const payload: any = {
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        max_uses: Number(formData.max_uses),
        expires_at: new Date(formData.expires_at).toISOString(),
        is_active: formData.is_active
      };
      
      if (formData.max_discount_amount) {
        payload.max_discount_amount = Number(formData.max_discount_amount);
      }
      
      if (formData.event_id !== 'all') {
        payload.event_id = Number(formData.event_id);
        if (formData.ticket_type_id !== 'all') {
            payload.ticket_type_id = Number(formData.ticket_type_id);
        } else {
            payload.ticket_type_id = null;
        }
      } else {
        payload.event_id = null;
        payload.ticket_type_id = null;
      }

      let response;
      if (editingId) {
        response = await adminApi.vouchers.update(editingId, payload);
      } else {
        response = await adminApi.vouchers.create(payload);
      }

      if (response.success) {
        toast.success(`Voucher berhasil ${editingId ? 'diperbarui' : 'dibuat'}`);
        setIsModalOpen(false);
        fetchVouchers();
      } else {
        toast.error(response.message || "Gagal menyimpan voucher");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    
    try {
      const response = await adminApi.vouchers.delete(deletingId);
      if (response.success) {
        toast.success("Voucher berhasil dihapus");
        fetchVouchers();
      } else {
        toast.error(response.message || "Gagal menghapus voucher");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      const response = await adminApi.vouchers.updateStatus(id, !currentStatus);
      if (response.success) {
        toast.success("Status voucher berhasil diubah");
        fetchVouchers();
      } else {
        toast.error(response.message || "Gagal mengubah status voucher");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Voucher</h2>
          <p className="text-gray-500">Kelola kode promo dan potongan diskon</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary-hover shadow-md transition-all active:scale-95 flex items-center gap-2"
          onClick={openCreateModal}
        >
          <Plus className="h-4 w-4" />
          Tambah Voucher
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <Input 
            placeholder="Cari kode promo..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kode Promo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Diskon</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pemakaian</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Deadline</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      Tidak ada data voucher
                   </td>
                </tr>
              ) : (
                vouchers.map((voucher) => (
                  <tr key={voucher.id}>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{voucher.code}</div>
                      {voucher.event ? (
                         <div className="text-xs text-sky-600">
                           {voucher.ticket_type ? `Khusus Tiket: ${voucher.ticket_type.name} - ${voucher.event.title}` : `Khusus Event: ${voucher.event.title}`}
                         </div>
                      ) : (
                         <div className="text-xs text-gray-500">Semua Event</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                       <div className="font-medium text-green-600">
                          {voucher.discount_type === 'percent' 
                            ? `${voucher.discount_value}%` 
                            : formatCurrency(voucher.discount_value)}
                       </div>
                       {voucher.discount_type === 'percent' && voucher.max_discount_amount && (
                          <div className="text-[10px] text-gray-500">Maks. {formatCurrency(voucher.max_discount_amount)}</div>
                       )}
                    </td>
                    <td className="px-4 py-3">
                       <div className="text-sm">
                         <span className="font-medium">{voucher.used_count || 0}</span> / {voucher.max_uses}
                       </div>
                       <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(100, ((voucher.used_count || 0) / voucher.max_uses) * 100)}%` }}></div>
                       </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(voucher.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                       <Switch 
                         checked={voucher.is_active}
                         disabled={togglingId === voucher.id}
                         onCheckedChange={() => handleToggleStatus(voucher.id, voucher.is_active)}
                       />
                    </td>
                    <td className="px-4 py-3">
                       <div className="flex gap-2">
                           <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEditModal(voucher)}>
                              <Edit2 className="h-4 w-4" />
                           </Button>
                           <Button variant="outline" size="icon" className="h-8 w-8 text-red-600" onClick={() => { setDeletingId(voucher.id); setIsDeleteDialogOpen(true); }}>
                              <Trash2 className="h-4 w-4" />
                           </Button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Voucher" : "Buat Voucher Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Kode Promo *</Label>
              <Input 
                 placeholder="Cth: PROMO24" 
                 value={formData.code}
                 onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                 required
                 className="uppercase"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Tipe Diskon *</Label>
                 <Select 
                    value={formData.discount_type} 
                    onValueChange={(val: 'percent'|'fixed') => setFormData({...formData, discount_type: val})}
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="percent">Persentase (%)</SelectItem>
                     <SelectItem value="fixed">Nominal Tetap (Rp)</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Nilai Diskon *</Label>
                 <Input 
                   type="number"
                   placeholder={formData.discount_type === 'percent' ? "Cth: 20" : "Cth: 50000"} 
                   value={formData.discount_value}
                   onChange={e => setFormData({...formData, discount_value: e.target.value})}
                   required
                 />
               </div>
            </div>

            {formData.discount_type === 'percent' && (
               <div className="space-y-2">
                 <Label>Maksimal Potongan (Opsional)</Label>
                 <Input 
                   type="number"
                   placeholder="Maksimal nominal diskon (Cth: 50000)" 
                   value={formData.max_discount_amount}
                   onChange={e => setFormData({...formData, max_discount_amount: e.target.value})}
                 />
               </div>
            )}

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Batas Penggunaan *</Label>
                 <Input 
                   type="number"
                   value={formData.max_uses}
                   onChange={e => setFormData({...formData, max_uses: e.target.value})}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label>Berlaku Hingga *</Label>
                 <Input 
                   type="datetime-local"
                   value={formData.expires_at}
                   onChange={e => setFormData({...formData, expires_at: e.target.value})}
                   required
                 />
               </div>
            </div>

            <div className={`grid gap-4 ${formData.event_id !== 'all' ? 'grid-cols-2' : ''}`}>
              <div className="space-y-2 flex flex-col">
                <Label>Khusus Event (Opsional)</Label>
                <Popover open={openEventCombobox} onOpenChange={setOpenEventCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openEventCombobox}
                      className="w-full justify-between"
                    >
                      {formData.event_id === 'all'
                        ? "Semua Event (Global)"
                        : events.find((ev) => ev.id.toString() === formData.event_id)?.title}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cari event..." />
                      <CommandList>
                        <CommandEmpty>Event tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            onSelect={(currentValue) => {
                              setFormData({...formData, event_id: currentValue, ticket_type_id: 'all'})
                              setOpenEventCombobox(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.event_id === 'all' ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Semua Event (Global)
                          </CommandItem>
                          {events.map((ev) => (
                            <CommandItem
                              key={ev.id}
                              value={ev.title} // cmdk searches against value, so passing title helps. we set event_id inside onSelect
                              onSelect={() => {
                                setFormData({...formData, event_id: ev.id.toString(), ticket_type_id: 'all'})
                                setOpenEventCombobox(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.event_id === ev.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {ev.title}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {formData.event_id !== 'all' && (
                <div className="space-y-2 flex flex-col">
                  <Label>Khusus Tiket (Opsional)</Label>
                  <Popover open={openTicketCombobox} onOpenChange={setOpenTicketCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openTicketCombobox}
                        className="w-full justify-between"
                      >
                        {formData.ticket_type_id === 'all'
                          ? "Semua Kategori Tiket"
                          : events
                              .find((e) => e.id.toString() === formData.event_id)
                              ?.ticket_types.find((tt) => tt.id.toString() === formData.ticket_type_id)
                              ?.name}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Cari tiket..." />
                        <CommandList>
                          <CommandEmpty>Tiket tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="all"
                              onSelect={(currentValue) => {
                                setFormData({...formData, ticket_type_id: currentValue})
                                setOpenTicketCombobox(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.ticket_type_id === 'all' ? "opacity-100" : "opacity-0"
                                )}
                              />
                              Semua Kategori Tiket
                            </CommandItem>
                            {events
                              .find((e) => e.id.toString() === formData.event_id)
                              ?.ticket_types.map((tt) => (
                                <CommandItem
                                  key={tt.id}
                                  value={tt.name}
                                  onSelect={() => {
                                    setFormData({...formData, ticket_type_id: tt.id.toString()})
                                    setOpenTicketCombobox(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.ticket_type_id === tt.id.toString() ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {tt.name}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-2">
               <Switch 
                 id="is_active" 
                 checked={formData.is_active} 
                 onCheckedChange={checked => setFormData({...formData, is_active: checked})}
               />
               <Label htmlFor="is_active" className="cursor-pointer">Aktifkan Voucher</Label>
            </div>

            <DialogFooter>
               <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
               <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                  Simpan
               </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Voucher</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus voucher ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Ya, Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
