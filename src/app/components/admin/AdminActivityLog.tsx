import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Loader2, Activity } from 'lucide-react';
import { adminApi, type ActivityLog } from '../../services/adminApi';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/helpers';
import { toast } from 'sonner';

export function AdminActivityLog() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchLogs();
    }
  }, [user]);

  const fetchLogs = async () => {
    try {
      if (!user?.id) return;
      const response = await adminApi.getUserActivities(user.id);
      if (response.success && response.data) {
        setLogs(response.data);
      }
    } catch (error) {
      toast.error('Gagal memuat log aktivitas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          Log Aktivitas Saya
        </h2>
        <p className="text-gray-500 mt-1">Riwayat tindakan yang Anda lakukan dalam sistem.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-[200px]">Waktu</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-[150px]">Aksi</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Detail</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-[150px]">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Belum ada aktivitas tercatat.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <span className="bg-sky-100 text-sky-800 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide">
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.details}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">
                      {log.ip_address}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
