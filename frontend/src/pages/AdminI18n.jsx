import { useEffect, useState } from 'react';
import { AlertCircle, BarChart3, CheckCircle2, Clock, Mail, MapPin, Pencil, Plus, RefreshCw, TrendingUp, Users, Volume2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { assignUserRole, fetchAnalytics, fetchComplaints, getAllUsers, updateComplaint } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import Button from '../components/Button';
import ComplaintThumbnail from '../components/ComplaintThumbnail';
import { formatCoordinates } from '../utils/location';
import { resolveMediaUrl } from '../utils/media';

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
const REROUTEABLE_STATUSES = ['submitted', 'reopened', 'in_review'];

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
  const [editingUserEmail, setEditingUserEmail] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [rerouteDept, setRerouteDept] = useState(DEPARTMENTS[0]);

  const normalizeDepartmentOption = (department) =>
    DEPARTMENTS.find((entry) => department?.includes(entry)) || DEPARTMENTS[0];

  const resetUserForm = () => {
    setAssignEmail('');
    setAssignRole('officer');
    setAssignDept('');
    setEditingUserEmail(null);
  };

  const startEditingUser = (entry) => {
    setEditingUserEmail(entry.email);
    setAssignEmail(entry.email || '');
    setAssignRole(entry.role || 'citizen');
    setAssignDept(entry.department || '');
    setActiveTab('users');
  };

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

  useEffect(() => {
    if (!selectedComplaint) return;
    setRerouteDept(normalizeDepartmentOption(selectedComplaint.department));
  }, [selectedComplaint]);

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

  const handleSaveUserRole = async (event) => {
    event.preventDefault();
    if (!assignEmail) {
      toast.error(l('Please enter an email', 'Please enter an email'));
      return;
    }

    setAssigning(true);
    try {
      const nextDepartment = ['officer', 'worker'].includes(assignRole) ? (assignDept || null) : null;
      await assignUserRole(assignEmail, assignRole, nextDepartment, user?.email, user?.role);
      toast.success(
        editingUserEmail
          ? l(`${assignEmail} updated as ${translateRole(assignRole)}`, `${assignEmail} updated as ${translateRole(assignRole)}`)
          : l(`${assignEmail} assigned as ${translateRole(assignRole)}`, `${assignEmail} assigned as ${translateRole(assignRole)}`)
      );
      resetUserForm();
      loadData({ silent: true });
    } catch (reason) {
      const details = reason.response?.data?.details;
      const message = reason.response?.data?.error || l('Failed to assign role', 'Failed to assign role');
      toast.error(details ? `${message}: ${details}` : message);
    } finally {
      setAssigning(false);
    }
  };

  const handleRerouteComplaint = async () => {
    if (!selectedComplaint || !rerouteDept) return;
    if (rerouteDept === normalizeDepartmentOption(selectedComplaint.department)) {
      toast.error(l('Choose a different department to reroute this complaint.', 'ఈ ఫిర్యాదును మళ్లించడానికి వేరే శాఖను ఎంచుకోండి.'));
      return;
    }

    try {
      await updateComplaint(
        selectedComplaint.id,
        {
          department: rerouteDept,
          status: 'submitted',
          worker_id: null,
        },
        user?.email,
        user?.role,
      );
      toast.success(l(`Complaint forwarded to ${translateDepartment(rerouteDept)}.`, `${translateDepartment(rerouteDept)} శాఖకు ఫిర్యాదు మళ్లించబడింది.`));
      setSelectedComplaint(null);
      loadData({ silent: true });
    } catch {
      toast.error(l('Failed to forward complaint to the selected department.', 'ఎంచుకున్న శాఖకు ఫిర్యాదును మళ్లించలేకపోయాం.'));
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
                      <tr
                        key={complaint.id}
                        className={`cursor-pointer hover:bg-gray-50 ${resolveMediaUrl(complaint.citizen_voice_url) ? 'bg-blue-50/30' : ''}`}
                        onClick={() => setSelectedComplaint(complaint)}
                      >
                        <td className="px-4 py-3"><span className="text-xs text-gray-600 break-all">{complaint.user_email}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="capitalize text-gray-700">{translateCategory(complaint.category)}</span>
                            <div className="flex flex-wrap gap-2">
                              {resolveMediaUrl(complaint.citizen_voice_url) && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                                  <Volume2 size={12} /> {l('Citizen Voice', 'Citizen Voice')}
                                </span>
                              )}
                              {resolveMediaUrl(complaint.worker_voice_url) && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                                  <Volume2 size={12} /> {l('Worker Voice', 'Worker Voice')}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
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
              {editingUserEmail && (
                <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  {l('Updating role and department for', 'Updating role and department for')} <span className="font-semibold">{editingUserEmail}</span>
                </div>
              )}
              <form onSubmit={handleSaveUserRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{l('Email', 'ఇమెయిల్')}</label>
                  <input type="email" value={assignEmail} onChange={(event) => setAssignEmail(event.target.value)} disabled={Boolean(editingUserEmail)} placeholder="user@example.com" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:bg-gray-100 disabled:text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{l('Role', 'పాత్ర')}</label>
                  <select value={assignRole} onChange={(event) => {
                    const nextRole = event.target.value;
                    setAssignRole(nextRole);
                    if (!['officer', 'worker'].includes(nextRole)) {
                      setAssignDept('');
                    }
                  }} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                    <option value="citizen">{translateRole('citizen')}</option>
                    <option value="officer">{translateRole('officer')}</option>
                    <option value="worker">{translateRole('worker')}</option>
                    <option value="admin">{translateRole('admin')}</option>
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
                {editingUserEmail && (
                  <Button type="button" variant="outline" onClick={resetUserForm} className="w-full">
                    {l('Cancel Editing', 'Cancel Editing')}
                  </Button>
                )}
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
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-gray-600 text-xs">{entry.department ? translateDepartment(entry.department) : '-'}</span>
                                <Button type="button" variant="outline" onClick={() => startEditingUser(entry)} className="!px-3 !py-2 !text-xs">
                                  <Pencil size={14} /> {l('Edit', 'Edit')}
                                </Button>
                              </div>
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

      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{translateCategory(selectedComplaint.category)}</h3>
                <p className="text-xs text-gray-500">{l('Complaint ID', 'Complaint ID')}: {selectedComplaint.id?.substring(0, 8)}</p>
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-73px)] overflow-y-auto p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase text-gray-500">{l('Citizen Report', 'Citizen Report')}</p>
                  <ComplaintThumbnail
                    src={selectedComplaint.image_url}
                    alt={translateCategory(selectedComplaint.category)}
                    className="mb-3 h-56 w-full rounded-xl border border-gray-100 object-cover shadow-sm"
                    emptyLabel={l('No image available', 'No image available')}
                    openInNewTab
                  />
                  {resolveMediaUrl(selectedComplaint.citizen_voice_url) ? (
                    <>
                      <p className="mb-2 text-xs font-semibold uppercase text-blue-700">{l('Citizen Voice Note', 'Citizen Voice Note')}</p>
                      <audio src={resolveMediaUrl(selectedComplaint.citizen_voice_url)} controls className="h-10 w-full outline-none" preload="none" />
                    </>
                  ) : (
                    <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-500">{l('No citizen voice note attached.', 'No citizen voice note attached.')}</p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase text-emerald-600">{l('Work Proof', 'Work Proof')}</p>
                  <ComplaintThumbnail
                    src={selectedComplaint.proof_url}
                    alt={l('Proof of work', 'Proof of work')}
                    className="mb-3 h-56 w-full rounded-xl border border-emerald-200 object-cover shadow-sm"
                    emptyLabel={l('No proof image uploaded yet', 'No proof image uploaded yet')}
                    openInNewTab
                  />
                  {resolveMediaUrl(selectedComplaint.worker_voice_url) ? (
                    <>
                      <p className="mb-2 text-xs font-semibold uppercase text-emerald-700">{l('Worker Voice Note', 'Worker Voice Note')}</p>
                      <audio src={resolveMediaUrl(selectedComplaint.worker_voice_url)} controls className="h-10 w-full outline-none" preload="none" />
                    </>
                  ) : (
                    <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-500">{l('No worker voice note uploaded yet.', 'No worker voice note uploaded yet.')}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{l('Department', 'Department')}</p>
                  <p className="text-sm text-gray-800">{translateDepartment(selectedComplaint.department)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{l('Status', 'Status')}</p>
                  <p className="text-sm text-gray-800">{translateStatus(selectedComplaint.status)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{l('Priority', 'Priority')}</p>
                  <p className="text-sm text-gray-800">{translatePriority(selectedComplaint.priority)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{l('Reported On', 'Reported On')}</p>
                  <p className="text-sm text-gray-800">{formatDate(selectedComplaint.created_at)}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{l('Location', 'Location')}</p>
                  <p className="text-sm text-blue-700">
                    <MapPin size={12} className="mr-1 inline" />
                    {selectedComplaint.location_name || formatCoordinates(selectedComplaint.latitude, selectedComplaint.longitude)}
                  </p>
                  {selectedComplaint.location_name && (
                    <p className="mt-1 text-xs text-gray-500">{formatCoordinates(selectedComplaint.latitude, selectedComplaint.longitude)}</p>
                  )}
                </div>
              </div>

              {REROUTEABLE_STATUSES.includes(selectedComplaint.status) && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700">{l('Wrong Department?', 'తప్పు శాఖా?')}</p>
                  <h4 className="mt-1 text-sm font-semibold text-gray-800">{l('Manually forward this case', 'ఈ కేసును మాన్యువల్‌గా మళ్లించండి')}</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {l('If the model classified this image incorrectly, forward it to the correct department. The complaint will return to the unassigned queue.', 'మోడల్ ఈ చిత్రాన్ని తప్పుగా వర్గీకరిస్తే, సరైన శాఖకు మళ్లించండి. ఫిర్యాదు మళ్లీ అసైన్ చేయని క్యూ లోకి వెళ్తుంది.')}
                  </p>
                  <div className="mt-4 flex flex-col gap-3 md:flex-row">
                    <select
                      value={rerouteDept}
                      onChange={(event) => setRerouteDept(event.target.value)}
                      className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300"
                    >
                      {DEPARTMENTS.map((department) => (
                        <option key={department} value={department}>
                          {translateDepartment(department)}
                        </option>
                      ))}
                    </select>
                    <Button onClick={handleRerouteComplaint} disabled={rerouteDept === normalizeDepartmentOption(selectedComplaint.department)} className="w-full bg-amber-600 hover:bg-amber-700 md:w-auto">
                      {l('Forward Case', 'కేసును మళ్లించండి')}
                    </Button>
                  </div>
                </div>
              )}

              {selectedComplaint.notes && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">{l('Officer Notes', 'Officer Notes')}</p>
                  <p className="mt-1 text-sm text-blue-900">{selectedComplaint.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
