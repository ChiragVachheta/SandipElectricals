import { useEffect, useState, FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { useAdmin } from '@/lib/admin';
import type { Brand } from '@/lib/types';

export function AdminBrands() {
  const { authedFetch } = useAdmin();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', is_active: true });

  const load = () => {
    setLoading(true);
    authedFetch('/brands').then((r) => r.json()).then((data) => {
      setBrands(data || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '', is_active: true });
    setShowForm(true);
  };

  const openEdit = (b: Brand) => {
    setEditing(b);
    setForm({ name: b.name, slug: b.slug, description: b.description || '', is_active: b.is_active });
    setShowForm(true);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const body = { ...form, slug: form.slug || slugify(form.name) };
    if (editing) {
      await authedFetch(`/brands/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      await authedFetch('/brands', { method: 'POST', body: JSON.stringify(body) });
    }
    setShowForm(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this brand?')) return;
    await authedFetch(`/brands/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Brands</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600">
          <Plus className="w-4 h-4" /> Add Brand
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{b.name}</td>
                  <td className="px-4 py-3 text-slate-500">{b.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {b.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(b)} className="p-1.5 text-slate-500 hover:text-amber-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(b.id)} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
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
          <form onSubmit={save} className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Brand' : 'New Brand'}</h2>
              <button type="button" onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
              <input placeholder="Slug (auto if empty)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-amber-500" />
                Active
              </label>
            </div>
            <button type="submit" className="w-full mt-4 py-2.5 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600">Save</button>
          </form>
        </div>
      )}
    </div>
  );
}
