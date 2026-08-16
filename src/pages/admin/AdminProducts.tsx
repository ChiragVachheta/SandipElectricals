import { useEffect, useState, FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAdmin } from '@/lib/admin';
import { supabase } from '@/lib/supabase';
import type { Category, Brand, Product, ProductImage, ProductSpecification } from '@/lib/types';

interface AdminProduct extends Product {
  product_images?: ProductImage[];
  product_specifications?: ProductSpecification[];
}

export function AdminProducts() {
  const { authedFetch } = useAdmin();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [showForm, setShowForm] = useState(false);

  const emptyForm = {
    name: '', slug: '', sku: '', description: '', category_id: '', brand_id: '',
    mrp: 0, discount_price: 0, stock: 0, status: 'in_stock' as Product['status'],
    is_featured: false, rating: 0, search_keywords: '',
    images: [] as string[], specifications: [] as { spec_name: string; spec_value: string }[],
  };
  const [form, setForm] = useState(emptyForm);
  const [imageUrl, setImageUrl] = useState('');
  const [specName, setSpecName] = useState('');
  const [specValue, setSpecValue] = useState('');

  const load = () => {
    setLoading(true);
    authedFetch('/products').then((r) => r.json()).then((data) => {
      setProducts(data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories(data || []));
    supabase.from('brands').select('*').order('name').then(({ data }) => setBrands(data || []));
  }, []);

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug, sku: p.sku, description: p.description || '',
      category_id: p.category_id || '', brand_id: p.brand_id || '',
      mrp: Number(p.mrp), discount_price: Number(p.discount_price), stock: p.stock,
      status: p.status, is_featured: p.is_featured, rating: Number(p.rating),
      search_keywords: p.search_keywords || '',
      images: (p.product_images || []).sort((a, b) => a.sort_order - b.sort_order).map((i) => i.image_url),
      specifications: (p.product_specifications || []).map((s) => ({ spec_name: s.spec_name, spec_value: s.spec_value })),
    });
    setShowForm(true);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const body = {
      ...form,
      slug: form.slug || slugify(form.name),
      mrp: Number(form.mrp),
      discount_price: Number(form.discount_price),
      stock: Number(form.stock),
    };
    if (editing) {
      await authedFetch(`/products/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      await authedFetch('/products', { method: 'POST', body: JSON.stringify(body) });
    }
    setShowForm(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await authedFetch(`/products/${id}`, { method: 'DELETE' });
    load();
  };

  const addImage = () => {
    if (!imageUrl.trim()) return;
    setForm({ ...form, images: [...form.images, imageUrl.trim()] });
    setImageUrl('');
  };

  const addSpec = () => {
    if (!specName.trim() || !specValue.trim()) return;
    setForm({ ...form, specifications: [...form.specifications, { spec_name: specName, spec_value: specValue }] });
    setSpecName('');
    setSpecValue('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-left font-medium">SKU</th>
                <th className="px-4 py-3 text-left font-medium">Price</th>
                <th className="px-4 py-3 text-left font-medium">Stock</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.product_images?.[0]?.image_url && (
                        <img src={p.product_images[0].image_url} alt="" className="w-10 h-10 rounded object-cover" />
                      )}
                      <div>
                        <div className="font-medium text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-400">{p.category?.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.sku}</td>
                  <td className="px-4 py-3">₹{p.discount_price}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      p.status === 'in_stock' ? 'bg-green-100 text-green-700' :
                      p.status === 'out_of_stock' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                    }`}>{p.status.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-slate-500 hover:text-amber-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(p.id)} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <form onSubmit={save} className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Product' : 'New Product'}</h2>
              <button type="button" onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
              <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
                <option value="">Select brand</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <input type="number" step="0.01" placeholder="MRP" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
              <input type="number" step="0.01" placeholder="Discount price" value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
              <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Product['status'] })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="inactive">Inactive</option>
              </select>
              <input placeholder="Search keywords" value={form.search_keywords} onChange={(e) => setForm({ ...form, search_keywords: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm sm:col-span-2" />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="px-3 py-2 rounded-lg border border-slate-300 text-sm sm:col-span-2" />
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="accent-amber-500" />
                Featured product
              </label>
            </div>

            {/* Images */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Images</h3>
              <div className="flex gap-2 mb-2">
                <input placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                <button type="button" onClick={addImage} className="px-3 py-2 rounded-lg bg-slate-200 text-sm">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.images.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">X</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Specifications */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Specifications</h3>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input placeholder="Spec name" value={specName} onChange={(e) => setSpecName(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                <input placeholder="Spec value" value={specValue} onChange={(e) => setSpecValue(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                <button type="button" onClick={addSpec} className="px-3 py-2 rounded-lg bg-slate-200 text-sm">Add</button>
              </div>
              <div className="space-y-1">
                {form.specifications.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-slate-50 px-3 py-1.5 rounded">
                    <span><strong>{s.spec_name}:</strong> {s.spec_value}</span>
                    <button type="button" onClick={() => setForm({ ...form, specifications: form.specifications.filter((_, idx) => idx !== i) })} className="text-red-500">X</button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full mt-6 py-2.5 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600">Save Product</button>
          </form>
        </div>
      )}
    </div>
  );
}
