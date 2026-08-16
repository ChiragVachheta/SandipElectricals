import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Filter, X, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Category, Brand, Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [category, setCategory] = useState<Category | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => setCategory(data as Category | null));
  }, [slug]);

  useEffect(() => {
    supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setBrands(data || []));
  }, []);

  useEffect(() => {
    if (!slug) return;
    let q = supabase
      .from('products')
      .select('*, category:categories(*), brand:brands(*), product_images(*)')
      .eq('category_id', category?.id || '')
      .neq('status', 'inactive');

    if (query) {
      q = q.or(`name.ilike.%${query}%,sku.ilike.%${query}%,search_keywords.ilike.%${query}%`);
    }
    if (selectedBrands.length) {
      q = q.in('brand_id', selectedBrands);
    }

    q.then(({ data }) => setProducts((data as Product[]) || []));
  }, [slug, category, query, selectedBrands]);

  const toggleBrand = (id: string) => {
    setSelectedBrands((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <nav className="text-xs text-slate-500 mb-4">
        <Link to="/" className="hover:text-amber-600">Home</Link> /{' '}
        <span className="text-slate-700">{category?.name || 'Category'}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{category?.name || 'Products'}</h1>
        <button
          onClick={() => setShowFilters(true)}
          className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm"
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-32">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
            </h3>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-600 mb-2">Brands</h4>
              <div className="space-y-2">
                {brands.map((b) => (
                  <label key={b.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(b.id)}
                      onChange={() => toggleBrand(b.id)}
                      className="rounded accent-amber-500"
                    />
                    {b.name}
                  </label>
                ))}
              </div>
            </div>
            {selectedBrands.length > 0 && (
              <button
                onClick={() => setSelectedBrands([])}
                className="text-xs text-amber-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              No products found in this category.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={() => setShowFilters(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <h4 className="text-sm font-medium mb-2">Brands</h4>
            <div className="space-y-2">
              {brands.map((b) => (
                <label key={b.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(b.id)}
                    onChange={() => toggleBrand(b.id)}
                    className="rounded accent-amber-500"
                  />
                  {b.name}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
