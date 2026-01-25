import { toast } from './toast';
import type { ApiResponse } from '../types';

/**
 * Centralized API response handler
 * Automatically shows error toast if success is false
 */
export async function handleApi<T>(
  request: Promise<ApiResponse<T>>,
  options?: {
    showSuccess?: boolean;
    successMessage?: string;
    description?: string;
  }
): Promise<T | null> {
  try {
    const response = await request;

    if (response.success) {
      if (options?.showSuccess) {
        toast.success(options.successMessage || 'Berhasil', {
          description: options.description,
        });
      }
      return response.data as T;
    } else {
      // Handle detailed validation errors if present
      let errorDesc = response.message || 'Terjadi kesalahan sistem';
      
      // If backend provides an "errors" object, we try to format it
      const anyResponse = response as any;
      if (anyResponse.errors) {
        if (typeof anyResponse.errors === 'object') {
          const firstError = Object.values(anyResponse.errors)[0];
          if (firstError) errorDesc = String(firstError);
        } else if (typeof anyResponse.errors === 'string') {
          errorDesc = anyResponse.errors;
        }
      }

      toast.error('Gagal', {
        description: errorDesc,
      });
      return null;
    }
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error('Gagal', {
      description: error.message || 'Terjadi kesalahan koneksi',
    });
    return null;
  }
}

// Format currency to IDR
export function formatCurrency(amount: number): string {
  if (amount === 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date to Indonesian format
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Convert ISO string or any date string to YYYY-MM-DD for <input type="date">
export function formatISOToDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

// Format date and time to Indonesian format
export function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Format time from HH:mm:ss to HH:mm
export function formatTime(timeString: string): string {
  if (!timeString) return '00:00';
  return timeString.substring(0, 5);
}