import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderTree, Package, ClipboardList, Circle as XCircle, RefreshCw, LogOut, Zap, ExternalLink } from 'lucide-react';
import { useAdmin } from '@/lib/admin';

export function AdminLayout() {
  const { token, logout } = useAdmin();
  const navigate = useNavigate();

  if (!token) return <Navigate to="/admin/login" replace />;

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/categories', label: 'Categories', icon: FolderTree },
    { to: '/admin/brands', label: 'Brands', icon: Package },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
    { to: '/admin/cancellations', label: 'Cancellations', icon: XCircle },
    { to: '/admin/replacements', label: 'Replacements', icon: RefreshCw },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed inset-y-0 left-0 z-30">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500 text-white">
              <Zap className="w-5 h-5" fill="currentColor" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Sandip Electricals</div>
              <div className="text-[10px] uppercase tracking-widest text-amber-500">Admin</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-amber-500 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              <item.icon className="w-4 h-4" /> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800 space-y-1">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
          >
            <ExternalLink className="w-4 h-4" /> View Storefront
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-64">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
