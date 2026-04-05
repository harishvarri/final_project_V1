import { useState, useEffect, useRef } from 'react';
import Card from '../components/Card';
import { fetchComplaints, updateComplaint, uploadProof } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, MapPin, Camera, AlertCircle, CheckCircle2, Navigation } from 'lucide-react';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import VoiceRecorder from '../components/VoiceRecorder';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Proof upload state
  const [selectedTask, setSelectedTask] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [voiceFile, setVoiceFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const unreadRef = useRef([]);

  useEffect(() => {
    if (!user) return;
    loadData();
    const interval = setInterval(() => loadData(true), 10000);
    return () => clearInterval(interval);
  }, [user]);

  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = await fetchComplaints(user?.email, user?.role, user?.department);
      const myTasks = data.filter(c => c.worker_id === user.email);
      
      // Notification Logic
      const assignedIds = myTasks.filter(t => t.status === 'assigned').map(t => t.id);
      if (isBackground && unreadRef.current.length > 0) {
         const newTasks = assignedIds.filter(id => !unreadRef.current.includes(id));
         newTasks.forEach(newId => {
            const taskInfo = myTasks.find(t => t.id === newId);
            toast.success(
              `🚨 EMERGENCY: You have been assigned a new ${taskInfo.category.replace('_', ' ')} issue!`, 
              { duration: 8000, position: 'top-center' }
            );
         });
      }
      unreadRef.current = assignedIds;

      const sorted = myTasks.sort((a,b) => {
          if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
          if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;
          return new Date(b.created_at) - new Date(a.created_at);
      });
      setComplaints(sorted);
    } catch (err) {
      if (!isBackground) toast.error('Failed to load tasks');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const startTask = async (id) => {
    try {
      await updateComplaint(id, { status: 'in_progress' }, user?.email, user?.role);
      toast.success('Task started! Stay safe.');
      loadData();
    } catch {
      toast.error('Failed to update task');
    }
  };

  const submitProof = async () => {
    if (!selectedTask || !proofImage) return;
    setUploading(true);
    try {
      await uploadProof(selectedTask.id, proofImage, voiceFile);
      toast.success('Proof uploaded! Sent to officer for approval.');
      setSelectedTask(null);
      setProofImage(null);
      setVoiceFile(null);
      loadData();
    } catch (err) {
      toast.error('Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      
      {/* Mobile-friendly Header */}
      <div className="bg-emerald-600 text-white p-5 shadow-md flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            👷 Ground Staff
          </h1>
          <p className="text-emerald-100 text-sm mt-0.5">{user?.name}</p>
        </div>
        <button onClick={loadData} className="p-2 bg-emerald-700 rounded-full hover:bg-emerald-800 transition">
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        <h2 className="text-gray-500 font-bold mb-4 uppercase text-sm flex justify-between">
          My Assignments
          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{complaints.length}</span>
        </h2>

        {loading ? (
             <div className="flex justify-center p-10"><RefreshCw className="animate-spin text-emerald-500" size={30} /></div>
        ) : complaints.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
            <CheckCircle2 size={50} className="text-emerald-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800">All Caught Up!</h3>
            <p className="text-gray-500 text-sm mt-1">No pending tasks assigned to you right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map(task => (
              <div key={task.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    task.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                    task.status === 'assigned' ? 'bg-blue-100 text-blue-700' : 
                    task.status === 'waiting_approval' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </span>
                  {task.priority === 'High' || task.priority === 'Urgent' ? (
                    <span className="text-red-500 text-xs font-bold flex items-center gap-1 animate-pulse"><AlertCircle size={12}/> {task.priority}</span>
                  ) : null}
                </div>

                <div className="flex gap-4">
                  <img src={task.image_url} alt="Issue" className="w-20 h-20 rounded-xl object-cover bg-gray-100" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 capitalize text-lg">{task.category.replace('_', ' ')}</h3>
                    <p className="text-sm text-gray-500 mt-1 flex items-start gap-1">
                      <MapPin size={16} className="text-emerald-500 shrink-0 mt-0.5" /> 
                      Lat: {task.latitude?.toFixed(4)},<br/>Lng: {task.longitude?.toFixed(4)}
                    </p>
                  </div>
                </div>

                {task.rejection_reason && task.status === 'assigned' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-xs text-red-600 font-bold uppercase mb-1">⚠️ Rejected by Officer - Rework</p>
                    <p className="text-sm text-red-800">{task.rejection_reason}</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}`}
                    target="_blank"
                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200"
                  >
                    <Navigation size={18} /> Map
                  </a>
                  
                  {task.status === 'assigned' && (
                     <button onClick={() => startTask(task.id)} className="flex-[2] bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 shadow-sm transition">
                       Start Work
                     </button>
                  )}
                  {task.status === 'in_progress' && (
                     <button onClick={() => setSelectedTask(task)} className="flex-[2] bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 shadow-sm transition flex items-center justify-center gap-2">
                       <Camera size={18} /> Upload Proof
                     </button>
                  )}
                  {task.status === 'waiting_approval' && (
                     <div className="flex-[2] bg-gray-100 text-gray-400 font-bold py-3 rounded-xl flex items-center justify-center text-sm">
                       Waiting for Officer
                     </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Proof Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/80 p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Upload Work Proof</h3>
            <p className="text-gray-500 text-sm mb-6">Take a clear photo of the resolved issue. This will be sent to your officer for approval.</p>
            
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => {
                if(e.target.files && e.target.files[0]) {
                  setProofImage(e.target.files[0]);
                }
              }}
            />

            {proofImage ? (
              <div className="relative mb-6">
                <img src={URL.createObjectURL(proofImage)} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-gray-200 shadow-sm" />
                <button onClick={() => setProofImage(null)} className="absolute top-2 right-2 bg-gray-900/60 p-2 rounded-full text-white">X</button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-emerald-300 bg-emerald-50 rounded-xl flex flex-col items-center justify-center cursor-pointer mb-6 hover:bg-emerald-100 transition"
              >
                <Camera size={40} className="text-emerald-500 mb-2" />
                <span className="text-emerald-700 font-bold">Tap to open Camera</span>
              </div>
            )}
            
            <div className="mb-6">
              <VoiceRecorder onRecordingComplete={setVoiceFile} label="Explain Work Done via Voice (Optional)" />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 !py-3 bg-gray-50" onClick={() => {setSelectedTask(null); setProofImage(null); setVoiceFile(null);}}>Cancel</Button>
              <Button onClick={submitProof} disabled={!proofImage || uploading} className={`flex-1 !py-3 bg-emerald-600 ${(!proofImage || uploading) ? 'opacity-50' : ''}`}>
                {uploading ? 'Uploading...' : 'Submit Proof'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
