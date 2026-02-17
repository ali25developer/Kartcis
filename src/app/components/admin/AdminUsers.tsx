import { useState, useEffect } from 'react';
import { 
  Loader2, 
  Search, 
  User as UserIcon, 
  Edit
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';
import { adminApi } from '@/app/services/adminApi';
import type { User, PaginationMetadata } from '@/app/types';
import { Badge } from '@/app/components/ui/badge';

export function AdminUsers({ activeTab }: { activeTab?: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  
  // Edit Dialog State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    role: 'user',
    custom_fee: ''
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearch(searchQuery);
        setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.users.getAll({
        page: currentPage,
        limit: 10,
        search: debouncedSearch
      });

      if (response.success && response.data) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Gagal mengambil data pengguna');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [currentPage, debouncedSearch, activeTab]);

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditForm({
      role: user.role || 'user',
      custom_fee: user.custom_fee?.toString() || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    setIsSaving(true);
    try {
      await adminApi.users.update(editingUser.id, {
        role: editForm.role,
        custom_fee: editForm.custom_fee ? parseFloat(editForm.custom_fee) : 0 // send 0 to clear custom fee?? actually backend should handle null
      });
      
      toast.success(`User ${editingUser.name} berhasil diperbarui`);
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error('Gagal memperbarui user');
    } finally {
      setIsSaving(false);
    }
  };

  const totalPages = pagination?.total_pages || 1;

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Cari user..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">Daftar Pengguna</h3>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Kontak</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Custom Fee</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Tidak ada data pengguna ditemukan
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <UserIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{user.email}</div>
                        <div className="text-xs text-gray-500">{user.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={
                          user.role === 'admin' ? 'destructive' : 
                          user.role === 'organizer' ? 'default' : 
                          'secondary'
                        }>
                          {user.role === 'admin' ? 'Super Admin' : 
                           user.role === 'organizer' ? 'Organizer' : 
                           'User'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'organizer' ? (
                          user.custom_fee ? (
                            <span className="font-medium text-green-600">{user.custom_fee}%</span>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Default</span>
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:text-primary-hover hover:bg-primary-light"
                            onClick={() => handleEditClick(user)}
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!isLoading && users.length > 0 && (
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Halaman {currentPage} dari {totalPages}
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
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Ubah role dan biaya admin khusus untuk pengguna ini.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input value={editingUser?.name || ''} disabled className="bg-gray-100" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={editForm.role} 
                onValueChange={(val) => setEditForm(prev => ({ ...prev, role: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User Biasa</SelectItem>
                  <SelectItem value="organizer">Organizer (EO)</SelectItem>
                  <SelectItem value="admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {editForm.role === 'organizer' && (
              <div className="space-y-2">
                <Label htmlFor="custom_fee">Custom Admin Fee (%)</Label>
                <div className="relative">
                  <Input 
                    id="custom_fee"
                    type="number" 
                    step="0.1"
                    min="0"
                    placeholder="Kosongkan untuk pakai default"
                    value={editForm.custom_fee}
                    onChange={(e) => setEditForm(prev => ({ ...prev, custom_fee: e.target.value }))}
                  />
                  <span className="absolute right-3 top-2.5 text-gray-400 text-sm">%</span>
                </div>
                <p className="text-xs text-gray-500">
                  Biaya admin khusus untuk organizer ini. Kosongkan untuk menggunakan Global Fee.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button onClick={handleSaveUser} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
