import { ScrollText } from 'lucide-react';
import type { AdminActionRow } from '@/app/actions/adminGetAuditLog';

export function AuditLogTab({ auditLog }: { auditLog: AdminActionRow[] }) {
  return (
    <section className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-[#E2E8F0] flex items-center gap-2">
        <ScrollText className="w-5 h-5 text-[#FF6B00]" />
        <h2 className="font-bold text-lg">Audit Log</h2>
        <span className="text-xs text-gray-400 font-medium">(most recent 200 actions)</span>
      </div>
      <div className="divide-y divide-[#E2E8F0] max-h-[70vh] overflow-y-auto">
        {auditLog.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">No admin actions recorded yet.</p>
        ) : (
          auditLog.map((entry) => (
            <div key={entry.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 justify-between text-sm">
              <div>
                <span className="font-bold text-[#1E293B]">{entry.admin_email}</span>
                <span className="text-gray-500"> {entry.action_type} </span>
                <span className="text-gray-500">{entry.target_type} ({entry.target_id.slice(0, 8)})</span>
                {entry.reason && <p className="text-xs text-gray-400 mt-0.5">Reason: {entry.reason}</p>}
              </div>
              <span className="text-xs text-gray-400 shrink-0">{new Date(entry.created_at).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
