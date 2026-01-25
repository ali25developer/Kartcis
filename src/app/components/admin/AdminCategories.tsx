
import { useState, useEffect } from 'react';
import { 
  Search,
  Loader2,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
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
import { toast } from 'sonner';
import { adminApi } from '@/app/services/adminApi';
import type { Category, PaginationMetadata } from '@/app/types';
import { handleApi } from '@/app/utils/helpers';
import { Badge } from '@/app/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/app/components/ui/select';
import { ImageUpload } from '@/app/components/admin/ImageUpload';
import { Switch } from '@/app/components/ui/switch';

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    icon: '',
    image: '',
    display_order: 1,
    is_active: true
  });

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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearch(searchQuery);
        setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Categories
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.categories.getAll({
        page: currentPage,
        limit: 10,
        search: debouncedSearch
      });
      if (response.success && response.data) {
        setCategories(response.data.categories);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Gagal mengambil data kategori');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [currentPage, debouncedSearch]);

  // Handle Create/Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
       name: formData.name,
       description: formData.description,
       icon: formData.icon,
       image: formData.image,
       display_order: typeof formData.display_order === 'string' ? parseInt(formData.display_order) : formData.display_order,
       is_active: formData.is_active
    };

    try {
      const result = await handleApi(
        editingCategory 
          ? adminApi.categories.update(editingCategory.id, payload)
          : adminApi.categories.create(payload),
        {
          showSuccess: true,
          successMessage: 'Berhasil',
          description: editingCategory ? 'Kategori berhasil diperbarui' : 'Kategori berhasil ditambahkan'
        }
      );

      if (result) {
        setIsModalOpen(false);
        resetForm();
        fetchCategories();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = (category: Category) => {
    setAlertConfig({
      isOpen: true,
      title: 'Hapus Kategori',
      description: `Apakah Anda yakin ingin menghapus kategori "${category.name}"? Action ini tidak dapat dibatalkan.`,
      variant: 'destructive',
      confirmText: 'Hapus',
      onConfirm: async () => {
        const result = await handleApi(
          adminApi.categories.delete(category.id),
          {
            showSuccess: true,
            successMessage: 'Berhasil',
            description: 'Kategori berhasil dihapus'
          }
        );

        if (result) {
          fetchCategories();
        }
      }
    });
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      slug: category.slug,
      icon: category.icon || '',
      image: category.image || '',
      display_order: category.display_order || 1,
      is_active: category.is_active !== undefined ? category.is_active : true
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      slug: '',
      icon: '',
      image: '',
      display_order: 1,
      is_active: true
    });
  };

  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredCategories = categories.filter(category => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return category.is_active;
    if (filterStatus === 'inactive') return !category.is_active;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Kategori Event</h2>
          <p className="text-sm text-gray-600">Kelola kategori untuk pengelompokan event</p>
        </div>
        <Button onClick={openCreateModal} className="bg-sky-600 hover:bg-sky-700">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Kategori
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={filterStatus}
            onValueChange={(value) => setFilterStatus(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Tidak Aktif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-[50px]">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Deskripsi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading...
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Tidak ada kategori ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">#{category.id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{category.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{category.slug}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[300px]">
                        {category.description || '-'}
                      </td>
                      <td className="px-4 py-3">
                         <Badge 
                            variant={category.is_active ? 'default' : 'secondary'}
                            className={category.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                         >
                            {category.is_active ? 'Aktif' : 'Tidak Aktif'}
                         </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                            onClick={() => openEditModal(category)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(category)}
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
                Menampilkan {categories.length} dari {pagination.total_items} kategori | Halaman {currentPage} dari {pagination.total_pages}
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

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Perbarui informasi kategori event' : 'Buat kategori baru untuk pengelompokan event'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label htmlFor="name">Nama Kategori <span className="text-red-500">*</span></Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Misal: Konser Musik"
                        required
                    />
                 </div>

                 <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label htmlFor="display_order">Urutan Tampilan</Label>
                    <Input
                        id="display_order"
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                        min="0"
                    />
                 </div>

                 <div className="space-y-2 col-span-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Deskripsi singkat kategori"
                    />
                 </div>

                 <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label htmlFor="icon">Icon Class (FontAwesome/Lucide)</Label>
                    <Input
                        id="icon"
                        value={formData.icon}
                        onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                        placeholder="e.g. fa-music"
                    />
                 </div>
                 
                 <div className="space-y-2 col-span-2 md:col-span-1 flex items-end pb-2">
                    <div className="flex items-center space-x-2">
                        <Switch 
                            id="is_active" 
                            checked={formData.is_active}
                            onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, is_active: checked }))}
                        />
                        <Label htmlFor="is_active">Status Aktif</Label>
                    </div>
                 </div>

                 <div className="space-y-2 col-span-2">
                    <Label>Gambar Banner</Label>
                    <ImageUpload 
                        value={formData.image} 
                        onChange={(url) => setFormData(prev => ({ ...prev, image: url }))} 
                    />
                 </div>

                {editingCategory && (
                   <div className="space-y-2 col-span-2">
                      <Label htmlFor="slug">Slug (Otomatis)</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        disabled
                        className="bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                   </div>
                )}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-sky-600 hover:bg-sky-700" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
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
              className={alertConfig.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : 'bg-sky-600 hover:bg-sky-700'}
            >
              {alertConfig.confirmText || 'Lanjutkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
