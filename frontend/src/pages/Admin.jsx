import { useState, useEffect } from 'react';
import ComplaintThumbnail from '../components/ComplaintThumbnail';
import Card from '../components/Card';
import Button from '../components/Button';
import { fetchAnalytics, fetchComplaints, getAllUsers, assignUserRole, updateComplaint } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BarChart3, RefreshCw, AlertCircle, TrendingUp, CheckCircle2, Clock, Users, Mail, Pencil, Plus, MapPin, Volume2, X } from 'lucide-react';
import { resolveMediaUrl } from '../utils/media';

const GRADIENT_CLASSES = ['gradient-card-1', 'gradient-card-2', 'gradient-card-3'];
const DEPARTMENTS = [
  'Road Department',
  'Sanitation Department',
  'Drainage Department',
  'Electrical Department',
  'Water Supply Department',
  'Infrastructure Department',
  'Urban Planning Department'
];
const REROUTEABLE_STATUSES = ['submitted', 'reopened', 'in_review'];

export default function Admin() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [deptData, setDeptData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, complaints, users
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [rerouteDept, setRerouteDept] = useState(DEPARTMENTS[0]);
  const [rerouting, setRerouting] = useState(false);
  
  // Role management form state
  const [assignEmail, setAssignEmail] = useState('');
  const [assignRole, setAssignRole] = useState('officer');
  const [assignDept, setAssignDept] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [editingUserEmail, setEditingUserEmail] = useState(null);

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
    if (user?.role !== 'admin') return;
    if (activeTab === 'users') return;
    const interval = setInterval(() => {
      loadData({ silent: true });
    }, 15000); // refresh every 15 seconds so new reports show up quickly
    return () => clearInterval(interval);
  }, [user?.role, user?.email, user?.department, activeTab]);

  useEffect(() => {
    if (!selectedComplaint) return;
    setRerouteDept(normalizeDepartmentOption(selectedComplaint.department));
    setRerouting(false);
  }, [selectedComplaint]);

  const loadData = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    } else {
      setRefreshing(true);
    }
    try {
      const [analyticsRes, complaintsRes, usersRes] = await Promise.all([
        fetchAnalytics(), 
        fetchComplaints(user?.email, user?.role, user?.department),
        getAllUsers(user?.email, user?.role)
      ]);
      
      setAnalytics(analyticsRes);
      setComplaints(complaintsRes || []);
      setAllUsers(usersRes || []);

      // Build department stats
      const depts = {};
      (complaintsRes || []).forEach((c) => {
        const dept = c.department?.split(' (')[0] || 'Unknown';
        if (!depts[dept]) depts[dept] = { total: 0, resolved: 0 };
        depts[dept].total++;
        if (c.status === 'resolved') depts[dept].resolved++;
      });
      setDeptData(depts);
    } catch (err) {
      console.error(err);
      if (!silent) setError('Failed to load data');
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!assignEmail) {
      toast.error('Please enter an email');
      return;
    }

    setAssigning(true);
    try {
      const nextDepartment = ['officer', 'worker'].includes(assignRole) ? (assignDept || null) : null;
      await assignUserRole(assignEmail, assignRole, nextDepartment, user?.email, user?.role);
      toast.success(editingUserEmail ? `${assignEmail} updated as ${assignRole}` : `${assignEmail} assigned as ${assignRole}`);
      resetUserForm();
      loadData({ silent: true }); // Refresh users without interrupting the form
    } catch (err) {
      const details = err.response?.data?.details;
      const message = err.response?.data?.error || 'Failed to assign role';
      toast.error(details ? `${message}: ${details}` : message);
    } finally {
      setAssigning(false);
    }
  };

  const handleRerouteComplaint = async () => {
    if (!selectedComplaint || !rerouteDept) return;
    if (rerouteDept === normalizeDepartmentOption(selectedComplaint.department)) {
      toast.error('Choose a different department to reroute this complaint.');
      return;
    }

    setRerouting(true);
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
      toast.success(`Complaint forwarded to ${rerouteDept}.`);
      setSelectedComplaint(null);
      loadData({ silent: true });
    } catch {
      toast.error('Failed to forward complaint to the selected department.');
    } finally {
      setRerouting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading data...</p>
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

  const maxDeptCount = Math.max(...Object.values(deptData).map((d) => d.total), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="gradient-blue text-white py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 size={22} /> Admin Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-blue-100 text-sm">👤 {user?.name || user?.email} ({user?.role})</span>
            <Button variant="outline" className="!border-white !text-white hover:!bg-white/10 !text-xs" onClick={loadData}>
              <RefreshCw size={14} /> Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'dashboard'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'complaints'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 Complaints
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👥 Manage Users
          </button>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <>
            {/* System Overview */}
            <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">System Overview</h2>
            <div className="grid sm:grid-cols-3 gap-5 mb-10">
              {[
                { label: 'Total Complaints', value: analytics?.total ?? 0, icon: <TrendingUp size={20} />, gradient: GRADIENT_CLASSES[0] },
                { label: 'Resolved', value: analytics?.resolved ?? 0, icon: <CheckCircle2 size={20} />, gradient: GRADIENT_CLASSES[1] },
                { label: 'Pending', value: analytics?.pending ?? 0, icon: <Clock size={20} />, gradient: GRADIENT_CLASSES[2] },
              ].map((stat, i) => (
                <div key={i} className={`${stat.gradient} rounded-2xl p-6 text-white shadow-lg`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm opacity-90">{stat.label}</p>
                    {stat.icon}
                  </div>
                  <p className="text-4xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Category Distribution */}
            {analytics?.categories && Object.keys(analytics.categories).length > 0 && (
              <Card className="p-6 mb-8" hover={false}>
                <h3 className="text-lg font-bold text-gray-800 mb-5">Category Distribution</h3>
                <div className="space-y-4">
                  {Object.entries(analytics.categories)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => {
                      const maxCat = Math.max(...Object.values(analytics.categories));
                      const pct = maxCat > 0 ? (count / maxCat) * 100 : 0;
                      return (
                        <div key={cat} className="flex items-center gap-4">
                          <span className="w-32 text-sm font-medium capitalize text-gray-700">{cat.replace('_', ' ')}</span>
                          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full gradient-blue rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-10 text-sm font-bold text-gray-700 text-right">{count}</span>
                        </div>
                      );
                    })}
                </div>
              </Card>
            )}

            {/* Department Performance */}
            {Object.keys(deptData).length > 0 && (
              <Card className="p-6" hover={false}>
                <h3 className="text-lg font-bold text-gray-800 mb-5">Complaints by Department</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Department</th>
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Complaints</th>
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Progress</th>
                        <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Resolution %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {Object.entries(deptData).map(([dept, data]) => {
                        const resPct = data.total > 0 ? ((data.resolved / data.total) * 100).toFixed(1) : '0.0';
                        const barPct = (data.total / maxDeptCount) * 100;
                        return (
                          <tr key={dept} className="hover:bg-gray-50/50">
                            <td className="py-3 text-sm font-medium text-gray-700">{dept}</td>
                            <td className="py-3 text-sm font-bold text-gray-800">{data.total}</td>
                            <td className="py-3">
                              <div className="w-32 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full gradient-blue rounded-full" style={{ width: `${barPct}%` }} />
                              </div>
                            </td>
                            <td className="py-3 text-sm font-semibold text-right text-gray-700">{resPct}%</td>
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

        {/* COMPLAINTS TAB */}
        {activeTab === 'complaints' && (
          <Card className="p-6" hover={false}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">All Submitted Complaints</h3>
            {complaints.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No complaints submitted yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">User</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Category</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Department</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Priority</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {complaints.map((complaint) => (
                      <tr key={complaint.id} className={`cursor-pointer hover:bg-gray-50 ${resolveMediaUrl(complaint.citizen_voice_url) ? 'bg-blue-50/30' : ''}`} onClick={() => setSelectedComplaint(complaint)}>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-600 break-all">{complaint.user_email}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="capitalize text-gray-700">{complaint.category?.replace('_', ' ')}</span>
                            <div className="flex flex-wrap gap-2">
                              {resolveMediaUrl(complaint.citizen_voice_url) && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                                  <Volume2 size={12} /> Citizen Voice
                                </span>
                              )}
                              {resolveMediaUrl(complaint.worker_voice_url) && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                                  <Volume2 size={12} /> Worker Voice
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-700 text-xs">{complaint.department}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            complaint.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                            complaint.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {complaint.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                            complaint.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {complaint.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Assign Role Form */}
            <Card className="p-6 h-fit" hover={false}>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Plus size={20} /> {editingUserEmail ? 'Edit User' : 'Assign Role'}
              </h3>
              {editingUserEmail && (
                <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  Updating role and department for <span className="font-semibold">{editingUserEmail}</span>
                </div>
              )}
              <form onSubmit={handleAssignRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={assignEmail}
                    onChange={(e) => setAssignEmail(e.target.value)}
                    disabled={Boolean(editingUserEmail)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                  <select
                    value={assignRole}
                    onChange={(e) => {
                      const nextRole = e.target.value;
                      setAssignRole(nextRole);
                      if (!['officer', 'worker'].includes(nextRole)) {
                        setAssignDept('');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="citizen">Citizen</option>
                    <option value="officer">Officer</option>
                    <option value="worker">Worker</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {(assignRole === 'officer' || assignRole === 'worker') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Department (Optional)</label>
                    <select
                      value={assignDept}
                      onChange={(e) => setAssignDept(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={assigning}
                  className="w-full"
                >
                  {assigning ? 'Saving...' : editingUserEmail ? 'Save Changes' : 'Assign Role'}
                </Button>
                {editingUserEmail && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetUserForm}
                    className="w-full"
                  >
                    Cancel Editing
                  </Button>
                )}
              </form>
            </Card>

            {/* Users List */}
            <div className="lg:col-span-2">
              <Card className="p-6" hover={false}>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users size={20} /> All Users ({allUsers.length})
                </h3>
                {allUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No users yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Role</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Department</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {allUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <span className="text-gray-700 text-xs break-all flex items-center gap-2">
                                <Mail size={14} /> {u.email}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                                u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                u.role === 'officer' ? 'bg-blue-100 text-blue-700' :
                                u.role === 'worker' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-gray-600 text-xs">{u.department || '-'}</span>
                                <Button type="button" variant="outline" onClick={() => startEditingUser(u)} className="!px-3 !py-2 !text-xs">
                                  <Pencil size={14} /> Edit
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
                <h3 className="text-lg font-bold text-gray-800 capitalize">{selectedComplaint.category?.replace('_', ' ')}</h3>
                <p className="text-xs text-gray-500">Complaint ID: {selectedComplaint.id?.substring(0, 8)}</p>
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-73px)] overflow-y-auto p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase text-gray-500">Citizen Report</p>
                  <ComplaintThumbnail
                    src={selectedComplaint.image_url}
                    alt={selectedComplaint.category?.replace('_', ' ') || 'Complaint'}
                    className="mb-3 h-56 w-full rounded-xl border border-gray-100 object-cover shadow-sm"
                    emptyLabel="No image available"
                    openInNewTab
                  />
                  {resolveMediaUrl(selectedComplaint.citizen_voice_url) ? (
                    <>
                      <p className="mb-2 text-xs font-semibold uppercase text-blue-700">Citizen Voice Note</p>
                      <audio src={resolveMediaUrl(selectedComplaint.citizen_voice_url)} controls className="h-10 w-full outline-none" preload="none" />
                    </>
                  ) : (
                    <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-500">No citizen voice note attached.</p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase text-emerald-600">Work Proof</p>
                  <ComplaintThumbnail
                    src={selectedComplaint.proof_url}
                    alt="Proof of work"
                    className="mb-3 h-56 w-full rounded-xl border border-emerald-200 object-cover shadow-sm"
                    emptyLabel="No proof image uploaded yet"
                    openInNewTab
                  />
                  {resolveMediaUrl(selectedComplaint.worker_voice_url) ? (
                    <>
                      <p className="mb-2 text-xs font-semibold uppercase text-emerald-700">Worker Voice Note</p>
                      <audio src={resolveMediaUrl(selectedComplaint.worker_voice_url)} controls className="h-10 w-full outline-none" preload="none" />
                    </>
                  ) : (
                    <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-500">No worker voice note uploaded yet.</p>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Department</p>
                  <p className="text-sm text-gray-800">{selectedComplaint.department}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Status</p>
                  <p className="text-sm text-gray-800 capitalize">{selectedComplaint.status?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Priority</p>
                  <p className="text-sm text-gray-800">{selectedComplaint.priority}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Reported On</p>
                  <p className="text-sm text-gray-800">{selectedComplaint.created_at ? new Date(selectedComplaint.created_at).toLocaleString() : '--'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Location</p>
                  <p className="text-sm text-blue-700">
                    <MapPin size={12} className="mr-1 inline" />
                    {selectedComplaint.location_name || `${selectedComplaint.latitude?.toFixed?.(4) ?? '--'}, ${selectedComplaint.longitude?.toFixed?.(4) ?? '--'}`}
                  </p>
                  {selectedComplaint.location_name && (
                    <p className="mt-1 text-xs text-gray-500">
                      {selectedComplaint.latitude?.toFixed?.(4) ?? '--'}, {selectedComplaint.longitude?.toFixed?.(4) ?? '--'}
                    </p>
                  )}
                </div>
              </div>

              {REROUTEABLE_STATUSES.includes(selectedComplaint.status) && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Wrong Department?</p>
                  <h4 className="mt-1 text-sm font-semibold text-gray-800">Manually forward this case</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    If the AI classified this image incorrectly, forward it to the correct department. The complaint will return to the unassigned queue.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 md:flex-row">
                    <select
                      value={rerouteDept}
                      onChange={(e) => setRerouteDept(e.target.value)}
                      className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300"
                    >
                      {DEPARTMENTS.map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={handleRerouteComplaint}
                      disabled={rerouting || rerouteDept === normalizeDepartmentOption(selectedComplaint.department)}
                      className="w-full bg-amber-600 hover:bg-amber-700 md:w-auto"
                    >
                      {rerouting ? 'Forwarding...' : 'Forward Case'}
                    </Button>
                  </div>
                </div>
              )}

              {selectedComplaint.notes && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">Officer Notes</p>
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
