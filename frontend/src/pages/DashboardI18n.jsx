import { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  MapPin,
  RefreshCw,
  Send,
  ShieldCheck,
  ThumbsDown,
  UserCheck,
  Volume2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchComplaints, getAllUsers, updateComplaint } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import Button from '../components/Button';
import ComplaintThumbnail from '../components/ComplaintThumbnail';
import { resolveMediaUrl } from '../utils/media';
import { formatCoordinates } from '../utils/location';

const DEPARTMENTS = [
  'All Departments',
  'Road Department',
  'Sanitation Department',
  'Drainage Department',
  'Electrical Department',
  'Water Supply Department',
  'Infrastructure Department',
  'Urban Planning Department',
];
const REROUTEABLE_STATUSES = ['submitted', 'reopened', 'in_review'];

const STATUS_COLORS = {
  submitted: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  waiting_approval: 'bg-purple-100 text-purple-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-emerald-200 text-emerald-900',
  reopened: 'bg-red-100 text-red-700',
  in_review: 'bg-orange-100 text-orange-700',
  rejected: 'bg-red-100 text-red-700',
};

const PRIORITY_COLORS = {
  Low: 'text-emerald-600',
  Medium: 'text-amber-600',
  High: 'text-orange-600',
  Urgent: 'text-red-600',
};

export default function DashboardI18n() {
  const { user } = useAuth();
  const { l, translateCategory, translateDepartment, translatePriority, translateStatus, formatDate } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const defaultDept = user?.role === 'officer' && user?.department ? user.department : 'All Departments';
  const [selectedDept, setSelectedDept] = useState(defaultDept);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [editWorkerId, setEditWorkerId] = useState('');
  const [rerouteDept, setRerouteDept] = useState('Road Department');
  const [workers, setWorkers] = useState([]);

  const normalizeDepartmentOption = (department) =>
    DEPARTMENTS.find((entry) => entry !== 'All Departments' && department?.includes(entry)) || 'Road Department';

  const getAssignableWorkers = (department) =>
    workers.filter((worker) => {
      if (worker?.role !== 'worker' || !worker?.email) return false;
      if (user?.role === 'admin') return true;
      const targetDepartment = normalizeDepartmentOption(department || user?.department);
      return !worker.department || worker.department.includes(targetDepartment);
    });

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  useEffect(() => {
    if (!selectedIssue) return;
    setRerouteDept(normalizeDepartmentOption(selectedIssue.department));
  }, [selectedIssue]);

  useEffect(() => {
    if (!selectedIssue) return;
    const availableWorkers = getAssignableWorkers(selectedIssue.department);
    const existingWorker = availableWorkers.find((worker) => worker.email === selectedIssue.worker_id);
    setEditWorkerId(existingWorker?.email || availableWorkers[0]?.email || '');
  }, [selectedIssue?.id, selectedIssue?.worker_id, selectedIssue?.department, workers, user?.role, user?.department]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplaints(user?.email, user?.role, user?.department);
      setComplaints(Array.isArray(data) ? data : []);

      if (user?.role === 'officer' || user?.role === 'admin') {
        getAllUsers(user?.email, user?.role)
          .then((usersData) =>
            setWorkers(Array.isArray(usersData) ? usersData.filter((entry) => entry?.role === 'worker') : []),
          )
          .catch((reason) => console.error('Error fetching workers:', reason));
      }
    } catch {
      setError(l('Failed to fetch complaints', 'Failed to fetch complaints'));
    } finally {
      setLoading(false);
    }
  };

  const assignTask = async () => {
    if (!selectedIssue) return;
    if (!editWorkerId) {
      toast.error(l('Select a worker before dispatching this complaint.', 'ఈ ఫిర్యాదును పంపించే ముందు ఒక వర్కర్‌ను ఎంచుకోండి.'));
      return;
    }

    setSaving(true);
    try {
      await updateComplaint(selectedIssue.id, { status: 'assigned', worker_id: editWorkerId }, user?.email, user?.role);
      toast.success(l('Task assigned successfully!', 'Task assigned successfully!'));
      setSelectedIssue(null);
      loadData();
    } catch (reason) {
      toast.error(reason?.response?.data?.error || l('Failed to assign task', 'Failed to assign task'));
    } finally {
      setSaving(false);
    }
  };

  const approveTask = async () => {
    if (!selectedIssue) return;
    setSaving(true);
    try {
      await updateComplaint(
        selectedIssue.id,
        { status: 'resolved', notes: editNotes || l('Approved by Officer', 'Approved by Officer') },
        user?.email,
        user?.role,
      );
      toast.success(l('Task verified and closed!', 'Task verified and closed!'));
      setSelectedIssue(null);
      loadData();
    } catch {
      toast.error(l('Failed to approve task', 'Failed to approve task'));
    } finally {
      setSaving(false);
    }
  };

  const rejectTask = async () => {
    if (!selectedIssue) return;
    if (!editNotes.trim()) {
      toast.error(l('Please provide a rejection reason in the notes field.', 'Please provide a rejection reason in the notes field.'));
      return;
    }

    setSaving(true);
    try {
      await updateComplaint(
        selectedIssue.id,
        { status: 'assigned', rejection_reason: editNotes, proof_url: null },
        user?.email,
        user?.role,
      );
      toast.success(l('Task rejected and sent back for rework!', 'Task rejected and sent back for rework!'));
      setSelectedIssue(null);
      loadData();
    } catch {
      toast.error(l('Failed to reject task', 'Failed to reject task'));
    } finally {
      setSaving(false);
    }
  };

  const rerouteComplaint = async () => {
    if (!selectedIssue || !rerouteDept) return;
    if (rerouteDept === normalizeDepartmentOption(selectedIssue.department)) {
      toast.error(l('Choose a different department to reroute this complaint.', 'ఈ ఫిర్యాదును మళ్లించడానికి వేరే శాఖను ఎంచుకోండి.'));
      return;
    }

    setSaving(true);
    try {
      await updateComplaint(
        selectedIssue.id,
        {
          department: rerouteDept,
          status: 'submitted',
          worker_id: null,
        },
        user?.email,
        user?.role,
      );
      toast.success(l(`Complaint forwarded to ${translateDepartment(rerouteDept)}.`, `${translateDepartment(rerouteDept)} శాఖకు ఫిర్యాదు మళ్లించబడింది.`));
      setSelectedIssue(null);
      loadData();
    } catch {
      toast.error(l('Failed to forward complaint to the selected department.', 'ఎంచుకున్న శాఖకు ఫిర్యాదును మళ్లించలేకపోయాం.'));
    } finally {
      setSaving(false);
    }
  };

  const filtered = complaints
    .filter((complaint) => {
      const deptValue = selectedDept === 'All Departments' ? '' : selectedDept.replace(' Department', '');
      const deptMatch = selectedDept === 'All Departments' || (complaint.department && complaint.department.includes(deptValue));
      const statusMatch = statusFilter === 'all' || complaint.status === statusFilter;
      return deptMatch && statusMatch;
    })
    .sort((left, right) => {
      const priorityWeight = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
      const leftPriority = priorityWeight[left.priority] || 0;
      const rightPriority = priorityWeight[right.priority] || 0;
      const leftWait = left.status === 'waiting_approval' ? 10 : 0;
      const rightWait = right.status === 'waiting_approval' ? 10 : 0;
      if (leftWait !== rightWait) return rightWait - leftWait;
      if (rightPriority !== leftPriority) return rightPriority - leftPriority;
      return new Date(right.created_at) - new Date(left.created_at);
    });

  const stats = {
    total: filtered.length,
    pendingAction: filtered.filter((complaint) => ['submitted', 'waiting_approval', 'reopened', 'in_review', 'resolved'].includes(complaint.status)).length,
    inProgress: filtered.filter((complaint) => complaint.status === 'in_progress' || complaint.status === 'assigned').length,
    highPriority: filtered.filter((complaint) => complaint.priority === 'High' || complaint.priority === 'Urgent').length,
  };
  const selectedIssueWorkers = selectedIssue ? getAssignableWorkers(selectedIssue.department) : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="gradient-blue text-white py-6 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck size={22} /> {user?.role === 'admin' ? l('Central Dashboard', 'Central Dashboard') : l('Department Officer Dashboard', 'Department Officer Dashboard')}
            </h1>
            <p className="text-emerald-100 text-sm mt-1">{user?.department ? translateDepartment(user.department) : l('System Administrator', 'System Administrator')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {user?.role === 'admin' && (
              <select value={selectedDept} onChange={(event) => setSelectedDept(event.target.value)} className="px-3 py-2 rounded-lg text-sm text-gray-800 bg-white border-0 shadow-sm focus:ring-2 focus:ring-emerald-300 outline-none">
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {translateDepartment(department)}
                  </option>
                ))}
              </select>
            )}
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-3 py-2 rounded-lg text-sm text-gray-800 bg-white border-0 shadow-sm focus:ring-2 focus:ring-emerald-300 outline-none">
              <option value="all">{l('All Statuses', 'All Statuses')}</option>
              <option value="submitted">{l('Unassigned', 'Unassigned')}</option>
              <option value="waiting_approval">{l('Requires Approval', 'Requires Approval')}</option>
              <option value="assigned">{l('Assigned / In Progress', 'Assigned / In Progress')}</option>
              <option value="resolved">{l('Awaiting Citizen Feedback', 'Awaiting Citizen Feedback')}</option>
              <option value="in_review">{translateStatus('in_review')}</option>
              <option value="reopened">{translateStatus('reopened')}</option>
              <option value="closed">{translateStatus('closed')}</option>
            </select>
            <Button variant="outline" className="!border-emerald-300 !text-white hover:!bg-white/10 !text-xs shadow-sm bg-emerald-700/50" onClick={loadData}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {l('Refresh', 'Refresh')}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: l('Total Issues', 'Total Issues'), value: stats.total, icon: <LayoutDashboard size={20} />, border: 'border-gray-400' },
            { label: l('Requires Action', 'Requires Action'), value: stats.pendingAction, icon: <UserCheck size={20} />, border: 'border-purple-500' },
            { label: l('On Ground', 'On Ground'), value: stats.inProgress, icon: <Clock size={20} />, border: 'border-blue-500' },
            { label: l('High Priority', 'High Priority'), value: stats.highPriority, icon: <AlertTriangle size={20} />, border: 'border-red-500' },
          ].map((item) => (
            <Card key={item.label} className={`p-4 flex items-center gap-4 border-l-4 ${item.border}`}>
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">{item.icon}</div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">{item.label}</p>
                <h3 className="text-2xl font-bold text-gray-800">{item.value}</h3>
              </div>
            </Card>
          ))}
        </div>

        {loading ? (
          <Card className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">{l('Loading complaints...', 'Loading complaints...')}</p>
          </Card>
        ) : error ? (
          <Card className="p-12 text-center">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-500 font-medium">{error}</p>
          </Card>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{l('Issue', 'Issue')}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{l('Priority', 'Priority')}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{l('Assigned To', 'Assigned To')}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{l('Status', 'Status')}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{l('Date', 'Date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-gray-400">
                        {l('No active issues for your department!', 'No active issues for your department!')}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((complaint) => (
                      <tr
                        key={complaint.id}
                        onClick={() => {
                          setSelectedIssue(complaint);
                          setEditWorkerId(complaint.worker_id || workers[0]?.email || '');
                          setEditNotes('');
                        }}
                        className={`transition-colors cursor-pointer group ${complaint.status === 'waiting_approval' ? 'bg-purple-50/40 hover:bg-purple-50/80 border-l-4 border-purple-400' : 'hover:bg-emerald-50/50'}`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <ComplaintThumbnail
                              src={complaint.image_url}
                              alt={translateCategory(complaint.category)}
                              className="h-14 w-14 shrink-0 rounded-xl object-cover bg-gray-100 shadow-sm"
                              emptyLabel={l('No image available', 'No image available')}
                              openInNewTab
                            />
                            <div>
                              <p className="text-sm font-semibold capitalize text-gray-800 group-hover:text-emerald-700 transition">{translateCategory(complaint.category)}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[190px]">{l('ID', 'ID')}: {complaint.id?.substring(0, 8)}</p>
                              <div className="mt-1 flex flex-wrap gap-2">
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
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-md bg-gray-50 border ${complaint.priority === 'High' || complaint.priority === 'Urgent' ? 'border-red-200 text-red-600 bg-red-50' : PRIORITY_COLORS[complaint.priority] || 'border-gray-200 text-gray-600'}`}>
                            {translatePriority(complaint.priority)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-700 font-medium">{complaint.worker_id || l('Not Assigned', 'Not Assigned')}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[150px]">{translateDepartment(complaint.department)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${STATUS_COLORS[complaint.status] || 'bg-gray-100 text-gray-600'}`}>{translateStatus(complaint.status)}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(complaint.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200 bg-slate-50 md:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{l('Issue Action Center', 'సమస్య చర్య కేంద్రం')}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-bold text-slate-900">{translateCategory(selectedIssue.category)}</h3>
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600">{selectedIssue.id?.substring(0, 8)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {selectedIssue.location_name || formatCoordinates(selectedIssue.latitude, selectedIssue.longitude)}
                </p>
              </div>
              <button onClick={() => setSelectedIssue(null)} className="rounded-xl p-2 text-slate-400 hover:text-slate-700 hover:bg-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-50">
              <div className="grid gap-4 lg:grid-cols-2 mb-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-2">{l('Before (Reported)', 'Before (Reported)')}</p>
                  <ComplaintThumbnail
                    src={selectedIssue.image_url}
                    alt={translateCategory(selectedIssue.category)}
                    className="w-full h-64 object-cover rounded-2xl shadow-sm border border-gray-100 mb-3"
                    emptyLabel={l('No image available', 'No image available')}
                    openInNewTab
                  />
                  {resolveMediaUrl(selectedIssue.citizen_voice_url) && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase text-blue-700">{l('Citizen Voice Note', 'Citizen Voice Note')}</p>
                      <audio src={resolveMediaUrl(selectedIssue.citizen_voice_url)} controls className="w-full h-10 outline-none" preload="none" />
                    </div>
                  )}
                </div>
                {(selectedIssue.proof_url || selectedIssue.status === 'resolved') && (
                  <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
                    <p className="text-xs text-emerald-600 uppercase font-bold mb-2">{l('After (Proof of Work)', 'After (Proof of Work)')}</p>
                    <ComplaintThumbnail
                      src={selectedIssue.proof_url || selectedIssue.image_url}
                      alt={l('Proof of work', 'Proof of work')}
                      className="w-full h-64 object-cover rounded-2xl shadow-sm border border-emerald-200 mb-3"
                      emptyLabel={l('No proof image available', 'No proof image available')}
                      openInNewTab
                    />
                    {resolveMediaUrl(selectedIssue.worker_voice_url) && (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase text-emerald-700">{l('Worker Voice Note', 'Worker Voice Note')}</p>
                        <audio src={resolveMediaUrl(selectedIssue.worker_voice_url)} controls className="w-full h-10 outline-none" preload="none" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-3 mb-6 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{l('Category', 'Category')}</p><p className="mt-1 text-sm font-medium text-slate-800 capitalize">{translateCategory(selectedIssue.category)}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{l('Priority', 'Priority')}</p><span className={`mt-1 inline-flex text-xs font-bold ${PRIORITY_COLORS[selectedIssue.priority]}`}>{translatePriority(selectedIssue.priority)}</span></div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{l('Department', 'Department')}</p><p className="mt-1 text-sm text-slate-800">{translateDepartment(selectedIssue.department)}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{l('Location', 'Location')}</p><p className="mt-1 text-sm text-sky-700"><MapPin size={12} className="inline mr-1" />{selectedIssue.location_name || formatCoordinates(selectedIssue.latitude, selectedIssue.longitude)}</p>{selectedIssue.location_name && <p className="text-xs text-slate-500 mt-1">{formatCoordinates(selectedIssue.latitude, selectedIssue.longitude)}</p>}</div>
              </div>

              {REROUTEABLE_STATUSES.includes(selectedIssue.status) && (
                <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700">{l('Wrong Department?', 'తప్పు శాఖా?')}</p>
                  <h4 className="mt-1 text-lg font-semibold text-slate-900">{l('Forward this complaint to the correct department', 'ఈ ఫిర్యాదును సరైన శాఖకు మళ్లించండి')}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {l('Use this when the AI assigned the complaint to the wrong department. The case will be sent back as unassigned for the receiving department.', 'AI ఫిర్యాదును తప్పు శాఖకు పంపినప్పుడు దీనిని ఉపయోగించండి. ఈ కేసు కొత్త శాఖకు అసైన్ చేయని స్థితిలో తిరిగి పంపబడుతుంది.')}
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                    <select
                      value={rerouteDept}
                      onChange={(event) => setRerouteDept(event.target.value)}
                      className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
                    >
                      {DEPARTMENTS.filter((department) => department !== 'All Departments').map((department) => (
                        <option key={department} value={department}>
                          {translateDepartment(department)}
                        </option>
                      ))}
                    </select>
                    <Button onClick={rerouteComplaint} disabled={saving || rerouteDept === normalizeDepartmentOption(selectedIssue.department)} className="w-full bg-amber-600 hover:bg-amber-700">
                      {saving ? l('Forwarding...', 'మళ్లిస్తోంది...') : l('Forward Case', 'కేసును మళ్లించండి')}
                    </Button>
                  </div>
                </div>
              )}

              {['submitted', 'reopened', 'in_review'].includes(selectedIssue.status) && (
                <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Send size={16} className="text-emerald-600" /> {l('Assign to Field Worker', 'Assign to Field Worker')}</h4>
                  <p className="text-sm leading-6 text-slate-600 mb-3">{l('Select an active worker to dispatch to this exact location.', 'Select an active worker to dispatch to this exact location.')}</p>
                  {(selectedIssue.citizen_feedback || selectedIssue.feedback_comment) && (
                    <div className="mb-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-sm">
                      <p className="font-semibold text-slate-800">{l('Citizen feedback requires follow-up action.', 'Citizen feedback requires follow-up action.')}</p>
                      {selectedIssue.feedback_comment && <p className="mt-1 text-slate-600">{selectedIssue.feedback_comment}</p>}
                    </div>
                  )}
                  {selectedIssueWorkers.length === 0 ? (
                    <div className="mb-3 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
                      {l('No workers are available for this department right now.', 'ఈ శాఖకు ప్రస్తుతం వర్కర్లు అందుబాటులో లేరు.')}
                    </div>
                  ) : (
                    <select value={editWorkerId} onChange={(event) => setEditWorkerId(event.target.value)} className="w-full p-3 rounded-2xl border border-slate-200 outline-none text-sm bg-slate-50 shadow-sm font-medium mb-3 focus:bg-white focus:ring-2 focus:ring-emerald-200">
                      {selectedIssueWorkers.map((worker) => (
                        <option key={worker.email} value={worker.email}>
                          {worker.email.split('@')[0]} ({worker.email})
                        </option>
                      ))}
                    </select>
                  )}
                  <Button onClick={assignTask} disabled={saving || selectedIssueWorkers.length === 0 || !editWorkerId} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    {saving ? l('Assigning...', 'Assigning...') : l('Dispatch Worker', 'Dispatch Worker')}
                  </Button>
                </div>
              )}

              {(selectedIssue.status === 'assigned' || selectedIssue.status === 'in_progress') && (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-100 p-2 text-slate-500">
                      <Clock size={18} />
                    </div>
                    <h4 className="font-bold text-slate-900">{l('Waiting for Ground Worker', 'Waiting for Ground Worker')}</h4>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{l(`Task assigned to ${selectedIssue.worker_id}. They are currently working on resolving this issue and uploading verification proof.`, `${selectedIssue.worker_id} కు పని కేటాయించబడింది. వారు ప్రస్తుతం ఈ సమస్యను పరిష్కరించి ధృవీకరణ రుజువును అప్‌లోడ్ చేస్తున్నారు.`)}</p>
                </div>
              )}

              {selectedIssue.status === 'waiting_approval' && (
                <div className="rounded-3xl border border-emerald-300 bg-emerald-50 p-5 shadow-sm">
                  <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500" /> {l('Review Ground Verification Proof', 'Review Ground Verification Proof')}</h4>
                  <p className="text-sm leading-6 text-slate-600 mb-4">{l(`The worker (${selectedIssue.worker_id}) has uploaded proof of completion. Please review the Before and After images visually.`, `వర్కర్ (${selectedIssue.worker_id}) పని పూర్తైన రుజువును అప్‌లోడ్ చేశారు. దయచేసి ముందు మరియు తరువాత చిత్రాలను పరిశీలించండి.`)}</p>
                  <textarea value={editNotes} onChange={(event) => setEditNotes(event.target.value)} placeholder={l('Add official closing remarks or state why you are rejecting the work...', 'Add official closing remarks or state why you are rejecting the work...')} className="w-full flex-1 p-3 rounded-2xl border border-emerald-200 outline-none text-sm resize-none shadow-sm mb-4 bg-white" rows="3" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button variant="outline" onClick={rejectTask} disabled={saving} className="w-full !border-red-200 !text-red-600 !hover:bg-red-50 !bg-white">
                      <ThumbsDown size={16} className="mr-2" /> {l('Reject (Rework)', 'Reject (Rework)')}
                    </Button>
                    <Button onClick={approveTask} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      <CheckCircle2 size={16} className="mr-2" /> {l('Verify & Close Issue', 'Verify & Close Issue')}
                    </Button>
                  </div>
                </div>
              )}

              {selectedIssue.status === 'resolved' && (
                <div className="rounded-3xl p-5 bg-emerald-50 border border-emerald-100 shadow-sm">
                  <p className="text-xs text-emerald-800 font-bold uppercase mb-1 flex items-center gap-1"><ShieldCheck size={14} /> {l('Officer Resolved, Awaiting Citizen Feedback', 'Officer Resolved, Awaiting Citizen Feedback')}</p>
                  <p className="text-sm text-emerald-900 leading-6">{selectedIssue.notes || l('No closing remarks provided.', 'No closing remarks provided.')}</p>
                  <p className="text-sm text-emerald-800 mt-2">{l('Citizen confirmation is still pending before this complaint is fully closed.', 'Citizen confirmation is still pending before this complaint is fully closed.')}</p>
                </div>
              )}
              {selectedIssue.status === 'closed' && (
                <div className="rounded-3xl p-5 bg-emerald-100 border border-emerald-200 shadow-sm">
                  <p className="text-xs text-emerald-900 font-bold uppercase mb-1 flex items-center gap-1"><ShieldCheck size={14} /> {l('Citizen Confirmed and Closed', 'Citizen Confirmed and Closed')}</p>
                  <p className="text-sm text-emerald-900">{selectedIssue.feedback_comment || l('The citizen confirmed that the issue is fully solved.', 'The citizen confirmed that the issue is fully solved.')}</p>
                </div>
              )}
              {['reopened', 'in_review', 'closed'].includes(selectedIssue.status) && selectedIssue.citizen_feedback && (
                <div className="rounded-3xl p-5 bg-blue-50 border border-blue-100 mt-4 shadow-sm">
                  <p className="text-xs text-blue-900 font-bold uppercase mb-1">{l('Citizen Feedback', 'Citizen Feedback')}</p>
                  <p className="text-sm text-blue-900">
                    {l('Decision', 'Decision')}: <span className="font-semibold">{selectedIssue.citizen_feedback.replace(/_/g, ' ')}</span>
                  </p>
                  {selectedIssue.feedback_comment && <p className="text-sm text-blue-800 mt-1">{selectedIssue.feedback_comment}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
