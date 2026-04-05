import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import Button from '../components/Button';

function postLoginPath(user, from) {
  if (from && from !== '/login' && typeof from === 'string' && from.startsWith('/')) {
    return from;
  }
  if (user.role === 'admin') return '/admin';
  if (user.role === 'officer') return '/dashboard';
  if (user.role === 'worker') return '/worker-dashboard';
  return '/';
}

export default function LoginI18n() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, login, signup, loading } = useAuth();
  const { l, translateMessage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  useEffect(() => {
    if (loading || !user) return;
    navigate(postLoginPath(user, from), { replace: true });
  }, [loading, user, from, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      if (isSignup) {
        const result = await signup(email, password);
        if (result.success) {
          toast.success(translateMessage(result.message));
          setIsSignup(false);
          setEmail('');
          setPassword('');
        } else {
          toast.error(translateMessage(result.message));
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
          toast.success(l(`Welcome, ${result.user.email}!`, `స్వాగతం, ${result.user.email}!`));
        } else {
          toast.error(translateMessage(result.message));
        }
      }
    } catch {
      toast.error(l('An error occurred', 'ఒక లోపం జరిగింది'));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 text-sm">{l('Loading...', 'లోడ్ అవుతోంది...')}</div>;
  }

  if (user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 text-sm">{l('Redirecting...', 'మారుస్తోంది...')}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-gray-800">
            <Shield size={32} className="text-blue-600" />
            CivicDesk
          </div>
          <p className="text-gray-500 text-sm mt-1">{l('Sign in to your account', 'మీ ఖాతాలోకి సైన్ ఇన్ చేయండి')}</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{l('Email', 'ఇమెయిల్')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={l('Enter email', 'ఇమెయిల్ నమోదు చేయండి')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{l('Password', 'పాస్‌వర్డ్')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={l('Enter password (min 6 characters)', 'పాస్‌వర్డ్ నమోదు చేయండి (కనిష్ఠం 6 అక్షరాలు)')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full !py-3" disabled={isLoading}>
              <LogIn size={16} /> {isLoading ? l('Please wait...', 'దయచేసి వేచి ఉండండి...') : isSignup ? l('Sign Up', 'సైన్ అప్') : l('Sign In', 'సైన్ ఇన్')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button type="button" onClick={() => setIsSignup((value) => !value)} className="text-sm text-blue-600 hover:underline">
              {isSignup ? l('Already have an account? Sign In', 'ఇప్పటికే ఖాతా ఉందా? సైన్ ఇన్ చేయండి') : l("Don't have an account? Sign Up", 'ఖాతా లేదా? సైన్ అప్ చేయండి')}
            </button>
          </div>
        </Card>

        <p className="text-center text-sm text-gray-400 mt-6">
          <Link to="/" className="text-blue-600 hover:underline">
            {l('← Back to Home', '← హోమ్‌కు తిరుగు')}
          </Link>
        </p>
      </div>
    </div>
  );
}
