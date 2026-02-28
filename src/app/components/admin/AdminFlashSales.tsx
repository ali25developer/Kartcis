import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Loader2, Calendar, Clock
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';
import { adminApi } from '@/app/services/adminApi';
import type { FlashSale } from '@/app/types';

interface AdminFlashSalesProps {
  activeTab: string;
}



export function AdminFlashSales({ activeTab }: AdminFlashSalesProps) {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<{id: number, title: string, ticket_types: {id: number, name: string}[]}[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    event_id: '',
    ticket_type_id: '',
    flash_price: '',
    quota: '',
    flash_date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '14:00',
    is_active: true
  });
  
  // Delete
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Status toggle
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [openEventCombobox, setOpenEventCombobox] = useState(false);
  const [openTicketCombobox, setOpenTicketCombobox] = useState(false);



  const fetchFlashSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.flashSales.getAll();
      if (response.success && response.data) {
        setFlashSales(response.data);
      }
    } catch (error) {
       // Handled
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'flash-sales') {
      fetchFlashSales();
      fetchEvents();
    }
  }, [activeTab, fetchFlashSales]);

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
      event_id: '',
      ticket_type_id: '',
      flash_price: '',
      quota: '',
      flash_date: new Date().toISOString().split('T')[0],
      start_time: '10:00',
      end_time: '14:00',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (flashSale: FlashSale) => {
    setEditingId(flashSale.id);
    setFormData({
      event_id: flashSale.event_id.toString(),
      ticket_type_id: flashSale.ticket_type_id.toString(),
      flash_price: flashSale.flash_price.toString(),
      quota: flashSale.quota.toString(),
      flash_date: flashSale.flash_date ? flashSale.flash_date.split('T')[0] : '',
      start_time: flashSale.start_time,
      end_time: flashSale.end_time,
      is_active: flashSale.is_active
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.event_id || !formData.ticket_type_id || !formData.flash_price || !formData.quota || !formData.flash_date || !formData.start_time || !formData.end_time) {
        toast.error("Mohon isi field yang wajib");
        return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        event_id: Number(formData.event_id),
        ticket_type_id: Number(formData.ticket_type_id),
        flash_price: Number(formData.flash_price),
        quota: Number(formData.quota),
        flash_date: formData.flash_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        is_active: formData.is_active
      };

      let response;
      if (editingId) {
        response = await adminApi.flashSales.update(editingId, payload);
      } else {
        response = await adminApi.flashSales.create(payload);
      }

      if (response.success) {
        toast.success(`Flash Sale berhasil ${editingId ? 'diperbarui' : 'dibuat'}`);
        setIsModalOpen(false);
        fetchFlashSales();
      } else {
        toast.error(response.message || "Gagal menyimpan flash sale");
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
      const response = await adminApi.flashSales.delete(deletingId);
      if (response.success) {
        toast.success("Flash Sale berhasil dihapus");
        fetchFlashSales();
      } else {
        toast.error(response.message || "Gagal menghapus flash sale");
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
      // Create a partial update. 
      const response = await adminApi.flashSales.update(id, { is_active: !currentStatus });
      if (response.success) {
        toast.success("Status flash sale berhasil diubah");
        setFlashSales(prev => prev.map(fs => fs.id === id ? { ...fs, is_active: !currentStatus } : fs));
      } else {
        toast.error(response.message || "Gagal mengubah status flash sale");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setTogglingId(null);
    }
  };

  // Safe search
  const filteredData = flashSales.filter(fs => 
    searchQuery === '' || 
    fs.event?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fs.ticket_type?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Flash Sale</h2>
          <p className="text-gray-500">Kelola diskon batas waktu untuk tiket tertentu</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary-hover shadow-md transition-all active:scale-95 flex items-center gap-2"
          onClick={openCreateModal}
        >
          <Plus className="h-4 w-4" />
          Tambah Flash Sale
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <Input 
            placeholder="Cari event atau tiket..." 
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Event & Tiket</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Harga Flash Sale</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tanggal Promo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Jam Promo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kuota / Terjual</th>
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
              ) : filteredData.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      Tidak ada data flash sale aktif
                   </td>
                </tr>
              ) : (
                filteredData.map((fs) => (
                  <tr key={fs.id}>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{fs.event?.title || 'Unknown Event'}</div>
                      <div className="text-xs text-sky-600">
                        Tiket: {fs.ticket_type?.name || 'Unknown'} 
                        {fs.ticket_type && <span className="text-gray-400 ml-1 line-through">({formatCurrency(fs.ticket_type.price)})</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                       <div className="font-medium text-green-600">
                          {formatCurrency(fs.flash_price)}
                       </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                       <div className="text-sm font-medium flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                           {fs.flash_date ? fs.flash_date.split('T')[0] : '-'}
                       </div>
                    </td>
                    <td className="px-4 py-3">
                       <div className="text-sm font-medium flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {fs.start_time} - {fs.end_time}
                       </div>
                    </td>
                    <td className="px-4 py-3">
                       <div className="text-sm font-medium"><span className="text-red-600">{fs.sold || 0}</span> / {fs.quota}</div>
                       <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(100, ((fs.sold || 0) / fs.quota) * 100)}%` }}></div>
                       </div>
                    </td>
                    <td className="px-4 py-3">
                       <Switch 
                         checked={fs.is_active}
                         disabled={togglingId === fs.id}
                         onCheckedChange={() => handleToggleStatus(fs.id, fs.is_active)}
                       />
                    </td>
                    <td className="px-4 py-3">
                       <div className="flex gap-2">
                           <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEditModal(fs)}>
                              <Edit2 className="h-4 w-4" />
                           </Button>
                           <Button variant="outline" size="icon" className="h-8 w-8 text-red-600" onClick={() => { setDeletingId(fs.id); setIsDeleteDialogOpen(true); }}>
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
            <DialogTitle>{editingId ? "Edit Flash Sale" : "Buat Flash Sale Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            
            <div className="space-y-2 flex flex-col">
              <Label>Pilih Event *</Label>
              <Popover open={openEventCombobox} onOpenChange={setOpenEventCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openEventCombobox}
                    className="w-full justify-between"
                  >
                    {formData.event_id 
                      ? events.find((ev) => ev.id.toString() === formData.event_id)?.title
                      : "Pilih Event"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari event..." />
                    <CommandList>
                      <CommandEmpty>Event tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {events.map((ev) => (
                          <CommandItem
                            key={ev.id}
                            value={ev.title}
                            onSelect={() => {
                              setFormData({...formData, event_id: ev.id.toString(), ticket_type_id: ''})
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

            <div className="space-y-2 flex flex-col">
              <Label>Pilih Kategori Tiket *</Label>
              <Popover open={openTicketCombobox} onOpenChange={setOpenTicketCombobox}>
                <PopoverTrigger asChild disabled={!formData.event_id}>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openTicketCombobox}
                    className="w-full justify-between"
                  >
                    {formData.ticket_type_id
                      ? events
                          .find((e) => e.id.toString() === formData.event_id)
                          ?.ticket_types.find((tt) => tt.id.toString() === formData.ticket_type_id)
                          ?.name
                      : "Pilih Kategori Tiket"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari tiket..." />
                    <CommandList>
                      <CommandEmpty>Tiket tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
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
            
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Harga Flash Sale (Rp) *</Label>
                 <Input 
                   type="number"
                   placeholder="Cth: 140000" 
                   value={formData.flash_price}
                   onChange={e => setFormData({...formData, flash_price: e.target.value})}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label>Batas Kuota Promo *</Label>
                 <Input 
                   type="number"
                   placeholder="Cth: 100"
                   value={formData.quota}
                   onChange={e => setFormData({...formData, quota: e.target.value})}
                   required
                 />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Jam Mulai (HH:mm) *</Label>
                 <Input 
                   type="time"
                   value={formData.start_time}
                   onChange={e => setFormData({...formData, start_time: e.target.value})}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label>Jam Berakhir (HH:mm) *</Label>
                 <Input 
                   type="time"
                   value={formData.end_time}
                   onChange={e => setFormData({...formData, end_time: e.target.value})}
                   required
                 />
               </div>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Flash Sale *</Label>
              <Input 
                type="date"
                value={formData.flash_date}
                onChange={e => setFormData({...formData, flash_date: e.target.value})}
                required
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
               <Switch 
                 id="is_active_flash" 
                 checked={formData.is_active} 
                 onCheckedChange={checked => setFormData({...formData, is_active: checked})}
               />
               <Label htmlFor="is_active_flash" className="cursor-pointer">Aktifkan Flash Sale</Label>
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
            <AlertDialogTitle>Hapus Flash Sale</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus flash sale ini? Tindakan ini tidak dapat dibatalkan.
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
