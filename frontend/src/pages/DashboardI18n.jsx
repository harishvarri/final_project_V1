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
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplaints(user?.email, user?.role, user?.department);
      setComplaints(data || []);

      if (user?.role === 'officer' || user?.role === 'admin') {
        getAllUsers(user?.email, user?.role)
          .then((usersData) => setWorkers((usersData || []).filter((entry) => entry.role === 'worker')))
          .catch((reason) => console.error('Error fetching workers:', reason));
      }
    } catch {
      setError(l('Failed to fetch complaints', 'à°«à°¿à°°à±à°¯à°¾à°¦à±à°²à°¨à± à°ªà±Šà°‚à°¦à°²à±‡à°•à°ªà±‹à°¯à°¾à°‚'));
    } finally {
      setLoading(false);
    }
  };

  const assignTask = async () => {
    if (!selectedIssue || !editWorkerId) return;
    setSaving(true);
    try {
      await updateComplaint(selectedIssue.id, { status: 'assigned', worker_id: editWorkerId }, user?.email, user?.role);
      toast.success(l('Task assigned successfully!', 'à°ªà°¨à°¿ à°µà°¿à°œà°¯à°µà°‚à°¤à°‚à°—à°¾ à°•à±‡à°Ÿà°¾à°¯à°¿à°‚à°šà°¬à°¡à°¿à°‚à°¦à°¿!'));
      setSelectedIssue(null);
      loadData();
    } catch {
      toast.error(l('Failed to assign task', 'à°ªà°¨à°¿ à°•à±‡à°Ÿà°¾à°¯à°¿à°‚à°šà°²à±‡à°•à°ªà±‹à°¯à°¾à°‚'));
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
        { status: 'resolved', notes: editNotes || l('Approved by Officer', 'à°…à°§à°¿à°•à°¾à°°à°¿ à°†à°®à±‹à°¦à°¿à°‚à°šà°¾à°°à±') },
        user?.email,
        user?.role,
      );
      toast.success(l('Task verified and closed!', 'à°ªà°¨à°¿ à°§à±ƒà°µà±€à°•à°°à°¿à°‚à°šà°¿ à°®à±‚à°¸à°¿à°µà±‡à°¯à°¬à°¡à°¿à°‚à°¦à°¿!'));
      setSelectedIssue(null);
      loadData();
    } catch {
      toast.error(l('Failed to approve task', 'à°ªà°¨à°¿à°¨à°¿ à°†à°®à±‹à°¦à°¿à°‚à°šà°²à±‡à°•à°ªà±‹à°¯à°¾à°‚'));
    } finally {
      setSaving(false);
    }
  };

  const rejectTask = async () => {
    if (!selectedIssue) return;
    if (!editNotes.trim()) {
      toast.error(l('Please provide a rejection reason in the notes field.', 'à°—à°®à°¨à°¿à°•à°² à°µà°¿à°­à°¾à°—à°‚à°²à±‹ à°¤à°¿à°°à°¸à±à°•à°°à°£ à°•à°¾à°°à°£à°¾à°¨à±à°¨à°¿ à°¨à°®à±‹à°¦à± à°šà±‡à°¯à°‚à°¡à°¿.'));
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
      toast.success(l('Task rejected and sent back for rework!', 'à°ªà°¨à°¿ à°¤à°¿à°°à°¸à±à°•à°°à°¿à°‚à°šà°¿ à°®à°³à±à°²à±€ à°šà±‡à°¯à°¡à°¾à°¨à°¿à°•à°¿ à°ªà°‚à°ªà°¬à°¡à°¿à°‚à°¦à°¿!'));
      setSelectedIssue(null);
      loadData();
    } catch {
      toast.error(l('Failed to reject task', 'à°ªà°¨à°¿à°¨à°¿ à°¤à°¿à°°à°¸à±à°•à°°à°¿à°‚à°šà°²à±‡à°•à°ªà±‹à°¯à°¾à°‚'));
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

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="gradient-blue text-white py-6 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck size={22} /> {user?.role === 'admin' ? l('Central Dashboard', 'à°•à±‡à°‚à°¦à±à°°à±€à°¯ à°¡à±à°¯à°¾à°·à±â€Œà°¬à±‹à°°à±à°¡à±') : l('Department Officer Dashboard', 'à°¶à°¾à°– à°…à°§à°¿à°•à°¾à°°à°¿ à°¡à±à°¯à°¾à°·à±â€Œà°¬à±‹à°°à±à°¡à±')}
            </h1>
            <p className="text-emerald-100 text-sm mt-1">{user?.department ? translateDepartment(user.department) : l('System Administrator', 'à°¸à°¿à°¸à±à°Ÿà°®à± à°…à°¡à±à°®à°¿à°¨à°¿à°¸à±à°Ÿà±à°°à±‡à°Ÿà°°à±')}</p>
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
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {l('Refresh', 'à°°à°¿à°«à±à°°à±†à°·à±')}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: l('Total Issues', 'à°®à±Šà°¤à±à°¤à°‚ à°¸à°®à°¸à±à°¯à°²à±'), value: stats.total, icon: <LayoutDashboard size={20} />, border: 'border-gray-400' },
            { label: l('Requires Action', 'à°šà°°à±à°¯ à°…à°µà°¸à°°à°‚'), value: stats.pendingAction, icon: <UserCheck size={20} />, border: 'border-purple-500' },
            { label: l('On Ground', 'à°¸à±à°¥à°²à°‚à°²à±‹ à°ªà°¨à°¿'), value: stats.inProgress, icon: <Clock size={20} />, border: 'border-blue-500' },
            { label: l('High Priority', 'à°…à°§à°¿à°• à°ªà±à°°à°¾à°§à°¾à°¨à±à°¯à°¤'), value: stats.highPriority, icon: <AlertTriangle size={20} />, border: 'border-red-500' },
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
            <p className="text-gray-500">{l('Loading complaints...', 'à°«à°¿à°°à±à°¯à°¾à°¦à±à°²à± à°²à±‹à°¡à± à°…à°µà±à°¤à±à°¨à±à°¨à°¾à°¯à°¿...')}</p>
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
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{l('Issue', 'à°¸à°®à°¸à±à°¯')}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{l('Priority', 'à°ªà±à°°à°¾à°§à°¾à°¨à±à°¯à°¤')}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{l('Assigned To', 'à°•à±‡à°Ÿà°¾à°¯à°¿à°‚à°šà°¿à°¨ à°µà±à°¯à°•à±à°¤à°¿')}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{l('Status', 'à°¸à±à°¥à°¿à°¤à°¿')}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{l('Date', 'à°¤à±‡à°¦à±€')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-gray-400">
                        {l('No active issues for your department!', 'à°®à±€ à°¶à°¾à°–à°•à± à°•à±à°°à°¿à°¯à°¾à°¶à±€à°² à°¸à°®à°¸à±à°¯à°²à± à°²à±‡à°µà±!')}
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
                              className="w-10 h-10 rounded-lg object-cover bg-gray-100 shadow-sm"
                              emptyLabel={l('No image available', 'à°šà°¿à°¤à±à°°à°‚ à°…à°‚à°¦à±à°¬à°¾à°Ÿà±à°²à±‹ à°²à±‡à°¦à±')}
                              openInNewTab
                            />
                            <div>
                              <p className="text-sm font-semibold capitalize text-gray-800 group-hover:text-emerald-700 transition">{translateCategory(complaint.category)}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[150px]">{l('ID', 'à°à°¡à°¿')}: {complaint.id?.substring(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-md bg-gray-50 border ${complaint.priority === 'High' || complaint.priority === 'Urgent' ? 'border-red-200 text-red-600 bg-red-50' : PRIORITY_COLORS[complaint.priority] || 'border-gray-200 text-gray-600'}`}>
                            {translatePriority(complaint.priority)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-700 font-medium">{complaint.worker_id || l('Not Assigned', 'à°‡à°‚à°•à°¾ à°•à±‡à°Ÿà°¾à°¯à°¿à°‚à°šà°²à±‡à°¦à±')}</p>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {l('Issue Action Center', 'à°¸à°®à°¸à±à°¯ à°šà°°à±à°¯ à°•à±‡à°‚à°¦à±à°°à°‚')}
                <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{selectedIssue.id?.substring(0, 8)}</span>
              </h3>
              <button onClick={() => setSelectedIssue(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-2">{l('Before (Reported)', 'à°®à±à°‚à°¦à± (à°¨à°¿à°µà±‡à°¦à°¿à°‚à°šà°¿à°¨à°¦à°¿)')}</p>
                  <ComplaintThumbnail
                    src={selectedIssue.image_url}
                    alt={translateCategory(selectedIssue.category)}
                    className="w-full h-48 object-cover rounded-xl shadow-sm border border-gray-100 mb-2"
                    emptyLabel={l('No image available', 'à°šà°¿à°¤à±à°°à°‚ à°…à°‚à°¦à±à°¬à°¾à°Ÿà±à°²à±‹ à°²à±‡à°¦à±')}
                    openInNewTab
                  />
                  {resolveMediaUrl(selectedIssue.citizen_voice_url) && (
                    <audio src={resolveMediaUrl(selectedIssue.citizen_voice_url)} controls className="w-full h-10 outline-none" />
                  )}
                </div>
                {(selectedIssue.proof_url || selectedIssue.status === 'resolved') && (
                  <div className="flex-1">
                    <p className="text-xs text-emerald-600 uppercase font-bold mb-2">{l('After (Proof of Work)', 'à°¤à°°à±à°µà°¾à°¤ (à°ªà°¨à°¿ à°°à±à°œà±à°µà±)')}</p>
                    <ComplaintThumbnail
                      src={selectedIssue.proof_url || selectedIssue.image_url}
                      alt={l('Proof of work', 'à°ªà°¨à°¿ à°°à±à°œà±à°µà±')}
                      className="w-full h-48 object-cover rounded-xl shadow-sm border border-emerald-200 mb-2"
                      emptyLabel={l('No proof image available', 'à°°à±à°œà±à°µà± à°šà°¿à°¤à±à°°à°‚ à°…à°‚à°¦à±à°¬à°¾à°Ÿà±à°²à±‹ à°²à±‡à°¦à±')}
                      openInNewTab
                    />
                    {resolveMediaUrl(selectedIssue.worker_voice_url) && (
                      <audio src={resolveMediaUrl(selectedIssue.worker_voice_url)} controls className="w-full h-10 outline-none" />
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{l('Category', 'à°µà°°à±à°—à°‚')}</p><p className="text-sm font-medium text-gray-800 capitalize">{translateCategory(selectedIssue.category)}</p></div>
                <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{l('Priority', 'à°ªà±à°°à°¾à°§à°¾à°¨à±à°¯à°¤')}</p><span className={`text-xs font-bold ${PRIORITY_COLORS[selectedIssue.priority]}`}>{translatePriority(selectedIssue.priority)}</span></div>
                <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{l('Department', 'à°¶à°¾à°–')}</p><p className="text-sm text-gray-800">{translateDepartment(selectedIssue.department)}</p></div>
                <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{l('Location', 'à°¸à±à°¥à°¾à°¨à°‚')}</p><p className="text-sm text-blue-600"><MapPin size={12} className="inline mr-1" />{selectedIssue.location_name || formatCoordinates(selectedIssue.latitude, selectedIssue.longitude)}</p>{selectedIssue.location_name && <p className="text-xs text-gray-500 mt-1">{formatCoordinates(selectedIssue.latitude, selectedIssue.longitude)}</p>}</div>
              </div>

              {['submitted', 'reopened', 'in_review'].includes(selectedIssue.status) && (
                <div className="p-5 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl">
                  <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Send size={16} className="text-blue-500" /> {l('Assign to Field Worker', 'à°«à±€à°²à±à°¡à± à°µà°°à±à°•à°°à±â€Œà°•à± à°•à±‡à°Ÿà°¾à°¯à°¿à°‚à°šà°‚à°¡à°¿')}</h4>
                  <p className="text-sm text-gray-500 mb-3">{l('Select an active worker to dispatch to this exact location.', 'à°ˆ à°–à°šà±à°šà°¿à°¤à°®à±ˆà°¨ à°ªà±à°°à°¦à±‡à°¶à°¾à°¨à°¿à°•à°¿ à°ªà°‚à°ªà±‡à°‚à°¦à±à°•à± à°•à±à°°à°¿à°¯à°¾à°¶à±€à°² à°µà°°à±à°•à°°à±â€Œà°¨à± à°Žà°‚à°šà±à°•à±‹à°‚à°¡à°¿.')}</p>
                  {(selectedIssue.citizen_feedback || selectedIssue.feedback_comment) && (
                    <div className="mb-3 rounded-xl border border-blue-100 bg-white p-3 text-sm">
                      <p className="font-semibold text-gray-800">{l('Citizen feedback requires follow-up action.', 'Citizen feedback requires follow-up action.')}</p>
                      {selectedIssue.feedback_comment && <p className="mt-1 text-gray-600">{selectedIssue.feedback_comment}</p>}
                    </div>
                  )}
                  <select value={editWorkerId} onChange={(event) => setEditWorkerId(event.target.value)} className="w-full p-2.5 rounded-lg border border-gray-200 outline-none text-sm bg-white shadow-sm font-medium mb-3">
                    {workers.map((worker) => (
                      <option key={worker.email} value={worker.email}>
                        {worker.email.split('@')[0]} ({worker.email})
                      </option>
                    ))}
                  </select>
                  <Button onClick={assignTask} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700">
                    {saving ? l('Assigning...', 'à°•à±‡à°Ÿà°¾à°¯à°¿à°¸à±à°¤à±‹à°‚à°¦à°¿...') : l('Dispatch Worker', 'à°µà°°à±à°•à°°à±â€Œà°¨à± à°ªà°‚à°ªà°‚à°¡à°¿')}
                  </Button>
                </div>
              )}

              {(selectedIssue.status === 'assigned' || selectedIssue.status === 'in_progress') && (
                <div className="p-5 bg-gray-100 rounded-xl text-center">
                  <Clock size={40} className="text-gray-400 mx-auto mb-2 opacity-50" />
                  <h4 className="font-bold text-gray-700">{l('Waiting for Ground Worker', 'à°«à±€à°²à±à°¡à± à°µà°°à±à°•à°°à± à°•à±‹à°¸à°‚ à°µà±‡à°šà°¿ à°‰à°‚à°¦à°¿')}</h4>
                  <p className="text-sm text-gray-500">{l(`Task assigned to ${selectedIssue.worker_id}. They are currently working on resolving this issue and uploading verification proof.`, `${selectedIssue.worker_id} à°•à± à°ªà°¨à°¿ à°•à±‡à°Ÿà°¾à°¯à°¿à°‚à°šà°¬à°¡à°¿à°‚à°¦à°¿. à°µà°¾à°°à± à°ªà±à°°à°¸à±à°¤à±à°¤à°‚ à°¸à°®à°¸à±à°¯ à°ªà°°à°¿à°·à±à°•à°¾à°°à°‚ à°•à±‹à°¸à°‚ à°ªà°¨à°¿ à°šà±‡à°¸à±à°¤à±‚ à°§à±ƒà°µà±€à°•à°°à°£ à°°à±à°œà±à°µà±à°¨à± à°…à°ªà±à°²à±‹à°¡à± à°šà±‡à°¸à±à°¤à±à°¨à±à°¨à°¾à°°à±.`)}</p>
                </div>
              )}

              {selectedIssue.status === 'waiting_approval' && (
                <div className="p-5 border-2 border-emerald-500 bg-emerald-50 rounded-xl">
                  <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500" /> {l('Review Ground Verification Proof', 'à°«à±€à°²à±à°¡à± à°§à±ƒà°µà±€à°•à°°à°£ à°°à±à°œà±à°µà±à°¨à± à°¸à°®à±€à°•à±à°·à°¿à°‚à°šà°‚à°¡à°¿')}</h4>
                  <p className="text-sm text-gray-600 mb-4">{l(`The worker (${selectedIssue.worker_id}) has uploaded proof of completion. Please review the Before and After images visually.`, `à°µà°°à±à°•à°°à± (${selectedIssue.worker_id}) à°ªà±‚à°°à±à°¤à°¿ à°šà±‡à°¸à°¿à°¨ à°ªà°¨à°¿à°•à°¿ à°°à±à°œà±à°µà± à°…à°ªà±à°²à±‹à°¡à± à°šà±‡à°¶à°¾à°°à±. à°¦à°¯à°šà±‡à°¸à°¿ à°®à±à°‚à°¦à± à°®à°°à°¿à°¯à± à°¤à°°à±à°µà°¾à°¤ à°šà°¿à°¤à±à°°à°¾à°²à°¨à± à°šà±‚à°¸à°¿ à°¸à°®à±€à°•à±à°·à°¿à°‚à°šà°‚à°¡à°¿.`)}</p>
                  <textarea value={editNotes} onChange={(event) => setEditNotes(event.target.value)} placeholder={l('Add official closing remarks or state why you are rejecting the work...', 'à°…à°§à°¿à°•à°¾à°°à°¿à°• à°®à±à°—à°¿à°‚à°ªà± à°—à°®à°¨à°¿à°•à°²à± à°œà±‹à°¡à°¿à°‚à°šà°‚à°¡à°¿ à°²à±‡à°¦à°¾ à°Žà°‚à°¦à±à°•à± à°¤à°¿à°°à°¸à±à°•à°°à°¿à°¸à±à°¤à±à°¨à±à°¨à°¾à°°à±‹ à°šà±†à°ªà±à°ªà°‚à°¡à°¿...')} className="w-full flex-1 p-3 rounded-xl border border-gray-200 outline-none text-sm resize-none shadow-sm mb-4" rows="2" />
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={rejectTask} disabled={saving} className="flex-1 !border-red-200 !text-red-600 !hover:bg-red-50 !bg-white">
                      <ThumbsDown size={16} className="mr-2" /> {l('Reject (Rework)', 'à°¤à°¿à°°à°¸à±à°•à°°à°¿à°‚à°šà°‚à°¡à°¿ (à°®à°³à±à°²à±€ à°ªà°¨à°¿)')}
                    </Button>
                    <Button onClick={approveTask} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                      <CheckCircle2 size={16} className="mr-2" /> {l('Verify & Close Issue', 'à°§à±ƒà°µà±€à°•à°°à°¿à°‚à°šà°¿ à°¸à°®à°¸à±à°¯à°¨à± à°®à±‚à°¸à°¿à°µà±‡à°¯à°‚à°¡à°¿')}
                    </Button>
                  </div>
                </div>
              )}

              {selectedIssue.status === 'resolved' && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <p className="text-xs text-emerald-800 font-bold uppercase mb-1 flex items-center gap-1"><ShieldCheck size={14} /> {l('Officer Resolved, Awaiting Citizen Feedback', 'Officer Resolved, Awaiting Citizen Feedback')}</p>
                  <p className="text-sm text-emerald-900">{selectedIssue.notes || l('No closing remarks provided.', 'No closing remarks provided.')}</p>
                  <p className="text-sm text-emerald-800 mt-2">{l('Citizen confirmation is still pending before this complaint is fully closed.', 'Citizen confirmation is still pending before this complaint is fully closed.')}</p>
                </div>
              )}
              {selectedIssue.status === 'closed' && (
                <div className="p-4 bg-emerald-100 border border-emerald-200 rounded-xl">
                  <p className="text-xs text-emerald-900 font-bold uppercase mb-1 flex items-center gap-1"><ShieldCheck size={14} /> {l('Citizen Confirmed and Closed', 'Citizen Confirmed and Closed')}</p>
                  <p className="text-sm text-emerald-900">{selectedIssue.feedback_comment || l('The citizen confirmed that the issue is fully solved.', 'The citizen confirmed that the issue is fully solved.')}</p>
                </div>
              )}
              {['reopened', 'in_review', 'closed'].includes(selectedIssue.status) && selectedIssue.citizen_feedback && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mt-4">
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




