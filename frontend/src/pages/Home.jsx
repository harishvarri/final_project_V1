import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import {
  Shield, Users, Briefcase, BarChart3,
  Brain, Globe, Activity, Lock,
  ArrowRight, Sparkles, Zap, LayoutDashboard
} from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.role === 'worker') {
      navigate('/worker-dashboard', { replace: true });
    }
  }, [user, isAuthenticated, navigate]);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="gradient-hero text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield size={40} className="text-blue-200" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">CivicDesk</h1>
          </div>
          <p className="text-lg md:text-xl text-blue-100 mb-3">
            AI-Powered Civic Issue Reporting & Resolution Platform
          </p>
          <p className="text-sm text-blue-200 mb-8">
            Bilingual • Smart Classification • Fast Resolution
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {(!isAuthenticated || user?.role === 'citizen') && (
              <Link to="/report">
                <Button variant="white" className="!px-8 !py-3.5 !text-base !rounded-2xl">
                  <Sparkles size={18} /> Report an Issue
                </Button>
              </Link>
            )}
            {isAuthenticated && (user?.role === 'officer' || user?.role === 'admin') && (
              <Link to="/dashboard">
                <Button variant="white" className="!px-8 !py-3.5 !text-base !rounded-2xl">
                  <LayoutDashboard size={18} /> Open My Dashboard
                </Button>
              </Link>
            )}
            {!isAuthenticated && (
              <Link to="/login">
                <button className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-base text-white border-2 border-white/80 hover:bg-white hover:text-emerald-800 transition-all duration-200 shadow-md">
                  Sign In <ArrowRight size={16} />
                </button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="max-w-5xl mx-auto py-16 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Zap size={16} className="text-blue-600" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">About CivicDesk</h2>
        </div>
        <p className="text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          CivicDesk is an AI-assisted platform that enables citizens to report civic issues using images.
          Complaints are automatically classified and routed to the appropriate government departments for faster resolution.
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">🔬 Built with Flask</span>
          <span className="flex items-center gap-1.5">🗄️ Supabase</span>
          <span className="flex items-center gap-1.5">🤖 AI Classification</span>
          <span className="flex items-center gap-1.5">🌐 Bilingual Support</span>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <Zap size={24} className="text-blue-600" /> How CivicDesk Works
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Users size={32} className="text-blue-600" />,
                title: 'Citizen',
                desc: 'Report civic issues like potholes, garbage, water leaks, and electricity problems using images. Our AI will automatically categorize your complaint.',
                badge: '👤',
                link: '/report',
                btnText: 'Report an Issue',
              },
              {
                icon: <Briefcase size={32} className="text-green-600" />,
                title: 'Officer',
                desc: 'View department-wise complaints, update status, and track issue resolution progress. Manage your team\'s workload efficiently.',
                badge: '👔',
                link: '/dashboard',
                btnText: 'Officer Dashboard',
              },
              {
                icon: <BarChart3 size={32} className="text-yellow-600" />,
                title: 'Administrator',
                desc: 'Monitor overall civic performance, view analytics, and track complaints across all departments. Get actionable insights.',
                badge: '🛡️',
                link: '/admin',
                btnText: 'Admin Dashboard',
              },
            ].map((item, i) => (
              <Card key={i} className="p-6 text-center group hover:scale-[1.02] transition-transform duration-300">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4 text-2xl group-hover:scale-110 transition-transform">
                  {item.badge}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{item.desc}</p>
                <Link to={item.link}>
                  <Button variant="success" className="!text-xs !px-5 !py-2.5 !rounded-xl">
                    {item.btnText}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="max-w-5xl mx-auto py-16 px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-10">
          ⭐ Key Features
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <Brain size={28} className="text-blue-600" />, title: 'AI Classification', desc: 'Automatic categorization of complaints using machine learning', bg: 'bg-blue-50' },
            { icon: <Globe size={28} className="text-green-600" />, title: 'Bilingual Support', desc: 'English & Telugu language support', bg: 'bg-green-50' },
            { icon: <Activity size={28} className="text-purple-600" />, title: 'Real-time Tracking', desc: 'Track complaint status from submission to resolution', bg: 'bg-purple-50' },
            { icon: <Lock size={28} className="text-rose-600" />, title: 'Secure & Private', desc: 'Your data is encrypted and protected', bg: 'bg-rose-50' },
          ].map((f, i) => (
            <Card key={i} className="p-6 text-center group hover:scale-[1.02] transition-transform duration-300">
              <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-1">{f.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-6 px-4 text-center text-sm">
        © 2026 CivicDesk. All rights reserved. | Smart City Initiative
      </footer>
    </div>
  );
}
