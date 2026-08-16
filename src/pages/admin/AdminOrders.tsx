import { useEffect, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { useAdmin } from '@/lib/admin';
import type { Order, OrderItem, Payment, Address } from '@/lib/types';

interface AdminOrder extends Order {
  order_items: OrderItem[];
  payments: Payment[];
  address: Address | null;
}

const STATUSES = ['processing', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled'] as const;

export function AdminOrders() {
  const { authedFetch } = useAdmin();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<AdminOrder | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');

  const load = () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (filter) qs.set('status', filter);
    if (query) qs.set('q', query);
    authedFetch(`/orders?${qs.toString()}`).then((r) => r.json()).then((data) => {
      setOrders(data || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [filter, query]);

  const updateStatus = async (id: string) => {
    if (!newStatus) return;
    await authedFetch(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus, note }),
    });
    setActive(null);
    setNewStatus('');
    setNote('');
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Orders</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search order number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-slate-500 flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading...</div>
      ) : orders.length === 0 ? (
        <p className="text-slate-500">No orders found.</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Order #</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Items</th>
                <th className="px-4 py-3 text-left font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Payment</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{o.order_number}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-500">{o.order_items?.length || 0} items</td>
                  <td className="px-4 py-3">₹{o.total.toFixed(0)}</td>
                  <td className="px-4 py-3 text-slate-500 capitalize">{o.payment_method}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      o.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>{o.status.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setActive(o); setNewStatus(o.status); }} className="text-amber-600 text-sm hover:underline">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setActive(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Order {active.order_number}</h2>
              <button onClick={() => setActive(null)}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="text-slate-500">Placed: {new Date(active.created_at).toLocaleString()}</div>
              <div className="text-slate-500">Payment: {active.payment_method} ({active.payments?.[0]?.status || 'pending'})</div>

              {active.address && (
                <div className="p-3 rounded-lg bg-slate-50">
                  <div className="font-medium text-slate-700">Delivery Address</div>
                  <div className="text-slate-600">{active.address.full_name} · {active.address.phone}</div>
                  <div className="text-slate-600">{active.address.house}, {active.address.street}, {active.address.city}, {active.address.state} - {active.address.pincode}</div>
                </div>
              )}

              <div>
                <div className="font-medium text-slate-700 mb-1">Items</div>
                {active.order_items?.map((it) => (
                  <div key={it.id} className="flex justify-between text-slate-600">
                    <span>{it.name} × {it.quantity}</span>
                    <span>₹{(it.price * it.quantity).toFixed(0)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-2 border-t mt-2">
                  <span>Total</span><span>₹{active.total.toFixed(0)}</span>
                </div>
              </div>

              <div className="pt-2">
                <label className="text-sm font-medium text-slate-700 block mb-1">Update Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
                <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="w-full mt-2 px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                <button onClick={() => updateStatus(active.id)} className="w-full mt-3 py-2.5 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600">Update Status</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
