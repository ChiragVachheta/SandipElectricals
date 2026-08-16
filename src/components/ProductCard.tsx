import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useCart } from '@/lib/cart';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const img = product.product_images?.[0]?.image_url;
  const discount = product.mrp > 0
    ? Math.round(((product.mrp - product.discount_price) / product.mrp) * 100)
    : 0;

  return (
    <div className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      <Link to={`/product/${product.slug}`} className="block aspect-square bg-slate-50 overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <ShoppingCart className="w-12 h-12" />
          </div>
        )}
      </Link>
      <div className="p-3 flex flex-col flex-1">
        <Link to={`/product/${product.slug}`} className="text-sm font-medium text-slate-800 line-clamp-2 hover:text-amber-600">
          {product.name}
        </Link>
        {product.brand && (
          <span className="text-xs text-slate-400 mt-0.5">{product.brand.name}</span>
        )}
        <div className="flex items-center gap-1 mt-1">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs text-slate-500">{product.rating || 'New'}</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-slate-900">₹{product.discount_price}</span>
          {product.mrp > product.discount_price && (
            <>
              <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
              <span className="text-xs text-green-600 font-semibold">{discount}% off</span>
            </>
          )}
        </div>
        <button
          onClick={() => addItem(product.id, 1)}
          disabled={product.status !== 'in_stock'}
          className="mt-3 w-full py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
        >
          {product.status === 'in_stock' ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
