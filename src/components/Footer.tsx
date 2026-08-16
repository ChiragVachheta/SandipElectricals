import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Zap } from 'lucide-react';
import { BUSINESS } from '@/lib/types';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500 text-white">
              <Zap className="w-5 h-5" fill="currentColor" />
            </div>
            <span className="font-bold text-white text-lg">Sandip Electricals</span>
          </div>
          <p className="text-sm text-slate-400">
            Your trusted electricals partner for lighting, fans, wires, and appliances across Ahmedabad.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-amber-400">Home</Link></li>
            <li><Link to="/cart" className="hover:text-amber-400">Cart</Link></li>
            <li><Link to="/orders" className="hover:text-amber-400">My Orders</Link></li>
            <li><Link to="/auth" className="hover:text-amber-400">Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3">Categories</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/category/fans" className="hover:text-amber-400">Fans</Link></li>
            <li><Link to="/category/bulbs-tubes" className="hover:text-amber-400">Bulbs & Tubes</Link></li>
            <li><Link to="/category/wires-cables" className="hover:text-amber-400">Wires & Cables</Link></li>
            <li><Link to="/category/appliances" className="hover:text-amber-400">Appliances</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
              <span>{BUSINESS.address}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 shrink-0 text-amber-400" />
              <a href={`tel:${BUSINESS.mobile}`} className="hover:text-amber-400">{BUSINESS.mobile}</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0 text-amber-400" />
              <a href={`mailto:${BUSINESS.email}`} className="hover:text-amber-400 break-all">{BUSINESS.email}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Sandip Electricals. All rights reserved.
      </div>
    </footer>
  );
}
