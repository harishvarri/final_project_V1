import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Shield, LayoutDashboard, FileText, BarChart3, LogIn, LogOut, Home, CheckCircle2, Briefcase, Languages } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function NavbarI18n() {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, setLanguage, l, translateRole } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/', { replace: true });
  };

  const navLinks = [{ to: '/', label: l('Home', 'హోమ్'), icon: <Home size={16} /> }];

  if (!isAuthenticated || user?.role === 'citizen') {
    navLinks.push({ to: '/report', label: l('Report Issue', 'ఫిర్యాదు నమోదు'), icon: <FileText size={16} /> });
  }

  if (isAuthenticated) {
    navLinks.push({
      to: '/reported-issues',
      label: l('Your Issues', 'మీ ఫిర్యాదులు'),
      icon: <CheckCircle2 size={16} />,
      requireAuth: true,
    });
  }

  if (isAuthenticated && user?.role === 'worker') {
    navLinks.push({
      to: '/worker-dashboard',
      label: l('My Tasks', 'నా పనులు'),
      icon: <Briefcase size={16} />,
      requireAuth: true,
    });
  }

  if (isAuthenticated && (user?.role === 'officer' || user?.role === 'admin')) {
    navLinks.push({ to: '/dashboard', label: l('Dashboard', 'డ్యాష్‌బోర్డ్'), icon: <LayoutDashboard size={16} /> });
  }

  if (isAuthenticated && user?.role === 'admin') {
    navLinks.push(
      { to: '/issues', label: l('All Issues', 'అన్ని సమస్యలు'), icon: <FileText size={16} /> },
      { to: '/admin', label: l('Analytics', 'విశ్లేషణలు'), icon: <BarChart3 size={16} /> },
    );
  }

  const filteredNavLinks = navLinks.filter((link) => !link.requireAuth || isAuthenticated);

  return (
    <nav className="gradient-blue shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
            <Shield size={24} className="text-blue-200" />
            CivicDesk
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {filteredNavLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.to ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1">
              <Languages size={14} className="text-blue-100 ml-2" />
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${language === 'en' ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-white/10'}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('te')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${language === 'te' ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-white/10'}`}
              >
                తెలుగు
              </button>
            </div>

            {isAuthenticated ? (
              <>
                <span className="text-blue-100 text-sm">
                  {user?.email} <span className="text-xs opacity-70">({translateRole(user?.role)})</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <LogOut size={14} /> {l('Logout', 'లాగౌట్')}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1 bg-white text-blue-700 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
              >
                <LogIn size={14} /> {l('Login', 'లాగిన్')}
              </Link>
            )}
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileOpen((value) => !value)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-blue-800 border-t border-blue-600 animate-slide-down">
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-white/10 p-2">
              <span className="text-xs font-semibold text-blue-100">{l('Language', 'భాష')}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${language === 'en' ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-white/10'}`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('te')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${language === 'te' ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-white/10'}`}
                >
                  తెలుగు
                </button>
              </div>
            </div>

            {filteredNavLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === link.to ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <div className="border-t border-blue-600 my-2 pt-2">
                <span className="block text-xs text-blue-200 px-3 py-1">
                  {user?.email} ({translateRole(user?.role)})
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-200 hover:bg-red-600/20 transition-colors"
                >
                  <LogOut size={14} /> {l('Logout', 'లాగౌట్')}
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-white/10 hover:bg-white/20 transition-colors"
              >
                <LogIn size={14} /> {l('Login', 'లాగిన్')}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
