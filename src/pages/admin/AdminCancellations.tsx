import { useEffect, useState } from 'react';
import { Loader2, X, Check, XCircle } from 'lucide-react';
import { useAdmin } from '@/lib/admin';
import type { CancellationRequest } from '@/lib/types';

export function AdminCancellations() {
  const { authedFetch } = useAdmin();
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<CancellationRequest | null>(null);
  const [remark, setRemark] = useState('');

  const load = () => {
    setLoading(true);
    authedFetch('/cancellation-requests').then((r) => r.json()).then((data) => {
      setRequests(data || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const resolve = async (id: string, status: 'approved' | 'rejected') => {
    await authedFetch(`/cancellation-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, admin_remark: remark }),
    });
    setActive(null);
    setRemark('');
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Cancellation Requests</h1>

      {loading ? (
        <div className="text-slate-500 flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading...</div>
      ) : requests.length === 0 ? (
        <p className="text-slate-500">No cancellation requests.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800">Order {r.order?.order_number || r.order_id}</div>
                  <div className="text-sm text-slate-500 mt-1">{r.reason}</div>
                  <div className="text-xs text-slate-400 mt-1">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  r.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>{r.status}</span>
              </div>
              {r.status === 'pending' && (
                <button onClick={() => { setActive(r); setRemark(''); }} className="mt-3 px-3 py-1.5 rounded-lg border border-slate-300 text-sm hover:bg-slate-50">
                  Review
                </button>
              )}
              {r.admin_remark && (
                <div className="mt-2 text-xs text-slate-500">Admin remark: {r.admin_remark}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setActive(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Review Cancellation</h2>
              <button onClick={() => setActive(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="text-sm text-slate-600 mb-3">
              <div className="font-medium">Order: {active.order?.order_number || active.order_id}</div>
              <div className="mt-1">Reason: {active.reason}</div>
            </div>
            <input placeholder="Admin remark" value={remark} onChange={(e) => setRemark(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm mb-3" />
            <div className="flex gap-2">
              <button onClick={() => resolve(active.id, 'approved')} className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" /> Approve
              </button>
              <button onClick={() => resolve(active.id, 'rejected')} className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-1.5">
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
