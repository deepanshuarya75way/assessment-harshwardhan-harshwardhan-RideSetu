'use client';

import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function OpsAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/audit-logs');
        const data = await res.json();
        if (data.logs) setLogs(data.logs);
      } catch (err) {
        console.error('Ops audit logs error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black font-heading text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-emerald-600" /> Immutable Platform Audit Logs
        </h1>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Cryptographically immutable security telemetry for every administrative action, KYC decision, and vendor approval.
        </p>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <th className="py-3 px-4 rounded-l-xl">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Admin User</th>
                <th className="py-3 px-4 text-right rounded-r-xl">IP Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-amber-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-600 font-medium">{formatDateTime(log.createdAt)}</td>
                  <td className="py-3.5 px-4 font-extrabold text-emerald-700">{log.action}</td>
                  <td className="py-3.5 px-4 text-slate-900 font-bold">{log.entityType}: {log.entityId}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{log.adminName || 'Super Admin'}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 text-right">{log.ipAddress || '127.0.0.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
