import { useEffect, useState } from 'react';
import { TrendingUp, Package, XCircle, RefreshCw, ShoppingBag } from 'lucide-react';
import { useAdmin } from '@/lib/admin';

interface Stats {
  revenue: number;
  orderCount: number;
  productCount: number;
  pendingCancellations: number;
  pendingReplacements: number;
}

export function AdminDashboard() {
  const { authedFetch } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch('/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [authedFetch]);

  if (loading) return <div className="text-slate-500">Loading dashboard...</div>;

  const cards = [
    { label: 'Total Revenue', value: `₹${(stats?.revenue || 0).toFixed(0)}`, icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Total Orders', value: stats?.orderCount || 0, icon: ShoppingBag, color: 'bg-blue-500' },
    { label: 'Products', value: stats?.productCount || 0, icon: Package, color: 'bg-amber-500' },
    { label: 'Pending Cancellations', value: stats?.pendingCancellations || 0, icon: XCircle, color: 'bg-red-500' },
    { label: 'Pending Replacements', value: stats?.pendingReplacements || 0, icon: RefreshCw, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`w-10 h-10 rounded-lg ${c.color} text-white flex items-center justify-center mb-3`}>
              <c.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{c.value}</div>
            <div className="text-sm text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 mb-2">Welcome, Admin</h2>
        <p className="text-sm text-slate-500">
          Use the sidebar to manage your catalog, process orders, and review customer cancellation and replacement requests.
          All categories, brands, and products can be created, updated, activated, deactivated, or archived from their respective pages.
        </p>
      </div>
    </div>
  );
}
