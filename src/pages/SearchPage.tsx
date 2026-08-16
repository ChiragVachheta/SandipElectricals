import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    supabase
      .from('products')
      .select('*, category:categories(*), brand:brands(*), product_images(*)')
      .neq('status', 'inactive')
      .or(`name.ilike.%${q}%,sku.ilike.%${q}%,search_keywords.ilike.%${q}%`)
      .limit(24)
      .then(({ data }) => {
        setResults((data as Product[]) || []);
        setLoading(false);
      });
  }, [q]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        Search Results
      </h1>
      <p className="text-sm text-slate-500 mb-6 flex items-center gap-2">
        <SearchIcon className="w-4 h-4" />
        {results.length} result(s) for "{q}"
      </p>

      {loading ? (
        <p className="text-slate-500">Searching...</p>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          No products matched your search. Try a different keyword.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
