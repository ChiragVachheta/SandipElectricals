import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package, Truck, MapPin, CheckCircle2, Clock, XCircle,
  CheckCircle, Loader2, MessageSquare, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Order, OrderItem, Payment, Address, DeliveryInstruction } from '@/lib/types';

interface FullOrder extends Order {
  order_items: OrderItem[];
  payments: Payment[];
  address: Address | null;
}

const STATUS_STEPS = [
  { key: 'processing', label: 'Processing', icon: Clock },
  { key: 'dispatched', label: 'Dispatched', icon: Package },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

export function OrdersPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const justPlaced = params.get('placed');
  const [orders, setOrders] = useState<FullOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<Record<string, string>>({});
  const [cancelReason, setCancelReason] = useState('');
  const [replaceReason, setReplaceReason] = useState('');
  const [replaceItemId, setReplaceItemId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select('*, order_items(*), payments(*), address:addresses(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data as FullOrder[] || []);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (justPlaced) {
      setToast(`Order ${justPlaced} placed successfully!`);
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [justPlaced]);

  if (!user) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">Please login to view your orders.</div>;
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">Loading orders...</div>;
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const saveInstruction = async (orderId: string) => {
    const text = instructions[orderId];
    const { data: existing } = await supabase
      .from('delivery_instructions')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (existing) {
      await supabase.from('delivery_instructions').update({
        instruction: text, updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
    } else {
      await supabase.from('delivery_instructions').insert({
        order_id: orderId, user_id: user.id, instruction: text,
      });
    }
    showToast('Delivery instruction saved.');
  };

  const cancelOrder = async (orderId: string) => {
    if (!cancelReason.trim()) {
      showToast('Please enter a cancellation reason.');
      return;
    }
    await supabase.from('cancellation_requests').insert({
      order_id: orderId, user_id: user.id, reason: cancelReason,
    });
    setCancelReason('');
    setActiveOrder(null);
    showToast('Cancellation request submitted. Admin will review it.');
  };

  const requestReplacement = async (orderId: string) => {
    if (!replaceReason.trim() || !replaceItemId) {
      showToast('Please enter a reason and select an item.');
      return;
    }
    await supabase.from('replacement_requests').insert({
      order_id: orderId, order_item_id: replaceItemId, user_id: user.id,
      reason: replaceReason, media_urls: [],
    });
    setReplaceReason('');
    setReplaceItemId(null);
    setActiveOrder(null);
    showToast('Replacement request submitted. Admin will review it.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Orders</h1>
      {toast && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {toast}
        </div>
      )}
      {orders.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          You haven't placed any orders yet.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const stepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
            const canCancel = order.status === 'processing';
            const canReplace = order.status === 'delivered' &&
              (new Date().getTime() - new Date(order.updated_at).getTime()) / (1000 * 60 * 60 * 24) <= 7;

            return (
              <div key={order.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900">{order.order_number}</div>
                    <div className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">₹{order.total.toFixed(2)}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="p-4">
                  <div className="space-y-2">
                    {order.order_items.map((it) => (
                      <div key={it.id} className="flex gap-3 items-center">
                        <div className="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden shrink-0">
                          {it.image_url && <img src={it.image_url} alt={it.name} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 text-sm">
                          <div className="font-medium text-slate-800">{it.name}</div>
                          <div className="text-slate-500">Qty: {it.quantity} · ₹{it.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Address */}
                  {order.address && (
                    <div className="mt-3 flex items-start gap-2 text-xs text-slate-500">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{order.address.house}, {order.address.street}, {order.address.city}, {order.address.state} - {order.address.pincode}</span>
                    </div>
                  )}

                  {/* Status tracker */}
                  {order.status !== 'cancelled' && (
                    <div className="mt-4 flex items-center justify-between">
                      {STATUS_STEPS.map((step, i) => {
                        const done = i <= stepIndex;
                        const Icon = step.icon;
                        return (
                          <div key={step.key} className="flex-1 flex items-center">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="text-[10px] mt-1 text-slate-500 text-center">{step.label}</span>
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-1 ${i < stepIndex ? 'bg-amber-500' : 'bg-slate-200'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {canCancel && (
                      <button
                        onClick={() => setActiveOrder(`cancel-${order.id}`)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" /> Cancel Order
                      </button>
                    )}
                    {canReplace && (
                      <button
                        onClick={() => setActiveOrder(`replace-${order.id}`)}
                        className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 text-sm hover:bg-blue-50 flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-4 h-4" /> Request Replacement
                      </button>
                    )}
                    {order.status !== 'delivered' && order.status !== 'dispatched' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => setActiveOrder(`instr-${order.id}`)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4" /> Delivery Instructions
                      </button>
                    )}
                  </div>

                  {/* Inline forms */}
                  {activeOrder === `instr-${order.id}` && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-50">
                      <textarea
                        placeholder="e.g. Call before delivery, leave at the door..."
                        value={instructions[order.id] || ''}
                        onChange={(e) => setInstructions({ ...instructions, [order.id]: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                        rows={2}
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => saveInstruction(order.id)} className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm">Save</button>
                        <button onClick={() => setActiveOrder(null)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm">Close</button>
                      </div>
                    </div>
                  )}

                  {activeOrder === `cancel-${order.id}` && (
                    <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
                      <label className="text-sm font-medium text-red-700 block mb-1">Reason for cancellation (required)</label>
                      <textarea
                        placeholder="Why are you cancelling this order?"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-red-300 text-sm"
                        rows={2}
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => cancelOrder(order.id)} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm">Submit Request</button>
                        <button onClick={() => { setActiveOrder(null); setCancelReason(''); }} className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm">Close</button>
                      </div>
                    </div>
                  )}

                  {activeOrder === `replace-${order.id}` && (
                    <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <label className="text-sm font-medium text-blue-700 block mb-1">Select item</label>
                      <select
                        value={replaceItemId || ''}
                        onChange={(e) => setReplaceItemId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-blue-300 text-sm mb-2"
                      >
                        <option value="">Choose an item</option>
                        {order.order_items.map((it) => (
                          <option key={it.id} value={it.id}>{it.name}</option>
                        ))}
                      </select>
                      <label className="text-sm font-medium text-blue-700 block mb-1">Reason (defective, damaged, etc.)</label>
                      <textarea
                        placeholder="Describe the issue"
                        value={replaceReason}
                        onChange={(e) => setReplaceReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-blue-300 text-sm"
                        rows={2}
                      />
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Media upload available after admin review.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => requestReplacement(order.id)} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm">Submit Request</button>
                        <button onClick={() => { setActiveOrder(null); setReplaceReason(''); setReplaceItemId(null); }} className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm">Close</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
