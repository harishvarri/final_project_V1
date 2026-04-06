import { useState, useEffect } from 'react';
import ComplaintThumbnail from '../components/ComplaintThumbnail';
import Card from '../components/Card';
import { fetchComplaints, updateComplaint } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, RefreshCw, AlertCircle, CheckCircle2, Clock, MapPin, X, AlertTriangle, Send, UserCheck, ShieldCheck, ThumbsDown, Volume2 } from 'lucide-react';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { resolveMediaUrl } from '../utils/media';

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
};

const PRIORITY_COLORS = {
  Low: 'text-emerald-600',
  Medium: 'text-amber-600',
  High: 'text-orange-600',
  Urgent: 'text-red-600',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  
  const defaultDept = user?.role === 'officer' && user?.department ? user.department : 'All Departments';
  const [selectedDept, setSelectedDept] = useState(defaultDept);
  
  // Modal state
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [editWorkerId, setEditWorkerId] = useState('');
  const [rerouteDept, setRerouteDept] = useState('Road Department');

  // Workers fetched from Supabase
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
      setComplaints(data || []);
      
      // Fetch workers if officer or admin
      if (user?.role === 'officer' || user?.role === 'admin') {
         import('../services/api').then(api => {
             return api.getAllUsers(user?.email, user?.role);
         }).then(usersData => {
             const workersList = usersData.filter(u => u.role === 'worker');
             setWorkers(workersList);
         }).catch(err => console.error("Error fetching workers:", err));
      }
    } catch (err) {
      setError('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const assignTask = async () => {
    if (!selectedIssue) return;
    if (!editWorkerId) {
      toast.error('Select a worker before dispatching this complaint.');
      return;
    }

    setSaving(true);
    try {
      await updateComplaint(selectedIssue.id, {
        status: 'assigned',
        worker_id: editWorkerId,
      }, user?.email, user?.role);
      toast.success('Task Assigned successfully!');
      setSelectedIssue(null);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to assign task');
    } finally {
      setSaving(false);
    }
  };

  const approveTask = async () => {
    setSaving(true);
    try {
      await updateComplaint(selectedIssue.id, {
        status: 'resolved',
        notes: editNotes || 'Approved by Officer'
      }, user?.email, user?.role);
      toast.success('Task Verified and Closed!');
      setSelectedIssue(null);
      loadData();
    } catch {
      toast.error('Failed to approve task');
    } finally {
      setSaving(false);
    }
  };

  const rejectTask = async () => {
    if (!editNotes.trim()) {
      toast.error('Please provide a rejection reason in the notes field.');
      return;
    }
    setSaving(true);
    try {
      await updateComplaint(selectedIssue.id, {
        status: 'assigned', // Send back to worker
        rejection_reason: editNotes,
        proof_url: null // Reset proof
      }, user?.email, user?.role);
      toast.success('Task rejected and sent back for rework!');
      setSelectedIssue(null);
      loadData();
    } catch {
      toast.error('Failed to reject task');
    } finally {
      setSaving(false);
    }
  };

  const rerouteComplaint = async () => {
    if (!selectedIssue || !rerouteDept) return;
    if (rerouteDept === normalizeDepartmentOption(selectedIssue.department)) {
      toast.error('Choose a different department to reroute this complaint.');
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
      toast.success(`Complaint forwarded to ${rerouteDept}.`);
      setSelectedIssue(null);
      loadData();
    } catch {
      toast.error('Failed to forward complaint to the selected department.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = complaints.filter((c) => {
    const dVal = selectedDept === 'All Departments' ? '' : selectedDept.replace(' Department', '');
    const deptMatch = selectedDept === 'All Departments' || (c.department && c.department.includes(dVal));
    const statusMatch = statusFilter === 'all' || c.status === statusFilter;
    return deptMatch && statusMatch;
  }).sort((a, b) => {
    const priorityWeight = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    const pA = priorityWeight[a.priority] || 0;
    const pB = priorityWeight[b.priority] || 0;
    
    // Sort waiting_approval first for Officers!
    const activeWaitA = a.status === 'waiting_approval' ? 10 : 0;
    const activeWaitB = b.status === 'waiting_approval' ? 10 : 0;
    if (activeWaitA !== activeWaitB) return activeWaitB - activeWaitA;
    
    if (pB !== pA) return pB - pA;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const stats = {
    total: filtered.length,
    pendingAction: filtered.filter(c => c.status === 'submitted' || c.status === 'waiting_approval').length,
    inProgress: filtered.filter(c => c.status === 'in_progress' || c.status === 'assigned').length,
    highPriority: filtered.filter(c => c.priority === 'High' || c.priority === 'Urgent').length
  };
  const selectedIssueWorkers = selectedIssue ? getAssignableWorkers(selectedIssue.department) : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="gradient-blue text-white py-6 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck size={22} /> {user?.role === 'admin' ? 'Central Dashboard' : 'Department Officer Dashboard'}
            </h1>
            <p className="text-emerald-100 text-sm mt-1">{user?.department || 'System Administrator'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {user?.role === 'admin' && (
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm text-gray-800 bg-white border-0 shadow-sm focus:ring-2 focus:ring-emerald-300 outline-none"
              >
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            )}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm text-gray-800 bg-white border-0 shadow-sm focus:ring-2 focus:ring-emerald-300 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Unassigned</option>
              <option value="waiting_approval">Requires Approval</option>
              <option value="assigned">Assigned / In Progress</option>
              <option value="resolved">Closed</option>
            </select>
            <Button variant="outline" className="!border-emerald-300 !text-white hover:!bg-white/10 !text-xs shadow-sm bg-emerald-700/50" onClick={loadData}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 flex items-center gap-4 border-l-4 border-gray-400">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Total Issues</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.total}</h3>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4 border-l-4 border-purple-500">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 animate-pulse">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Requires Action</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.pendingAction}</h3>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4 border-l-4 border-blue-500">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">On Ground</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.inProgress}</h3>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4 border-l-4 border-red-500 bg-red-50/30">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">High Priority</p>
              <h3 className="text-2xl font-bold text-red-600">{stats.highPriority}</h3>
            </div>
          </Card>
        </div>

        {loading ? (
          <Card className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Loading complaints...</p>
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
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-gray-400">
                        No active issues for your department! 🎉
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c, i) => (
                      <tr 
                        key={c.id || i} 
                        onClick={() => {
                          setSelectedIssue(c);
                          setEditWorkerId(c.worker_id || workers[0]?.email);
                          setEditNotes('');
                        }}
                        className={`transition-colors cursor-pointer group ${c.status === 'waiting_approval' ? 'bg-purple-50/40 hover:bg-purple-50/80 border-l-4 border-purple-400' : 'hover:bg-emerald-50/50'}`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <ComplaintThumbnail
                              src={c.image_url}
                              alt={c.category?.replace('_', ' ') || 'Complaint'}
                              className="h-14 w-14 shrink-0 rounded-xl object-cover bg-gray-100 shadow-sm"
                              emptyLabel="No image available"
                              openInNewTab
                            />
                            <div>
                              <p className="text-sm font-semibold capitalize text-gray-800 group-hover:text-emerald-700 transition">
                                {c.category?.replace('_', ' ')}
                              </p>
                              <p className="text-xs text-gray-500 truncate max-w-[190px]">ID: {c.id?.substring(0,8)}</p>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {resolveMediaUrl(c.citizen_voice_url) && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                                    <Volume2 size={12} /> Citizen Voice
                                  </span>
                                )}
                                {resolveMediaUrl(c.worker_voice_url) && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                                    <Volume2 size={12} /> Worker Voice
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-md bg-gray-50 border ${c.priority === 'High' || c.priority === 'Urgent' ? 'border-red-200 text-red-600 bg-red-50' : PRIORITY_COLORS[c.priority] || 'border-gray-200 text-gray-600'}`}>
                            {c.priority}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                            <p className="text-sm text-gray-700 font-medium">{c.worker_id || 'Not Assigned'}</p>
                            <p className="text-xs text-gray-400 truncate max-w-[150px]">{c.department}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                            {c.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : '--'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-slide-up">
              
              <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200 bg-slate-50 md:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Issue Action Center</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-bold text-slate-900 capitalize">{selectedIssue.category?.replace('_', ' ')}</h3>
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                      {selectedIssue.id?.substring(0, 8)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedIssue.location_name || `${selectedIssue.latitude?.toFixed?.(4) ?? '--'}, ${selectedIssue.longitude?.toFixed?.(4) ?? '--'}`}
                  </p>
                </div>
                <button onClick={() => setSelectedIssue(null)} className="rounded-xl p-2 text-slate-400 hover:text-slate-700 hover:bg-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 md:p-6 overflow-y-auto flex-1 custom-scrollbar bg-slate-50">
                
                {/* Images Row */}
                <div className="grid gap-4 lg:grid-cols-2 mb-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Before (Reported)</p>
                    <ComplaintThumbnail
                      src={selectedIssue.image_url}
                      alt={selectedIssue.category?.replace('_', ' ') || 'Complaint'}
                      className="w-full h-64 object-cover rounded-2xl shadow-sm border border-gray-100 mb-3"
                      emptyLabel="No image available"
                      openInNewTab
                    />
                    {resolveMediaUrl(selectedIssue.citizen_voice_url) && (
                      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase text-blue-700">Citizen Voice Note</p>
                        <audio src={resolveMediaUrl(selectedIssue.citizen_voice_url)} controls className="w-full h-10 outline-none" preload="none" />
                      </div>
                    )}
                  </div>
                  {(selectedIssue.proof_url || selectedIssue.status === 'resolved') && (
                    <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
                      <p className="text-xs text-emerald-600 uppercase font-bold mb-2">After (Proof of Work)</p>
                      <ComplaintThumbnail
                        src={selectedIssue.proof_url || selectedIssue.image_url}
                        alt="Proof of work"
                        className="w-full h-64 object-cover rounded-2xl shadow-sm border border-emerald-200 mb-3"
                        emptyLabel="No proof image available"
                        openInNewTab
                      />
                      {resolveMediaUrl(selectedIssue.worker_voice_url) && (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                          <p className="mb-2 text-xs font-semibold uppercase text-emerald-700">Worker Voice Note</p>
                          <audio src={resolveMediaUrl(selectedIssue.worker_voice_url)} controls className="w-full h-10 outline-none" preload="none" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid gap-3 mb-6 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Category</p><p className="mt-1 text-sm font-medium text-slate-800 capitalize">{selectedIssue.category?.replace('_', ' ')}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Priority</p><span className={`mt-1 inline-flex text-xs font-bold ${PRIORITY_COLORS[selectedIssue.priority]}`}>{selectedIssue.priority}</span></div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Department</p><p className="mt-1 text-sm text-slate-800">{selectedIssue.department}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Location</p><p className="mt-1 text-sm text-sky-700"><MapPin size={12} className="inline mr-1" />{selectedIssue.latitude?.toFixed(4)}, {selectedIssue.longitude?.toFixed(4)}</p></div>
                </div>

                {REROUTEABLE_STATUSES.includes(selectedIssue.status) && (
                  <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Wrong Department?</p>
                    <h4 className="mt-1 text-lg font-semibold text-slate-900">Forward this complaint to the correct department</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Use this when the AI assigned the complaint to the wrong department. The case will be returned as unassigned for the receiving department.
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                      <select
                        value={rerouteDept}
                        onChange={(e) => setRerouteDept(e.target.value)}
                        className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
                      >
                        {DEPARTMENTS.filter((department) => department !== 'All Departments').map((department) => (
                          <option key={department} value={department}>
                            {department}
                          </option>
                        ))}
                      </select>
                      <Button onClick={rerouteComplaint} disabled={saving || rerouteDept === normalizeDepartmentOption(selectedIssue.department)} className="w-full bg-amber-600 hover:bg-amber-700">
                        {saving ? 'Forwarding...' : 'Forward Case'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Conditional Action Blocks */}
                {REROUTEABLE_STATUSES.includes(selectedIssue.status) && (
                  <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Send size={16} className="text-emerald-600"/> Assign to Field Worker</h4>
                    <p className="text-sm leading-6 text-slate-600 mb-3">Select an active worker to dispatch to this exact location.</p>
                    {selectedIssueWorkers.length === 0 ? (
                      <div className="mb-3 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
                        No workers are available for this department right now.
                      </div>
                    ) : (
                      <select 
                        value={editWorkerId} 
                        onChange={(e) => setEditWorkerId(e.target.value)}
                        className="w-full p-3 rounded-2xl border border-slate-200 outline-none text-sm bg-slate-50 shadow-sm font-medium mb-3 focus:bg-white focus:ring-2 focus:ring-emerald-200"
                      >
                        {selectedIssueWorkers.map(w => <option key={w.email} value={w.email}>{w.email.split('@')[0]} ({w.email})</option>)}
                      </select>
                    )}
                    <Button onClick={assignTask} disabled={saving || selectedIssueWorkers.length === 0 || !editWorkerId} className="w-full bg-emerald-600 hover:bg-emerald-700">
                      {saving ? "Assigning..." : "Dispatch Worker"}
                    </Button>
                  </div>
                )}

                {(selectedIssue.status === 'assigned' || selectedIssue.status === 'in_progress') && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-slate-100 p-2 text-slate-500">
                        <Clock size={18}/>
                      </div>
                      <h4 className="font-bold text-slate-900">Waiting for Ground Worker</h4>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">Task assigned to <b>{selectedIssue.worker_id}</b>. They are currently working on resolving this issue and uploading verification proof.</p>
                  </div>
                )}

                {selectedIssue.status === 'waiting_approval' && (
                  <div className="rounded-3xl border border-emerald-300 bg-emerald-50 p-5 shadow-sm">
                    <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500"/> Review Ground Verification Proof</h4>
                    <p className="text-sm leading-6 text-slate-600 mb-4">The worker (<b>{selectedIssue.worker_id}</b>) has uploaded proof of completion. Please review the Before and After images visually.</p>
                    
                    <textarea 
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Add official closing remarks or state why you are rejecting the work..."
                      className="w-full flex-1 p-3 rounded-2xl border border-emerald-200 outline-none text-sm resize-none shadow-sm mb-4 bg-white"
                      rows="3"
                    ></textarea>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button variant="outline" onClick={rejectTask} disabled={saving} className="w-full !border-red-200 !text-red-600 !hover:bg-red-50 !bg-white">
                        <ThumbsDown size={16} className="mr-2"/> Reject (Rework)
                      </Button>
                      <Button onClick={approveTask} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckCircle2 size={16} className="mr-2"/> Verify & Close Issue
                      </Button>
                    </div>
                  </div>
                )}

                {selectedIssue.status === 'resolved' && (
                  <div className="rounded-3xl p-5 bg-emerald-50 border border-emerald-100 shadow-sm">
                    <p className="text-xs text-emerald-800 font-bold uppercase mb-1 flex items-center gap-1"><ShieldCheck size={14}/> Verified & Closed</p>
                    <p className="text-sm text-emerald-900">{selectedIssue.notes || 'No closing remarks provided.'}</p>
                  </div>
                )}

              </div>
           </div>
        </div>
      )}

    </div>
  );
}
