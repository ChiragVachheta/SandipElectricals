import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500 text-white">
        <Zap className="w-5 h-5" fill="currentColor" />
      </div>
      <div className="leading-tight">
        <div className={`font-bold text-base tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>
          Sandip Electricals
        </div>
        <div className={`text-[10px] uppercase tracking-widest ${light ? 'text-amber-200' : 'text-amber-600'}`}>
          Lighting & Electricals
        </div>
      </div>
    </Link>
  );
}
