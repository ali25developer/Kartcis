import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2,
  Search,
  Calendar as CalendarIcon,
  MapPin,
  Tag,
  XCircle,
  PlusCircle,
  Trash
} from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { formatDate, formatISOToDate, formatTime, handleApi } from '@/app/utils/helpers';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/app/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Label } from '@/app/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/app/services/api';
import { adminApi } from '@/app/services/adminApi';
import type { Event, Category, PaginationMetadata, CustomField } from '@/app/types';

export function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  // Initial Form State
  const initialFormState = {
    title: '',
    description: '',
    detailed_description: '',
    category_id: '',
    event_date: '',
    event_time: '',
    venue: '',
    city: '',
    image: '',
    organizer: '',
    fee_percentage: '5',
    status: 'draft',
    is_featured: false,
    custom_fields: [] as CustomField[],
    ticket_types: [] as { id?: number; name: string; price: string; original_price?: string; quota: string; description: string }[]
  };

  // Alert Dialog State
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void> | void;
    variant?: 'default' | 'destructive';
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'default',
    confirmText: 'Ya, Lanjutkan'
  });

  const [formData, setFormData] = useState(initialFormState);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearch(searchQuery);
        setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Events
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const eventsRes = await adminApi.events.getAll({
        page: currentPage,
        limit: 10,
        search: debouncedSearch
      });

      if (eventsRes.success && eventsRes.data) {
        setEvents(eventsRes.data.events);
        setPagination(eventsRes.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching admin events:', error);
      toast.error('Gagal mengambil data event');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentPage, debouncedSearch]);

  const fetchCategories = async () => {
    try {
      const categoriesRes = await api.categories.getAll({ limit: 100 });
      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Gagal mengambil data kategori', {
        description: 'Terjadi kesalahan saat mengambil data kategori',
      });
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle Create/Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validation
    if (!formData.category_id) {
       toast.error('Validasi Gagal', {
        description: 'Kategori harus dipilih',
      });
      setIsSubmitting(false);
      return;
    }

    const payload = {
      ...formData,
      category_id: parseInt(formData.category_id),
      fee_percentage: parseFloat(formData.fee_percentage) || 5.0,
      custom_fields: formData.custom_fields.length > 0 ? JSON.stringify(formData.custom_fields) : undefined,
      ticket_types: formData.ticket_types.map(t => ({
        ...(t.id ? { id: t.id } : {}),
        name: t.name,
        price: parseInt(t.price),
        original_price: t.original_price ? parseInt(t.original_price) : undefined,
        quota: parseInt(t.quota),
        description: t.description
      }))
    };

    try {
      const result = await handleApi(
        editingEvent 
          ? adminApi.events.update(editingEvent.id, payload)
          : adminApi.events.create(payload),
        {
          showSuccess: true,
          successMessage: 'Berhasil',
          description: editingEvent ? 'Event berhasil diperbarui' : 'Event berhasil ditambahkan'
        }
      );

      if (result) {
        setIsModalOpen(false);
        resetForm();
        fetchEvents();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = (event: Event) => {
    setAlertConfig({
        isOpen: true,
        title: 'Hapus Event',
        description: `Apakah Anda yakin ingin menghapus event "${event.title}"? Tindakan ini tidak dapat dibatalkan.`,
        variant: 'destructive',
        confirmText: 'Hapus',
        onConfirm: async () => {
            const result = await handleApi(
                adminApi.events.delete(event.id),
                {
                    showSuccess: true,
                    successMessage: 'Berhasil',
                    description: 'Event berhasil dihapus'
                }
            );

            if (result) {
                fetchEvents();
            }
        }
    });
  };
 
  // Handle Cancel Event
  const handleCancel = (event: Event) => {
    if (event.status === 'cancelled') {
        toast.error('Event sudah dibatalkan');
        return;
    }

    setAlertConfig({
        isOpen: true,
        title: 'Batalkan Event',
        description: `Apakah Anda yakin ingin membatalkan event "${event.title}"? Status akan berubah menjadi Dibatalkan.`,
        variant: 'destructive',
        confirmText: 'Ya, Batalkan',
        onConfirm: async () => {
            const result = await handleApi(
                adminApi.events.updateStatus(event.id, 'cancelled'),
                {
                    showSuccess: true,
                    successMessage: 'Berhasil',
                    description: 'Event berhasil dibatalkan'
                }
            );
        
            if (result) {
                fetchEvents();
            }
        }
    });
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      detailed_description: event.detailed_description || '',
      category_id: event.category_id.toString(),
      event_date: formatISOToDate(event.event_date),
      event_time: formatTime(event.event_time || ''),
      venue: event.venue,
      city: event.city,
      image: event.image || '',
      organizer: event.organizer,
      fee_percentage: event.fee_percentage ? event.fee_percentage.toString() : '5',
      status: event.status,
      is_featured: event.is_featured,
      custom_fields: event.custom_fields ? JSON.parse(event.custom_fields) : [],
      ticket_types: event.ticket_types ? event.ticket_types.map(t => ({
        id: t.id,
        name: t.name,
        price: t.price.toString(),
        original_price: t.originalPrice ? t.originalPrice.toString() : '',
        quota: t.quota.toString(),
        description: t.description || ''
      })) : []
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData(initialFormState);
  };

  // No client-side filtering needed
  const filteredEvents = events;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Kelola Event</h2>
          <p className="text-sm text-gray-600">Buat dan kelola event yang tersedia</p>
        </div>
        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary-hover">
          <Plus className="h-4 w-4 mr-2" />
          Buat Event
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-[50px]">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kategori & Lokasi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Jadwal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Harga & Kuota</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-[120px]">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase text-right w-[150px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading...
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Tidak ada event ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">#{event.id}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{event.title}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{event.organizer}</div>
                      </td>
                      <td className="px-4 py-3">
                         <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                            <Tag className="h-3 w-3" />
                            {event.category?.name || 'Uncategorized'}
                         </div>
                         <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {event.city}
                         </div>
                      </td>
                      <td className="px-4 py-3">
                         <div className="flex items-center gap-1 text-sm text-gray-900">
                            <CalendarIcon className="h-3 w-3 text-gray-400" />
                            {formatDate(event.event_date)}
                         </div>
                         <div className="text-xs text-gray-500 pl-4">{event.event_time || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                         <div className="font-medium text-sm">
                            Rp {new Intl.NumberFormat('id-ID').format(event.min_price)}
                         </div>
                         <div className="text-xs text-gray-500">{event.quota} Tiket</div>
                      </td>
                      <td className="px-4 py-3">
                         <Badge 
                            variant={
                                event.status === 'published' ? 'default' : 
                                event.status === 'cancelled' ? 'destructive' : 
                                event.status === 'draft' ? 'secondary' : 'outline'
                            }
                            className={
                                event.status === 'published' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                                event.status === 'cancelled' ? 'bg-red-100 text-red-700 hover:bg-red-100' : 
                                ''
                            }
                         >
                            {event.status === 'published' ? 'Aktif' : 
                             event.status === 'cancelled' ? 'Dibatalkan' : 
                             event.status === 'draft' ? 'Draft' : 'Selsai'}
                         </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-primary hover:text-primary-hover hover:bg-primary-light"
                            onClick={() => openEditModal(event)}
                            title="Edit Event"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-accent-orange-hover hover:text-orange-700 hover:bg-accent-orange-light"
                            onClick={() => handleCancel(event)}
                            disabled={event.status === 'cancelled'}
                            title="Batalkan Event"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(event)}
                            title="Hapus Event"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {pagination && pagination.total_pages > 1 && (
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Menampilkan {events.length} dari {pagination.total_items} event | Halaman {currentPage} dari {pagination.total_pages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(pagination.total_pages, p + 1))}
                  disabled={currentPage === pagination.total_pages}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </div>
        </div>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[1200px] w-[95vw] max-h-[95vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="p-8 pb-4 border-b sticky top-0 bg-background z-20">
            <DialogTitle className="text-2xl">{editingEvent ? 'Edit Event' : 'Buat Event Baru'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Perbarui detail informasi event yang sedang berjalan' : 'Lengkapi detail berikut untuk mempublikasikan event baru'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Section: Informasi Dasar */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary-hover font-semibold border-b pb-2">
                    <Edit2 className="h-5 w-5" />
                    <h3>Informasi Dasar</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="title" className="text-gray-700 font-medium">Judul Event <span className="text-red-500">*</span></Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Contoh: Konser Musik Jakarta 2026"
                            className="h-11 text-lg"
                            required
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="organizer" className="text-gray-700 font-medium">Penyelenggara <span className="text-red-500">*</span></Label>
                        <Input
                            id="organizer"
                            value={formData.organizer}
                            onChange={(e) => setFormData(prev => ({ ...prev, organizer: e.target.value }))}
                            placeholder="Nama PT atau Organisasi"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category" className="text-gray-700 font-medium">Kategori <span className="text-red-500">*</span></Label>
                        <Select 
                            value={formData.category_id} 
                            onValueChange={(val) => setFormData(prev => ({ ...prev, category_id: val }))}
                        >
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Pilih Kategori Event" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Section: Lokasi & Waktu */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 text-primary-hover font-semibold border-b pb-2">
                    <MapPin className="h-5 w-5" />
                    <h3>Lokasi & Waktu</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="event_date" className="text-gray-700 font-medium">Tanggal Pelaksanaan <span className="text-red-500">*</span></Label>
                        <Input
                            type="date"
                            id="event_date"
                            value={formData.event_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="event_time" className="text-gray-700 font-medium">Waktu Mulai</Label>
                        <Input
                            type="time"
                            id="event_time"
                            value={formData.event_time}
                            onChange={(e) => setFormData(prev => ({ ...prev, event_time: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="venue" className="text-gray-700 font-medium">Nama Venue <span className="text-red-500">*</span></Label>
                        <Input
                            id="venue"
                            value={formData.venue}
                            onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                            placeholder="Contoh: Istora Senayan / Zoom Meeting"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="city" className="text-gray-700 font-medium">Kota <span className="text-red-500">*</span></Label>
                        <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="Contoh: Jakarta Pusat"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Section: Banner & Konfigurasi */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 text-primary-hover font-semibold border-b pb-2">
                    <Tag className="h-5 w-5" />
                    <h3>Pengaturan & Media</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="fee_percentage" className="text-gray-700 font-medium">Biaya Admin (%) <span className="text-red-500">*</span></Label>
                        <Input
                            type="number"
                            id="fee_percentage"
                            value={formData.fee_percentage}
                            onChange={(e) => setFormData(prev => ({ ...prev, fee_percentage: e.target.value }))}
                            min="0"
                            step="0.1"
                            required
                        />
                        <p className="text-[10px] text-gray-400 italic">Standar: 5.0%</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status" className="text-gray-700 font-medium">Status Konten</Label>
                        <Select 
                            value={formData.status} 
                            onValueChange={(val: any) => setFormData(prev => ({ ...prev, status: val }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Simpan sebagai Draft</SelectItem>
                                <SelectItem value="published">Publikasikan Sekarang</SelectItem>
                                <SelectItem value="ended">Event Selesai</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">Highlight Homepage</Label>
                        <div className="flex items-center space-x-3 bg-amber-50 h-10 px-3 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer">
                            <input
                                type="checkbox"
                                id="is_featured"
                                checked={formData.is_featured}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                                className="h-5 w-5 rounded border-amber-400 text-accent-orange-hover focus:ring-accent-orange cursor-pointer"
                            />
                            <Label htmlFor="is_featured" className="cursor-pointer font-bold text-amber-900 text-sm">Populer</Label>
                        </div>
                        <p className="text-[10px] text-accent-orange-hover italic leading-tight">Event akan muncul di slide besar (Hero) halaman utama.</p>
                    </div>

                    <div className="space-y-2 col-span-3">
                        <Label htmlFor="image" className="text-gray-700 font-medium">Banner Event (Rekomendasi 16:9)</Label>
                        <ImageUpload 
                            value={formData.image} 
                            onChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
                            placeholder="Upload Banner Beresolusi Tinggi"
                        />
                    </div>
                </div>
            </div>

            {/* Section: Custom Fields */}
            <div className="bg-gray-50/50 p-6 rounded-xl border-2 border-dashed border-gray-200 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Custom Form Peserta</h3>
                        <p className="text-sm text-gray-500">Data tambahan yang wajib diisi pembeli saat checkout</p>
                    </div>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="bg-white"
                        onClick={() => {
                            setFormData(prev => ({
                                ...prev,
                                custom_fields: [...prev.custom_fields, { name: '', type: 'text', required: true }]
                            }));
                        }}
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Tambah Field
                    </Button>
                </div>

                <div className="space-y-4">
                    {formData.custom_fields.map((field, index) => (
                        <Card key={index} className="p-4 bg-white border shadow-sm relative group overflow-visible">
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-3 -right-3 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                    const newFields = [...formData.custom_fields];
                                    newFields.splice(index, 1);
                                    setFormData(prev => ({ ...prev, custom_fields: newFields }));
                                }}
                            >
                                <Trash className="h-4 w-4" />
                            </Button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500 uppercase">Label Input</Label>
                                    <Input
                                        placeholder="Contoh: Nomor Identitas / Ukuran Baju"
                                        value={field.name}
                                        onChange={(e) => {
                                            const newFields = [...formData.custom_fields];
                                            newFields[index].name = e.target.value;
                                            setFormData(prev => ({ ...prev, custom_fields: newFields }));
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500 uppercase">Tipe Input</Label>
                                    <Select
                                        value={field.type}
                                        onValueChange={(val: 'text' | 'select') => {
                                            const newFields = [...formData.custom_fields];
                                            newFields[index].type = val;
                                            if (val === 'text') delete newFields[index].options;
                                            else if (!newFields[index].options) newFields[index].options = [];
                                            setFormData(prev => ({ ...prev, custom_fields: newFields }));
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">Teks Bebas</SelectItem>
                                            <SelectItem value="select">Pilihan Ganda (Dropdown)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                {field.type === 'select' && (
                                    <div className="col-span-2 space-y-2 bg-primary-light p-3 rounded-lg border border-sky-100">
                                        <Label className="text-primary-hover">Daftar Pilihan (Pisahkan dengan koma)</Label>
                                        <Input
                                            placeholder="Contoh: S, M, L, XL"
                                            value={field.options?.join(', ') || ''}
                                            className="bg-white"
                                            onChange={(e) => {
                                                const newFields = [...formData.custom_fields];
                                                newFields[index].options = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                                setFormData(prev => ({ ...prev, custom_fields: newFields }));
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        id={`req-${index}`}
                                        checked={field.required}
                                        onChange={(e) => {
                                            const newFields = [...formData.custom_fields];
                                            newFields[index].required = e.target.checked;
                                            setFormData(prev => ({ ...prev, custom_fields: newFields }));
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-light0"
                                    />
                                    <Label htmlFor={`req-${index}`} className="cursor-pointer font-medium">Wajib diisi oleh user</Label>
                                </div>
                            </div>
                        </Card>
                    ))}
                    
                    {formData.custom_fields.length === 0 && (
                        <div className="text-center py-4 bg-white/50 rounded-lg">
                            <p className="text-xs text-gray-400">Tidak ada data tambahan khusus peserta</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Section: Ticket Types */}
            <div className="bg-primary-light/50 p-8 rounded-2xl border border-sky-100 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold text-sky-900 flex items-center gap-2">
                            <PlusCircle className="h-6 w-6" />
                            Manajemen Tiket
                        </h3>
                        <p className="text-sm text-primary">Buat minimal 1 kategori tiket. Quota & Harga akan tersinkronisasi otomatis.</p>
                    </div>
                    <Button 
                        type="button" 
                        variant="default" 
                        className="bg-primary hover:bg-primary-hover shadow-lg shadow-sky-200"
                        onClick={() => {
                            setFormData(prev => ({
                                ...prev,
                                ticket_types: [...prev.ticket_types, { name: '', price: '0', quota: '0', description: '' }]
                            }));
                        }}
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Tambah Kategori Tiket
                    </Button>
                </div>

                <div className="space-y-8">
                    {formData.ticket_types.map((ticket, index) => (
                        <Card key={index} className="p-8 bg-white border border-sky-100 shadow-md relative group hover:border-sky-300 transition-all">
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-3 -right-3 h-10 w-10 rounded-full shadow-xl z-10"
                                onClick={() => {
                                    const newTickets = [...formData.ticket_types];
                                    newTickets.splice(index, 1);
                                    setFormData(prev => ({ ...prev, ticket_types: newTickets }));
                                }}
                            >
                                <Trash className="h-5 w-5" />
                            </Button>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                    <div className="md:col-span-4 space-y-2">
                                        <Label className="text-xs font-bold text-sky-800 uppercase tracking-wider">Nama Kategori Tiket</Label>
                                        <Input
                                            placeholder="VIP / Festival / Early Bird"
                                            value={ticket.name}
                                            onChange={(e) => {
                                                const newTickets = [...formData.ticket_types];
                                                newTickets[index].name = e.target.value;
                                                setFormData(prev => ({ ...prev, ticket_types: newTickets }));
                                            }}
                                            className="h-12 text-lg font-semibold bg-primary-light/20 border-sky-100 focus:border-primary-light0"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-3 space-y-2">
                                        <Label className="text-xs font-bold text-sky-800 uppercase tracking-wider">Harga Jual (Rp)</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={ticket.price}
                                            onChange={(e) => {
                                                const newTickets = [...formData.ticket_types];
                                                newTickets[index].price = e.target.value;
                                                setFormData(prev => ({ ...prev, ticket_types: newTickets }));
                                            }}
                                            className="h-12 border-green-200 focus:border-green-500 bg-green-50/10 text-lg font-medium"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-3 space-y-2">
                                        <Label className="text-xs font-bold text-sky-800 uppercase tracking-wider">Harga Coret (Optional)</Label>
                                        <Input
                                            type="number"
                                            placeholder="IDR 0"
                                            value={ticket.original_price || ''}
                                            onChange={(e) => {
                                                const newTickets = [...formData.ticket_types];
                                                newTickets[index].original_price = e.target.value;
                                                setFormData(prev => ({ ...prev, ticket_types: newTickets }));
                                            }}
                                            className="h-12 opacity-80 border-gray-200"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-xs font-bold text-sky-800 uppercase tracking-wider">Kuota</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={ticket.quota}
                                            onChange={(e) => {
                                                const newTickets = [...formData.ticket_types];
                                                newTickets[index].quota = e.target.value;
                                                setFormData(prev => ({ ...prev, ticket_types: newTickets }));
                                            }}
                                            className="h-12 border-orange-200 focus:border-accent-orange bg-accent-orange-light/10 text-lg font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-sky-800 uppercase tracking-wider">Fasilitas / Deskripsi Tambahan</Label>
                                    <Input
                                        placeholder="Sebutkan benefit tiket ini (misal: Welcome Drink, Meet & Greet, Fast Track)"
                                        value={ticket.description}
                                        onChange={(e) => {
                                            const newTickets = [...formData.ticket_types];
                                            newTickets[index].description = e.target.value;
                                            setFormData(prev => ({ ...prev, ticket_types: newTickets }));
                                        }}
                                        className="h-11 bg-gray-50/30"
                                    />
                                </div>
                            </div>
                        </Card>
                    ))}
                    
                    {formData.ticket_types.length === 0 && (
                        <div className="text-center py-16 bg-white border-2 border-dashed border-sky-200 rounded-2xl">
                            <div className="bg-primary-light w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PlusCircle className="h-10 w-10 text-sky-200" />
                            </div>
                            <h4 className="text-sky-900 font-bold text-lg">Belum ada Tiket</h4>
                            <p className="text-primary-light0 max-w-sm mx-auto mt-1">Sistem memerlukan minimal satu kategori tiket (misal: General Admission) untuk dapat memproses event ini.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Section: Desc */}
            <div className="space-y-4 pt-4 pb-4">
                <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-700 font-bold text-lg">Ringkasan Event</Label>
                    <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Deskripsi singkat yang akan tampil di card event"
                        className="h-12"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="detailed_description" className="text-gray-700 font-bold text-lg">Deskripsi Lengkap & Syarat Ketentuan</Label>
                    <Textarea
                        id="detailed_description"
                        value={formData.detailed_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, detailed_description: e.target.value }))}
                        placeholder="Tuliskan detail event secara lengkap, rundown, dan syarat ketentuan lainnya..."
                        className="min-h-[300px] leading-relaxed p-4"
                        required
                    />
                </div>
            </div>

            <DialogFooter className="sticky bottom-0 bg-background pt-4 pb-6 border-t z-10 flex gap-4">
              <Button type="button" variant="outline" className="h-12 w-32" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary-hover h-12 flex-1 text-lg font-bold" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Memproses Data...
                  </>
                ) : (
                  editingEvent ? 'Simpan Perubahan' : 'Terbitkan Event Sekarang'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Global Action Confirmation Dialog */}
      <AlertDialog 
        open={alertConfig.isOpen} 
        onOpenChange={(open) => {
          if (!open) setAlertConfig(prev => ({ ...prev, isOpen: false }));
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); 
                const result = alertConfig.onConfirm();
                if (result instanceof Promise) {
                   result.finally(() => setAlertConfig(prev => ({ ...prev, isOpen: false })));
                } else {
                   setAlertConfig(prev => ({ ...prev, isOpen: false }));
                }
              }}
              className={alertConfig.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-hover'}
            >
              {alertConfig.confirmText || 'Lanjutkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
