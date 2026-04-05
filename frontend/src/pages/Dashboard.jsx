import { useState, useEffect } from 'react';
import Card from '../components/Card';
import { fetchComplaints, updateComplaint } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, RefreshCw, AlertCircle, CheckCircle2, Clock, MapPin, X, Save, AlertTriangle, Send, UserCheck, ShieldCheck, ThumbsDown } from 'lucide-react';
import Button from '../components/Button';
import toast from 'react-hot-toast';

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

  // Workers fetched from Supabase
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
      toast.error('Failed to assign task');
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
                            <img src={c.image_url} className="w-10 h-10 rounded-lg object-cover bg-gray-100 shadow-sm" alt="" />
                            <div>
                              <p className="text-sm font-semibold capitalize text-gray-800 group-hover:text-emerald-700 transition">
                                {c.category?.replace('_', ' ')}
                              </p>
                              <p className="text-xs text-gray-500 truncate max-w-[150px]">ID: {c.id?.substring(0,8)}</p>
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
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
              
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  Issue Action Center
                  <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                    {selectedIssue.id?.substring(0, 8)}
                  </span>
                </h3>
                <button onClick={() => setSelectedIssue(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                
                {/* Images Row */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Before (Reported)</p>
                    <img src={selectedIssue.image_url} className="w-full h-48 object-cover rounded-xl shadow-sm border border-gray-100 mb-2" />
                    {selectedIssue.citizen_voice_url && (
                        <audio src={selectedIssue.citizen_voice_url} controls className="w-full h-10 outline-none" />
                    )}
                  </div>
                  {(selectedIssue.proof_url || selectedIssue.status === 'resolved') && (
                    <div className="flex-1">
                      <p className="text-xs text-emerald-600 uppercase font-bold mb-2">After (Proof of Work)</p>
                      <img src={selectedIssue.proof_url || selectedIssue.image_url} className="w-full h-48 object-cover rounded-xl shadow-sm border border-emerald-200 mb-2" />
                      {selectedIssue.worker_voice_url && (
                        <audio src={selectedIssue.worker_voice_url} controls className="w-full h-10 outline-none" />
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Category</p><p className="text-sm font-medium text-gray-800 capitalize">{selectedIssue.category?.replace('_', ' ')}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Priority</p><span className={`text-xs font-bold ${PRIORITY_COLORS[selectedIssue.priority]}`}>{selectedIssue.priority}</span></div>
                  <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Department</p><p className="text-sm text-gray-800">{selectedIssue.department}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Location</p><p className="text-sm text-blue-600 font-mono"><MapPin size={12} className="inline mr-1" />{selectedIssue.latitude?.toFixed(4)}, {selectedIssue.longitude?.toFixed(4)}</p></div>
                </div>

                {/* Conditional Action Blocks */}
                {selectedIssue.status === 'submitted' && (
                  <div className="p-5 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl">
                    <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Send size={16} className="text-blue-500"/> Assign to Field Worker</h4>
                    <p className="text-sm text-gray-500 mb-3">Select an active worker to dispatch to this exact location.</p>
                    <select 
                      value={editWorkerId} 
                      onChange={(e) => setEditWorkerId(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-gray-200 outline-none text-sm bg-white shadow-sm font-medium mb-3"
                    >
                      {workers.map(w => <option key={w.email} value={w.email}>{w.email.split('@')[0]} ({w.email})</option>)}
                    </select>
                    <Button onClick={assignTask} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700">
                      {saving ? "Assigning..." : "Dispatch Worker"}
                    </Button>
                  </div>
                )}

                {(selectedIssue.status === 'assigned' || selectedIssue.status === 'in_progress') && (
                  <div className="p-5 bg-gray-100 rounded-xl text-center">
                    <Clock size={40} className="text-gray-400 mx-auto mb-2 opacity-50"/>
                    <h4 className="font-bold text-gray-700">Waiting for Ground Worker</h4>
                    <p className="text-sm text-gray-500">Task assigned to <b>{selectedIssue.worker_id}</b>. They are currently working on resolving this issue and uploading verification proof.</p>
                  </div>
                )}

                {selectedIssue.status === 'waiting_approval' && (
                  <div className="p-5 border-2 border-emerald-500 bg-emerald-50 rounded-xl">
                    <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500"/> Review Ground Verification Proof</h4>
                    <p className="text-sm text-gray-600 mb-4">The worker (<b>{selectedIssue.worker_id}</b>) has uploaded proof of completion. Please review the Before and After images visually.</p>
                    
                    <textarea 
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Add official closing remarks or state why you are rejecting the work..."
                      className="w-full flex-1 p-3 rounded-xl border border-gray-200 outline-none text-sm resize-none shadow-sm mb-4"
                      rows="2"
                    ></textarea>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={rejectTask} disabled={saving} className="flex-1 !border-red-200 !text-red-600 !hover:bg-red-50 !bg-white">
                        <ThumbsDown size={16} className="mr-2"/> Reject (Rework)
                      </Button>
                      <Button onClick={approveTask} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckCircle2 size={16} className="mr-2"/> Verify & Close Issue
                      </Button>
                    </div>
                  </div>
                )}

                {selectedIssue.status === 'resolved' && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
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
