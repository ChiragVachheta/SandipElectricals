import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Zap, Truck, ShieldCheck, ChevronRight, Minus, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/types';
import { useCart } from '@/lib/cart';

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from('products')
      .select('*, category:categories(*), brand:brands(*), product_images(*), product_specifications(*)')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        setProduct(data as Product | null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">Loading product...</div>;
  }

  if (!product) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">Product not found.</div>;
  }

  const discount = product.mrp > 0
    ? Math.round(((product.mrp - product.discount_price) / product.mrp) * 100)
    : 0;

  const handleAddToCart = async () => {
    await addItem(product.id, qty);
    navigate('/cart');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <nav className="text-xs text-slate-500 mb-4">
        <Link to="/" className="hover:text-amber-600">Home</Link> /{' '}
        {product.category && (
          <>
            <Link to={`/category/${product.category.slug}`} className="hover:text-amber-600">
              {product.category.name}
            </Link>{' '}/{' '}
          </>
        )}
        <span className="text-slate-700">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-200">
            <img
              src={product.product_images?.[activeImg]?.image_url || product.product_images?.[0]?.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.product_images && product.product_images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {product.product_images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${activeImg === i ? 'border-amber-500' : 'border-slate-200'}`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.brand && (
            <span className="text-sm text-slate-500">{product.brand.name}</span>
          )}
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{product.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm text-slate-600">{product.rating || 'New'}</span>
            </div>
            <span className="text-slate-300">|</span>
            <span className="text-sm text-slate-500">SKU: {product.sku}</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900">₹{product.discount_price}</span>
            {product.mrp > product.discount_price && (
              <>
                <span className="text-lg text-slate-400 line-through">₹{product.mrp}</span>
                <span className="text-sm text-green-600 font-semibold">{discount}% off</span>
              </>
            )}
          </div>

          <div className="mt-3">
            {product.status === 'in_stock' ? (
              <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                <Zap className="w-4 h-4" /> In Stock ({product.stock} available)
              </span>
            ) : product.status === 'out_of_stock' ? (
              <span className="text-sm text-red-600 font-medium">Out of Stock</span>
            ) : (
              <span className="text-sm text-slate-500">Unavailable</span>
            )}
          </div>

          <p className="mt-4 text-slate-600 text-sm leading-relaxed">{product.description}</p>

          {/* Quantity + Add to cart */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border border-slate-300 rounded-lg">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-2 hover:bg-slate-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="px-3 py-2 hover:bg-slate-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.status !== 'in_stock'}
              className="flex-1 py-3 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:bg-slate-300 transition flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" /> Add to Cart
            </button>
          </div>

          {/* Trust */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Truck className="w-5 h-5 text-amber-500" /> Fast delivery
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="w-5 h-5 text-amber-500" /> 7-day replacement
            </div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      {product.product_specifications && product.product_specifications.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Specifications</h2>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {product.product_specifications.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-700 bg-slate-50 w-1/3">{s.spec_name}</td>
                    <td className="px-4 py-3 text-slate-600">{s.spec_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
