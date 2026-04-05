import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Shield,
  Users,
  Briefcase,
  BarChart3,
  Brain,
  Globe,
  Activity,
  Lock,
  ArrowRight,
  Sparkles,
  Zap,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import Button from '../components/Button';

export default function HomeI18n() {
  const { user, isAuthenticated } = useAuth();
  const { l } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.role === 'worker') {
      navigate('/worker-dashboard', { replace: true });
    }
  }, [user, isAuthenticated, navigate]);

  const flows = [
    {
      title: l('Citizen', 'పౌరుడు'),
      desc: l(
        'Report civic issues like potholes, garbage, water leaks, and electricity problems using images. Our AI will automatically categorize your complaint.',
        'గోతులు, చెత్త, నీటి లీకులు, విద్యుత్ సమస్యలు వంటి పౌర సమస్యలను చిత్రాలతో నివేదించండి. మా ఏఐ మీ ఫిర్యాదును స్వయంచాలకంగా వర్గీకరిస్తుంది.',
      ),
      badge: 'Citizen',
      link: '/report',
      buttonText: l('Report an Issue', 'సమస్యను నివేదించండి'),
      icon: <Users size={32} className="text-blue-600" />,
    },
    {
      title: l('Officer', 'అధికారి'),
      desc: l(
        "View department-wise complaints, update status, and track issue resolution progress. Manage your team's workload efficiently.",
        'శాఖ వారీగా ఫిర్యాదులను చూడండి, స్థితిని నవీకరించండి, పరిష్కార పురోగతిని ట్రాక్ చేయండి. మీ బృందపు పనిభారాన్ని సమర్థంగా నిర్వహించండి.',
      ),
      badge: 'Officer',
      link: '/dashboard',
      buttonText: l('Officer Dashboard', 'అధికారి డ్యాష్‌బోర్డ్'),
      icon: <Briefcase size={32} className="text-green-600" />,
    },
    {
      title: l('Administrator', 'నిర్వాహకుడు'),
      desc: l(
        'Monitor overall civic performance, view analytics, and track complaints across all departments. Get actionable insights.',
        'మొత్తం పౌర పనితీరును పర్యవేక్షించండి, విశ్లేషణలు చూడండి, అన్ని శాఖల ఫిర్యాదులను ట్రాక్ చేయండి. చర్యలకు ఉపయోగపడే వివరాలు పొందండి.',
      ),
      badge: 'Admin',
      link: '/admin',
      buttonText: l('Admin Dashboard', 'అడ్మిన్ డ్యాష్‌బోర్డ్'),
      icon: <BarChart3 size={32} className="text-yellow-600" />,
    },
  ];

  const features = [
    {
      title: l('AI Classification', 'ఏఐ వర్గీకరణ'),
      desc: l('Automatic categorization of complaints using machine learning', 'మెషిన్ లెర్నింగ్ ద్వారా ఫిర్యాదుల స్వయంచాలక వర్గీకరణ'),
      icon: <Brain size={28} className="text-blue-600" />,
      bg: 'bg-blue-50',
    },
    {
      title: l('Bilingual Support', 'ద్విభాషా మద్దతు'),
      desc: l('English and Telugu language support', 'ఇంగ్లీష్ మరియు తెలుగు భాషా మద్దతు'),
      icon: <Globe size={28} className="text-green-600" />,
      bg: 'bg-green-50',
    },
    {
      title: l('Real-time Tracking', 'రియల్-టైమ్ ట్రాకింగ్'),
      desc: l('Track complaint status from submission to resolution', 'సమర్పణ నుండి పరిష్కారం వరకు ఫిర్యాదు స్థితిని ట్రాక్ చేయండి'),
      icon: <Activity size={28} className="text-purple-600" />,
      bg: 'bg-purple-50',
    },
    {
      title: l('Secure & Private', 'సురక్షితం & వ్యక్తిగతం'),
      desc: l('Your data is encrypted and protected', 'మీ డేటా సంకేతీకరించబడి రక్షించబడుతుంది'),
      icon: <Lock size={28} className="text-rose-600" />,
      bg: 'bg-rose-50',
    },
  ];

  return (
    <div className="animate-fade-in">
      <section className="gradient-hero text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield size={40} className="text-blue-200" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">CivicDesk</h1>
          </div>
          <p className="text-lg md:text-xl text-blue-100 mb-3">
            {l('AI-Powered Civic Issue Reporting & Resolution Platform', 'ఏఐ ఆధారిత పౌర సమస్యల నివేదిక & పరిష్కార వేదిక')}
          </p>
          <p className="text-sm text-blue-200 mb-8">
            {l('Bilingual • Smart Classification • Fast Resolution', 'ద్విభాషా • స్మార్ట్ వర్గీకరణ • వేగవంతమైన పరిష్కారం')}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {(!isAuthenticated || user?.role === 'citizen') && (
              <Link to="/report">
                <Button variant="white" className="!px-8 !py-3.5 !text-base !rounded-2xl">
                  <Sparkles size={18} /> {l('Report an Issue', 'సమస్యను నివేదించండి')}
                </Button>
              </Link>
            )}
            {isAuthenticated && (user?.role === 'officer' || user?.role === 'admin') && (
              <Link to="/dashboard">
                <Button variant="white" className="!px-8 !py-3.5 !text-base !rounded-2xl">
                  <LayoutDashboard size={18} /> {l('Open My Dashboard', 'నా డ్యాష్‌బోర్డ్ తెరువు')}
                </Button>
              </Link>
            )}
            {!isAuthenticated && (
              <Link to="/login">
                <button className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-base text-white border-2 border-white/80 hover:bg-white hover:text-emerald-800 transition-all duration-200 shadow-md">
                  {l('Sign In', 'సైన్ ఇన్')} <ArrowRight size={16} />
                </button>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto py-16 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Zap size={16} className="text-blue-600" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{l('About CivicDesk', 'CivicDesk గురించి')}</h2>
        </div>
        <p className="text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          {l(
            'CivicDesk is an AI-assisted platform that enables citizens to report civic issues using images. Complaints are automatically classified and routed to the appropriate government departments for faster resolution.',
            'CivicDesk అనేది పౌరులు చిత్రాల ద్వారా పట్టణ సమస్యలను నమోదు చేయడానికి సహాయపడే ఏఐ ఆధారిత వేదిక. ఫిర్యాదులు స్వయంచాలకంగా వర్గీకరించబడి, వేగంగా పరిష్కరించేందుకు సరైన ప్రభుత్వ శాఖలకు పంపబడతాయి.',
          )}
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">{l('Built with Flask', 'Flask తో నిర్మించబడింది')}</span>
          <span className="flex items-center gap-1.5">Supabase</span>
          <span className="flex items-center gap-1.5">{l('AI Classification', 'ఏఐ వర్గీకరణ')}</span>
          <span className="flex items-center gap-1.5">{l('Bilingual Support', 'ద్విభాషా మద్దతు')}</span>
        </div>
      </section>

      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <Zap size={24} className="text-blue-600" /> {l('How CivicDesk Works', 'CivicDesk ఎలా పనిచేస్తుంది')}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {flows.map((item) => (
              <Card key={item.badge} className="p-6 text-center group hover:scale-[1.02] transition-transform duration-300">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4 text-2xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{item.desc}</p>
                <Link to={item.link}>
                  <Button variant="success" className="!text-xs !px-5 !py-2.5 !rounded-xl">
                    {item.buttonText}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto py-16 px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-10">{l('Key Features', 'ప్రధాన లక్షణాలు')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="p-6 text-center group hover:scale-[1.02] transition-transform duration-300">
              <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-1">{feature.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{feature.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="bg-gray-800 text-gray-400 py-6 px-4 text-center text-sm">
        {l('© 2026 CivicDesk. All rights reserved. | Smart City Initiative', '© 2026 CivicDesk. అన్ని హక్కులు సంరక్షించబడ్డాయి. | స్మార్ట్ సిటీ కార్యక్రమం')}
      </footer>
    </div>
  );
}
