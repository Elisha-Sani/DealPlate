const STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  revoked: 'bg-red-100 text-red-800',
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full whitespace-nowrap ${style}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
