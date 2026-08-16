import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Truck, ShieldCheck, Headphones, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Category, Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setCategories(data || []));

    supabase
      .from('products')
      .select('*, category:categories(*), brand:brands(*), product_images(*)')
      .eq('is_featured', true)
      .eq('status', 'in_stock')
      .limit(8)
      .then(({ data }) => setFeatured(data as Product[] || []));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #f59e0b 0, transparent 50%), radial-gradient(circle at 80% 80%, #3b82f6 0, transparent 50%)'
        }} />
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-4">
              Trusted Electricals Store in Ahmedabad
            </span>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              Powering your home with <span className="text-amber-400">quality</span> electricals
            </h1>
            <p className="mt-4 text-slate-300 text-lg">
              Fans, lights, wires, switches & appliances from top brands at the best prices.
            </p>
            <div className="mt-6 flex gap-3">
              <Link to="/category/fans" className="px-6 py-3 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 transition">
                Shop Now
              </Link>
              <Link to="/search?q=featured" className="px-6 py-3 rounded-lg border border-slate-600 text-white font-semibold hover:bg-slate-800 transition">
                Browse Catalog
              </Link>
            </div>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-4">
            {featured.slice(0, 4).map((p) => (
              <Link key={p.id} to={`/product/${p.slug}`} className="rounded-xl overflow-hidden bg-white/5 backdrop-blur border border-white/10 hover:scale-105 transition">
                <img src={p.product_images?.[0]?.image_url} alt={p.name} className="w-full h-32 object-cover" />
                <div className="p-2 text-xs">{p.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Truck, title: 'Fast Delivery', desc: 'Across Ahmedabad' },
            { icon: ShieldCheck, title: '7-Day Replacement', desc: 'On eligible items' },
            { icon: Tag, title: 'Best Prices', desc: 'Genuine products' },
            { icon: Headphones, title: 'Expert Support', desc: 'WhatsApp us anytime' },
          ].map((b) => (
            <div key={b.title} className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-600">
                <b.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">{b.title}</div>
                <div className="text-xs text-slate-500">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Shop by Category</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/category/${c.slug}`}
              className="group flex flex-col items-center p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition bg-white"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mb-2 group-hover:from-amber-200 transition">
                <span className="text-xl font-bold text-amber-600">
                  {c.name.charAt(0)}
                </span>
              </div>
              <span className="text-xs font-medium text-center text-slate-700 group-hover:text-amber-600">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Featured Products</h2>
          <Link to="/search?q=featured" className="text-sm text-amber-600 hover:underline flex items-center">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-slate-500">No featured products yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
