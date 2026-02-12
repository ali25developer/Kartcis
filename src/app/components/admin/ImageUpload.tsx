import { useState, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { adminApi } from '@/app/services/adminApi';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  placeholder?: string;
}

export function ImageUpload({ value, onChange, className, placeholder = "Upload Image" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar (JPG, PNG, dll)');
        return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Ukuran file maksimal 5MB');
        return;
    }

    setIsUploading(true);
    try {
      const response = await adminApi.uploadImage(file);
      if (response.success && response.data?.url) {
        onChange(response.data.url);
        toast.success('Gambar berhasil diupload');
      } else {
        throw new Error('Gagal mendapatkan URL gambar');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Gagal mengupload gambar');
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className={`space-y-4 w-full ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      {!value ? (
        <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors h-40"
        >
            {isUploading ? (
                <>
                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                    <p className="text-sm text-gray-500">Uploading...</p>
                </>
            ) : (
                <>
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">{placeholder}</p>
                    <p className="text-xs text-gray-500 mt-1">Klik untuk memilih file</p>
                </>
            )}
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 group">
            <div className="aspect-video w-full bg-gray-100 flex items-center justify-center">
                 <img 
                    src={value} 
                    alt="Uploaded" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Error+Loading+Image';
                    }}
                 />
            </div>
            
            <div className="absolute top-2 right-2">
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleRemove}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
            
             <div className="absolute bottom-2 right-2">
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-xs"
                    onClick={() => fileInputRef.current?.click()}
                >
                    Ganti
                </Button>
            </div>
        </div>
      )}
    </div>
  );
}
