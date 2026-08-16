import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function AuthPage() {
  const { user, signInWithOtp, verifyOtp, signOut } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate(`/${redirect === 'checkout' ? 'checkout' : ''}`);
    }
  }, [user, navigate, redirect]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    const { error } = await signInWithOtp(email);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setSent(true);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    setError(null);
    const { error } = await verifyOtp(email, otp);
    setLoading(false);
    if (error) {
      setError(error);
    }
  };

  if (user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">You're logged in</h1>
        <p className="text-slate-500 mb-6">You can now place orders and track them.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/')} className="px-5 py-2.5 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600">Continue Shopping</button>
          <button onClick={signOut} className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700">Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-600 mb-3">
            <Mail className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Login or Sign Up</h1>
          <p className="text-sm text-slate-500 mt-1">We'll send a one-time code to your email</p>
        </div>

        {!sent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:bg-slate-300 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Login Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Enter the code sent to {email}</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm tracking-widest text-center text-lg"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:bg-slate-300 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><KeyRound className="w-4 h-4" /> Verify & Login</>}
            </button>
            <button type="button" onClick={() => setSent(false)} className="w-full text-sm text-slate-500 hover:text-amber-600">
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
