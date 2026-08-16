import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, LogOut, Package } from 'lucide-react';
import { Logo } from './Logo';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { BUSINESS } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export function Header() {
  const { count } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [cats, setCats] = useState<{ name: string; slug: string }[]>([]);

  useEffect(() => {
    supabase
      .from('categories')
      .select('name, slug')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setCats(data || []));
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Top bar */}
      <div className="bg-slate-900 text-slate-200 text-xs">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
          <span className="hidden sm:inline">Delivering across Ahmedabad & Gujarat</span>
          <a href={`tel:${BUSINESS.mobile}`} className="hover:text-amber-400">
            Call: {BUSINESS.mobile}
          </a>
        </div>
      </div>

      {/* Main bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <button className="lg:hidden" onClick={() => setMenuOpen(true)}>
          <Menu className="w-6 h-6" />
        </button>
        <Logo />
        <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
          <div className="flex w-full">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for fans, bulbs, wires..."
              className="flex-1 px-4 py-2.5 rounded-l-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
            <button type="submit" className="px-5 bg-amber-500 text-white rounded-r-md hover:bg-amber-600 transition">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>
        <div className="flex items-center gap-4 ml-auto">
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/orders" className="hidden sm:flex items-center gap-1.5 text-sm text-slate-700 hover:text-amber-600">
                <Package className="w-5 h-5" /> Orders
              </Link>
              <button onClick={signOut} className="flex items-center gap-1.5 text-sm text-slate-700 hover:text-amber-600">
                <LogOut className="w-5 h-5" /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link to="/auth" className="flex items-center gap-1.5 text-sm text-slate-700 hover:text-amber-600">
              <User className="w-5 h-5" /> <span className="hidden sm:inline">Login</span>
            </Link>
          )}
          <Link to="/cart" className="relative">
            <ShoppingCart className="w-6 h-6 text-slate-700 hover:text-amber-600" />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile search */}
      <form onSubmit={onSearch} className="md:hidden px-4 pb-3">
        <div className="flex w-full">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="flex-1 px-4 py-2.5 rounded-l-md border border-slate-300 text-sm"
          />
          <button type="submit" className="px-5 bg-amber-500 text-white rounded-r-md">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Category nav */}
      <nav className="hidden lg:block border-t border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
          <Link to="/" className={`px-3 py-2.5 text-sm font-medium hover:text-amber-600 ${location.pathname === '/' ? 'text-amber-600' : 'text-slate-700'}`}>
            Home
          </Link>
          {cats.map((c) => (
            <Link
              key={c.slug}
              to={`/category/${c.slug}`}
              className="px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-amber-600 whitespace-nowrap"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <Logo />
              <button onClick={() => setMenuOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-2">
              <Link to="/" className="block px-3 py-2.5 rounded hover:bg-slate-100" onClick={() => setMenuOpen(false)}>
                Home
              </Link>
              {cats.map((c) => (
                <Link
                  key={c.slug}
                  to={`/category/${c.slug}`}
                  className="block px-3 py-2.5 rounded hover:bg-slate-100"
                  onClick={() => setMenuOpen(false)}
                >
                  {c.name}
                </Link>
              ))}
              <div className="border-t mt-2 pt-2">
                {user ? (
                  <>
                    <Link to="/orders" className="block px-3 py-2.5 rounded hover:bg-slate-100" onClick={() => setMenuOpen(false)}>
                      My Orders
                    </Link>
                    <button onClick={() => { signOut(); setMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 rounded hover:bg-slate-100">
                      Logout
                    </button>
                  </>
                ) : (
                  <Link to="/auth" className="block px-3 py-2.5 rounded hover:bg-slate-100" onClick={() => setMenuOpen(false)}>
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
