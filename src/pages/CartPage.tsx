import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';

export function CartPage() {
  const { items, updateQty, removeItem, subtotal, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const deliveryCharge = subtotal > 0 ? (subtotal >= 2000 ? 0 : 49) : 0;
  const total = subtotal + deliveryCharge;

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">Loading cart...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h1 className="text-xl font-bold text-slate-800 mb-2">Your cart is empty</h1>
        <p className="text-slate-500 mb-6">Browse our catalog and add products to your cart.</p>
        <Link to="/" className="inline-block px-6 py-3 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Shopping Cart</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const p = item.product;
            if (!p) return null;
            return (
              <div key={item.id} className="flex gap-4 bg-white rounded-xl border border-slate-200 p-3">
                <Link to={`/product/${p.slug}`} className="w-24 h-24 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                  <img src={p.product_images?.[0]?.image_url} alt={p.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1">
                  <Link to={`/product/${p.slug}`} className="text-sm font-medium text-slate-800 hover:text-amber-600">
                    {p.name}
                  </Link>
                  <div className="text-xs text-slate-400">{p.brand?.name}</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-bold text-slate-900">₹{p.discount_price}</span>
                    {p.mrp > p.discount_price && (
                      <span className="text-xs text-slate-400 line-through">₹{p.mrp}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-slate-300 rounded-lg">
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} className="px-2 py-1 hover:bg-slate-100">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-sm">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} className="px-2 py-1 hover:bg-slate-100">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1">
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-32">
            <h2 className="font-bold text-slate-900 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Delivery</span>
                <span className="font-medium">{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
              </div>
              {deliveryCharge > 0 && (
                <p className="text-xs text-amber-600">Add ₹{(2000 - subtotal).toFixed(2)} more for free delivery</p>
              )}
              <div className="border-t pt-2 mt-2 flex justify-between text-base font-bold">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => navigate(user ? '/checkout' : '/auth?redirect=checkout')}
              className="w-full mt-4 py-3 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 flex items-center justify-center gap-2"
            >
              {user ? 'Proceed to Checkout' : 'Login to Checkout'} <ArrowRight className="w-4 h-4" />
            </button>
            <Link to="/" className="block text-center text-sm text-slate-500 hover:text-amber-600 mt-3">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
