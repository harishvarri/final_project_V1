import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { LogIn, Shield, Mail, Lock } from 'lucide-react';

function postLoginPath(user, from) {
  if (from && from !== '/login' && typeof from === 'string' && from.startsWith('/')) {
    return from;
  }
  if (user.role === 'admin') return '/admin';
  if (user.role === 'officer') return '/dashboard';
  if (user.role === 'worker') return '/worker-dashboard';
  return '/';
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, login, signup, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  useEffect(() => {
    if (loading || !user) return;
    navigate(postLoginPath(user, from), { replace: true });
  }, [loading, user, from, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignup) {
        const result = await signup(email, password);
        if (result.success) {
          toast.success(result.message);
          setIsSignup(false);
          setEmail('');
          setPassword('');
        } else {
          toast.error(result.message);
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
          toast.success(`Welcome, ${result.user.email}!`);
        } else {
          toast.error(result.message);
        }
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 text-sm">
        Loading…
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 text-sm">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-gray-800">
            <Shield size={32} className="text-blue-600" />
            CivicDesk
          </div>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (min 6 characters)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full !py-3" disabled={isLoading}>
              <LogIn size={16} /> {isLoading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="text-sm text-blue-600 hover:underline"
            >
              {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </Card>

        <p className="text-center text-sm text-gray-400 mt-6">
          <Link to="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
