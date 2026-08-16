import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, CreditCard, Banknote, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { FUNCTIONS_URL } from '@/lib/supabase';
import type { Address } from '@/lib/types';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, clear } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState({
    full_name: '', phone: '', pincode: '', house: '', street: '', city: 'Ahmedabad', state: 'Gujarat', landmark: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deliveryCharge = subtotal >= 2000 ? 0 : 49;
  const total = subtotal + deliveryCharge;

  useEffect(() => {
    if (!user) {
      navigate('/auth?redirect=checkout');
      return;
    }
    supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAddresses(data || []);
        if (data && data.length > 0) {
          const def = data.find((a) => a.is_default) || data[0];
          setSelectedAddress(def.id);
        } else {
          setShowAddrForm(true);
        }
      });
  }, [user, navigate]);

  if (items.length === 0 && !placing) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">Your cart is empty.</div>;
  }

  const saveAddress = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('addresses')
      .insert({ ...addrForm, user_id: user.id })
      .select()
      .single();
    if (error) {
      setError(error.message);
      return;
    }
    setAddresses((prev) => [data as Address, ...prev]);
    setSelectedAddress(data.id);
    setShowAddrForm(false);
  };

  const placeOrder = async () => {
    if (!user || !selectedAddress) {
      setError('Please select a delivery address.');
      return;
    }
    setError(null);
    setPlacing(true);

    try {
      // Validate stock availability
      for (const item of items) {
        if (!item.product || item.product.stock < item.quantity) {
          setError(`Insufficient stock for ${item.product?.name || 'a product'}.`);
          setPlacing(false);
          return;
        }
      }

      const orderNumber = `SND${Date.now().toString().slice(-8)}`;
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user.id,
          address_id: selectedAddress,
          subtotal,
          delivery_charge: deliveryCharge,
          discount: 0,
          total,
          payment_method: paymentMethod,
          status: 'processing',
        })
        .select()
        .single();

      if (orderErr || !order) {
        setError(orderErr?.message || 'Failed to create order.');
        setPlacing(false);
        return;
      }

      // Insert order items
      const orderItems = items.map((it) => ({
        order_id: order.id,
        product_id: it.product_id,
        name: it.product?.name || '',
        sku: it.product?.sku || null,
        image_url: it.product?.product_images?.[0]?.image_url || null,
        mrp: it.product?.mrp || 0,
        price: it.product?.discount_price || 0,
        quantity: it.quantity,
      }));
      await supabase.from('order_items').insert(orderItems);

      // Insert payment record
      if (paymentMethod === 'cod') {
        await supabase.from('payments').insert({
          order_id: order.id, amount: total, method: 'cod', status: 'pending',
        });
      } else {
        // Razorpay: create a pending payment record, then verify server-side
        await supabase.from('payments').insert({
          order_id: order.id, amount: total, method: 'razorpay', status: 'pending',
        });
        // NOTE: In production, a Razorpay order is created server-side and the
        // checkout modal opens here. After payment, the verify-razorpay edge
        // function verifies the signature before confirming the order.
        // For this demo we simulate a verified payment.
        const verifyRes = await fetch(`${FUNCTIONS_URL}/verify-razorpay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: `order_${order.id.slice(0, 14)}`,
            razorpay_payment_id: `pay_${Date.now()}`,
            razorpay_signature: 'demo_signature',
            order_id: order.id,
            amount: total,
          }),
        });
        if (!verifyRes.ok) {
          // Cancel the order so it doesn't sit as "processing" with a failed payment.
          await supabase.from('orders').update({
            status: 'cancelled', updated_at: new Date().toISOString(),
          }).eq('id', order.id);
          await supabase.from('payments').update({ status: 'failed' }).eq('order_id', order.id);
          await supabase.from('order_status_history').insert({
            order_id: order.id, status: 'cancelled', note: 'Payment verification failed',
          });
          setError('Online payment could not be verified. Please try again or use Cash on Delivery.');
          setPlacing(false);
          return;
        }
      }

      // Status history
      await supabase.from('order_status_history').insert({
        order_id: order.id, status: 'processing', note: 'Order placed',
      });

      // Clear cart
      await clear();

      navigate(`/orders?placed=${orderNumber}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred.');
      setPlacing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Checkout</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Address selection */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-bold text-slate-900 mb-4">Delivery Address</h2>
            {addresses.length > 0 && !showAddrForm && (
              <div className="space-y-2">
                {addresses.map((a) => (
                  <label key={a.id} className={`block p-3 rounded-lg border-2 cursor-pointer ${selectedAddress === a.id ? 'border-amber-500 bg-amber-50' : 'border-slate-200'}`}>
                    <div className="flex items-start gap-2">
                      <input type="radio" checked={selectedAddress === a.id} onChange={() => setSelectedAddress(a.id)} className="mt-1 accent-amber-500" />
                      <div className="text-sm">
                        <div className="font-medium">{a.full_name} · {a.phone}</div>
                        <div className="text-slate-600">{a.house}, {a.street}, {a.city}, {a.state} - {a.pincode}</div>
                        {a.landmark && <div className="text-slate-400">Landmark: {a.landmark}</div>}
                      </div>
                    </div>
                  </label>
                ))}
                <button onClick={() => setShowAddrForm(true)} className="text-sm text-amber-600 hover:underline">
                  + Add new address
                </button>
              </div>
            )}
            {showAddrForm && (
              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input placeholder="Full name" value={addrForm.full_name} onChange={(e) => setAddrForm({ ...addrForm, full_name: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                  <input placeholder="Phone" value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                  <input placeholder="Pincode" value={addrForm.pincode} onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                  <input placeholder="House / Flat no." value={addrForm.house} onChange={(e) => setAddrForm({ ...addrForm, house: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                  <input placeholder="Street / Area" value={addrForm.street} onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                  <input placeholder="Landmark (optional)" value={addrForm.landmark} onChange={(e) => setAddrForm({ ...addrForm, landmark: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                  <input placeholder="City" value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                  <input placeholder="State" value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                </div>
                {/* GPS placeholder */}
                <button type="button" className="flex items-center gap-2 text-sm text-blue-600 hover:underline" disabled>
                  <Navigation className="w-4 h-4" /> Use my current location (GPS) — coming soon
                </button>
                <div className="flex gap-2">
                  <button onClick={saveAddress} className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600">Save Address</button>
                  {addresses.length > 0 && (
                    <button onClick={() => setShowAddrForm(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-sm">Cancel</button>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Payment method */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-bold text-slate-900 mb-4">Payment Method</h2>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer ${paymentMethod === 'cod' ? 'border-amber-500 bg-amber-50' : 'border-slate-200'}`}>
                <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-amber-500" />
                <Banknote className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-sm font-medium">Cash on Delivery</div>
                  <div className="text-xs text-slate-500">Pay when you receive the product</div>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer ${paymentMethod === 'razorpay' ? 'border-amber-500 bg-amber-50' : 'border-slate-200'}`}>
                <input type="radio" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} className="accent-amber-500" />
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium">Online Payment (Razorpay)</div>
                  <div className="text-xs text-slate-500">Pay securely with UPI, cards, net banking</div>
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Summary */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-32">
            <h2 className="font-bold text-slate-900 mb-4">Order Summary</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
              {items.map((it) => (
                <div key={it.id} className="flex justify-between text-sm">
                  <span className="text-slate-600">{it.product?.name} × {it.quantity}</span>
                  <span>₹{((it.product?.discount_price || 0) * it.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Delivery</span><span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span></div>
              <div className="flex justify-between text-base font-bold pt-1"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <button
              onClick={placeOrder}
              disabled={placing || !selectedAddress}
              className="w-full mt-4 py-3 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:bg-slate-300 flex items-center justify-center gap-2"
            >
              {placing ? <><Loader2 className="w-5 h-5 animate-spin" /> Placing order...</> : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
