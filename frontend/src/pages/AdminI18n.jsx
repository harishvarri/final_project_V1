import { useEffect, useState } from 'react';
import { AlertCircle, BarChart3, CheckCircle2, Clock, Mail, Plus, RefreshCw, TrendingUp, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { assignUserRole, fetchAnalytics, fetchComplaints, getAllUsers } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import Button from '../components/Button';

const GRADIENT_CLASSES = ['gradient-card-1', 'gradient-card-2', 'gradient-card-3'];
const DEPARTMENTS = [
  'Road Department',
  'Sanitation Department',
  'Drainage Department',
  'Electrical Department',
  'Water Supply Department',
  'Infrastructure Department',
  'Urban Planning Department',
];

export default function AdminI18n() {
  const { user } = useAuth();
  const { l, translateCategory, translateDepartment, translatePriority, translateRole, translateStatus, formatDate } = useLanguage();
  const [analytics, setAnalytics] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [deptData, setDeptData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [assignEmail, setAssignEmail] = useState('');
  const [assignRole, setAssignRole] = useState('officer');
  const [assignDept, setAssignDept] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    loadData();
  }, [user?.email, user?.role, user?.department]);

  useEffect(() => {
    if (user?.role !== 'admin' || activeTab === 'users') return;
    const interval = setInterval(() => {
      loadData({ silent: true });
    }, 15000);
    return () => clearInterval(interval);
  }, [user?.role, user?.email, user?.department, activeTab]);

  const loadData = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const [analyticsRes, complaintsRes, usersRes] = await Promise.all([
        fetchAnalytics(),
        fetchComplaints(user?.email, user?.role, user?.department),
        getAllUsers(user?.email, user?.role),
      ]);

      setAnalytics(analyticsRes);
      setComplaints(complaintsRes || []);
      setAllUsers(usersRes || []);

      const nextDeptData = {};
      (complaintsRes || []).forEach((complaint) => {
        const department = complaint.department?.split(' (')[0] || 'Unknown';
        if (!nextDeptData[department]) nextDeptData[department] = { total: 0, resolved: 0 };
        nextDeptData[department].total += 1;
        if (complaint.status === 'closed') nextDeptData[department].resolved += 1;
      });
      setDeptData(nextDeptData);
    } catch {
      if (!silent) setError(l('Failed to load data', 'డేటాను లోడ్ చేయలేకపోయాం'));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleAssignRole = async (event) => {
    event.preventDefault();
    if (!assignEmail) {
      toast.error(l('Please enter an email', 'దయచేసి ఇమెయిల్ నమోదు చేయండి'));
      return;
    }

    setAssigning(true);
    try {
      await assignUserRole(assignEmail, assignRole, assignDept || null, user?.email, user?.role);
      toast.success(l(`${assignEmail} assigned as ${translateRole(assignRole)}`, `${assignEmail} కు ${translateRole(assignRole)} పాత్ర కేటాయించబడింది`));
      setAssignEmail('');
      setAssignRole('officer');
      setAssignDept('');
      loadData({ silent: true });
    } catch (reason) {
      const message = reason.response?.data?.error || l('Failed to assign role', 'పాత్ర కేటాయించలేకపోయాం');
      toast.error(message);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{l('Loading data...', 'డేటా లోడ్ అవుతోంది...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-12 text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-3" />
          <p className="text-red-500 font-medium">{error}</p>
        </Card>
      </div>
    );
  }

  const maxDeptCount = Math.max(...Object.values(deptData).map((entry) => entry.total), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="gradient-blue text-white py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 size={22} /> {l('Admin Dashboard', 'అడ్మిన్ డ్యాష్‌బోర్డ్')}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-blue-100 text-sm">{user?.email} ({translateRole(user?.role)})</span>
            <Button variant="outline" className="!border-white !text-white hover:!bg-white/10 !text-xs" onClick={() => loadData()}>
              <RefreshCw size={14} /> {l('Refresh', 'రిఫ్రెష్')}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {[
            { key: 'dashboard', label: l('Dashboard', 'డ్యాష్‌బోర్డ్') },
            { key: 'complaints', label: l('Complaints', 'ఫిర్యాదులు') },
            { key: 'users', label: l('Manage Users', 'వినియోగదారుల నిర్వహణ') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 font-medium transition ${activeTab === tab.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">{l('System Overview', 'సిస్టమ్ అవలోకనం')}</h2>
            <div className="grid sm:grid-cols-3 gap-5 mb-10">
              {[
                { label: l('Total Complaints', 'మొత్తం ఫిర్యాదులు'), value: analytics?.total ?? 0, icon: <TrendingUp size={20} />, gradient: GRADIENT_CLASSES[0] },
                { label: l('Resolved', 'పరిష్కరించబడినవి'), value: analytics?.resolved ?? 0, icon: <CheckCircle2 size={20} />, gradient: GRADIENT_CLASSES[1] },
                { label: l('Pending', 'పెండింగ్'), value: analytics?.pending ?? 0, icon: <Clock size={20} />, gradient: GRADIENT_CLASSES[2] },
              ].map((stat) => (
                <div key={stat.label} className={`${stat.gradient} rounded-2xl p-6 text-white shadow-lg`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm opacity-90">{stat.label}</p>
                    {stat.icon}
                  </div>
                  <p className="text-4xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {analytics?.categories && Object.keys(analytics.categories).length > 0 && (
              <Card className="p-6 mb-8" hover={false}>
                <h3 className="text-lg font-bold text-gray-800 mb-5">{l('Category Distribution', 'వర్గాల పంపిణీ')}</h3>
                <div className="space-y-4">
                  {Object.entries(analytics.categories)
                    .sort((left, right) => right[1] - left[1])
                    .map(([category, count]) => {
                      const maxCategory = Math.max(...Object.values(analytics.categories));
                      const percent = maxCategory > 0 ? (count / maxCategory) * 100 : 0;
                      return (
                        <div key={category} className="flex items-center gap-4">
                          <span className="w-32 text-sm font-medium capitalize text-gray-700">{translateCategory(category)}</span>
                          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full gradient-blue rounded-full transition-all duration-1000" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="w-10 text-sm font-bold text-gray-700 text-right">{count}</span>
                        </div>
                      );
                    })}
                </div>
              </Card>
            )}

            {Object.keys(deptData).length > 0 && (
              <Card className="p-6" hover={false}>
                <h3 className="text-lg font-bold text-gray-800 mb-5">{l('Complaints by Department', 'శాఖల వారీ ఫిర్యాదులు')}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">{l('Department', 'శాఖ')}</th>
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">{l('Complaints', 'ఫిర్యాదులు')}</th>
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">{l('Progress', 'పురోగతి')}</th>
                        <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">{l('Resolution %', 'పరిష్కార శాతం')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {Object.entries(deptData).map(([department, entry]) => {
                        const resolution = entry.total > 0 ? ((entry.resolved / entry.total) * 100).toFixed(1) : '0.0';
                        const width = (entry.total / maxDeptCount) * 100;
                        return (
                          <tr key={department} className="hover:bg-gray-50/50">
                            <td className="py-3 text-sm font-medium text-gray-700">{translateDepartment(department)}</td>
                            <td className="py-3 text-sm font-bold text-gray-800">{entry.total}</td>
                            <td className="py-3">
                              <div className="w-32 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full gradient-blue rounded-full" style={{ width: `${width}%` }} />
                              </div>
                            </td>
                            <td className="py-3 text-sm font-semibold text-right text-gray-700">{resolution}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        {activeTab === 'complaints' && (
          <Card className="p-6" hover={false}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">{l('All Submitted Complaints', 'అన్ని సమర్పించిన ఫిర్యాదులు')}</h3>
            {complaints.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{l('No complaints submitted yet', 'ఇప్పటివరకు ఫిర్యాదులు లేవు')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">{l('User', 'వినియోగదారు')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">{l('Category', 'వర్గం')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">{l('Department', 'శాఖ')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">{l('Priority', 'ప్రాధాన్యత')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">{l('Status', 'స్థితి')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">{l('Date', 'తేదీ')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {complaints.map((complaint) => (
                      <tr key={complaint.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><span className="text-xs text-gray-600 break-all">{complaint.user_email}</span></td>
                        <td className="px-4 py-3"><span className="capitalize text-gray-700">{translateCategory(complaint.category)}</span></td>
                        <td className="px-4 py-3"><span className="text-gray-700 text-xs">{translateDepartment(complaint.department)}</span></td>
                        <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{translatePriority(complaint.priority)}</span></td>
                        <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-semibold capitalize bg-gray-100 text-gray-700">{translateStatus(complaint.status)}</span></td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(complaint.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'users' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="p-6 h-fit" hover={false}>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Plus size={20} /> {l('Assign Role', 'పాత్ర కేటాయించండి')}
              </h3>
              <form onSubmit={handleAssignRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{l('Email', 'ఇమెయిల్')}</label>
                  <input type="email" value={assignEmail} onChange={(event) => setAssignEmail(event.target.value)} placeholder="user@example.com" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{l('Role', 'పాత్ర')}</label>
                  <select value={assignRole} onChange={(event) => setAssignRole(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                    <option value="citizen">{translateRole('citizen')}</option>
                    <option value="officer">{translateRole('officer')}</option>
                    <option value="worker">{translateRole('worker')}</option>
                  </select>
                </div>
                {(assignRole === 'officer' || assignRole === 'worker') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{l('Department (Optional)', 'శాఖ (ఐచ్ఛికం)')}</label>
                    <select value={assignDept} onChange={(event) => setAssignDept(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                      <option value="">{l('Select Department', 'శాఖను ఎంచుకోండి')}</option>
                      {DEPARTMENTS.map((department) => (
                        <option key={department} value={department}>
                          {translateDepartment(department)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <Button type="submit" disabled={assigning} className="w-full">
                  {assigning ? l('Assigning...', 'కేటాయిస్తోంది...') : l('Assign Role', 'పాత్ర కేటాయించండి')}
                </Button>
              </form>
            </Card>

            <div className="lg:col-span-2">
              <Card className="p-6" hover={false}>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users size={20} /> {l(`All Users (${allUsers.length})`, `అన్ని వినియోగదారులు (${allUsers.length})`)}
                </h3>
                {allUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">{l('No users yet', 'ఇంకా వినియోగదారులు లేరు')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">{l('Email', 'ఇమెయిల్')}</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">{l('Role', 'పాత్ర')}</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">{l('Department', 'శాఖ')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {allUsers.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <span className="text-gray-700 text-xs break-all flex items-center gap-2">
                                <Mail size={14} /> {entry.email}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 rounded-full text-xs font-semibold capitalize bg-gray-100 text-gray-700">{translateRole(entry.role)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-gray-600 text-xs">{entry.department ? translateDepartment(entry.department) : '-'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
