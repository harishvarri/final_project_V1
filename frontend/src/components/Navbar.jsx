import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Shield, LayoutDashboard, FileText, BarChart3, LogIn, LogOut, Home, CheckCircle2, Briefcase } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/', { replace: true }); // Changed from /login to /
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: <Home size={16} /> }
  ];

  // Report (citizens and guests)
  if (!isAuthenticated || user?.role === 'citizen') {
    navLinks.push({ to: '/report', label: 'Report Issue', icon: <FileText size={16} /> });
  }

  if (isAuthenticated) {
    navLinks.push({
      to: '/reported-issues',
      label: 'Your Issues',
      icon: <CheckCircle2 size={16} />,
      requireAuth: true,
    });
  }

  if (isAuthenticated && user?.role === 'worker') {
    navLinks.push({
      to: '/worker-dashboard',
      label: 'My Tasks',
      icon: <Briefcase size={16} />,
      requireAuth: true,
    });
  }

  // Officer/Admin dashboard links
  if (isAuthenticated && (user?.role === 'officer' || user?.role === 'admin')) {
    navLinks.push({ to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> });
  }

  if (isAuthenticated && user?.role === 'admin') {
    navLinks.push(
      { to: '/issues', label: 'All Issues', icon: <FileText size={16} /> },
      { to: '/admin', label: 'Analytics', icon: <BarChart3 size={16} /> }
    );
  }

  // Filter out routes that require auth but user isn't logged in
  const filteredNavLinks = navLinks.filter(link => 
    !link.requireAuth || isAuthenticated
  );

  return (
    <nav className="gradient-blue shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
            <Shield size={24} className="text-blue-200" />
            CivicDesk
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {filteredNavLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.to
                    ? 'bg-white/20 text-white'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-blue-100 text-sm">
                  👤 {user?.email} <span className="text-xs opacity-70">({user?.role})</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <LogOut size={14} /> Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1 bg-white text-blue-700 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
              >
                <LogIn size={14} /> Login
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-blue-800 border-t border-blue-600 animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            {filteredNavLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === link.to
                    ? 'bg-white/20 text-white'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            {isAuthenticated && <div className="border-t border-blue-600 my-2 pt-2">
              <span className="block text-xs text-blue-200 px-3 py-1">{user?.email} ({user?.role})</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-200 hover:bg-red-600/20 transition-colors"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>}
          </div>
        </div>
      )}
    </nav>
  );
}
