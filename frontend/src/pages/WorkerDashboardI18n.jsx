import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, CheckCircle2, MapPin, Navigation, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchComplaints, updateComplaint, uploadProof } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/Button';
import ComplaintThumbnail from '../components/ComplaintThumbnail';
import VoiceRecorderI18n from '../components/VoiceRecorderI18n';
import { formatCoordinates, lookupLocationName } from '../utils/location';

export default function WorkerDashboardI18n() {
  const { user } = useAuth();
  const { l, language, translateCategory, translatePriority, translateStatus } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [voiceFile, setVoiceFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [locationLabels, setLocationLabels] = useState({});
  const fileInputRef = useRef(null);
  const unreadRef = useRef([]);

  useEffect(() => {
    if (!user) return;
    loadData();
    const interval = setInterval(() => loadData(true), 10000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const pendingTasks = complaints.filter(
      (task) => !task.location_name && !locationLabels[task.id] && formatCoordinates(task.latitude, task.longitude),
    );
    if (pendingTasks.length === 0) return;

    let cancelled = false;
    pendingTasks.forEach(async (task) => {
      const label = await lookupLocationName(task.latitude, task.longitude, language);
      if (!label || cancelled) return;
      setLocationLabels((current) => (current[task.id] ? current : { ...current, [task.id]: label }));
    });

    return () => {
      cancelled = true;
    };
  }, [complaints, language, locationLabels]);

  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = await fetchComplaints(user?.email, user?.role, user?.department);
      const myTasks = (data || []).filter((complaint) => complaint.worker_id === user.email);
      const assignedIds = myTasks.filter((task) => task.status === 'assigned').map((task) => task.id);

      if (isBackground && unreadRef.current.length > 0) {
        const newTasks = assignedIds.filter((id) => !unreadRef.current.includes(id));
        newTasks.forEach((newTaskId) => {
          const taskInfo = myTasks.find((task) => task.id === newTaskId);
          if (!taskInfo) return;
          toast.success(l(`Emergency: you have been assigned a new ${translateCategory(taskInfo.category)} issue!`, `అత్యవసరం: మీకు కొత్త ${translateCategory(taskInfo.category)} సమస్య కేటాయించబడింది!`), {
            duration: 8000,
            position: 'top-center',
          });
        });
      }

      unreadRef.current = assignedIds;
      setComplaints(
        myTasks.sort((left, right) => {
          if (left.status === 'in_progress' && right.status !== 'in_progress') return -1;
          if (left.status !== 'in_progress' && right.status === 'in_progress') return 1;
          return new Date(right.created_at) - new Date(left.created_at);
        }),
      );
    } catch {
      if (!isBackground) toast.error(l('Failed to load tasks', 'పనులను లోడ్ చేయలేకపోయాం'));
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const startTask = async (id) => {
    try {
      await updateComplaint(id, { status: 'in_progress' }, user?.email, user?.role);
      toast.success(l('Task started! Stay safe.', 'పని ప్రారంభించబడింది! జాగ్రత్తగా ఉండండి.'));
      loadData();
    } catch {
      toast.error(l('Failed to update task', 'పని స్థితి నవీకరించలేకపోయాం'));
    }
  };

  const submitProof = async () => {
    if (!selectedTask || !proofImage) return;
    setUploading(true);
    try {
      await uploadProof(selectedTask.id, proofImage, voiceFile);
      toast.success(l('Proof uploaded! Sent to officer for approval.', 'రుజువు అప్లోడ్ అయింది! అధికారికి ఆమోదం కోసం పంపబడింది.'));
      setSelectedTask(null);
      setProofImage(null);
      setVoiceFile(null);
      loadData();
    } catch {
      toast.error(l('Upload failed. Try again.', 'అప్లోడ్ విఫలమైంది. మళ్లీ ప్రయత్నించండి.'));
    } finally {
      setUploading(false);
    }
  };

  const getTaskLocation = (task) => ({
    label: task.location_name || locationLabels[task.id] || l('Pinned location', 'పిన్ చేసిన స్థానం'),
    coordinates: formatCoordinates(task.latitude, task.longitude),
  });

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="bg-emerald-600 text-white p-5 shadow-md flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">{l('Ground Staff', 'గ్రౌండ్ సిబ్బంది')}</h1>
          <p className="text-emerald-100 text-sm mt-0.5">{user?.email}</p>
        </div>
        <button onClick={() => loadData()} className="p-2 bg-emerald-700 rounded-full hover:bg-emerald-800 transition">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        <h2 className="text-gray-500 font-bold mb-4 uppercase text-sm flex justify-between">
          {l('My Assignments', 'నా పనులు')}
          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{complaints.length}</span>
        </h2>

        {loading ? (
          <div className="flex justify-center p-10">
            <RefreshCw className="animate-spin text-emerald-500" size={30} />
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
            <CheckCircle2 size={50} className="text-emerald-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800">{l('All Caught Up!', 'అన్ని పనులు పూర్తి అయ్యాయి!')}</h3>
            <p className="text-gray-500 text-sm mt-1">{l('No pending tasks assigned to you right now.', 'ప్రస్తుతం మీకు కేటాయించిన పెండింగ్ పనులు లేవు.')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((task) => (
              <div key={task.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      task.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-700'
                        : task.status === 'assigned'
                          ? 'bg-blue-100 text-blue-700'
                          : task.status === 'waiting_approval'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {translateStatus(task.status).toUpperCase()}
                  </span>
                  {(task.priority === 'High' || task.priority === 'Urgent') && (
                    <span className="text-red-500 text-xs font-bold flex items-center gap-1 animate-pulse">
                      <AlertCircle size={12} /> {translatePriority(task.priority)}
                    </span>
                  )}
                </div>

                <div className="flex gap-4">
                  <ComplaintThumbnail
                    src={task.image_url}
                    alt={translateCategory(task.category)}
                    className="w-20 h-20 rounded-xl object-cover bg-gray-100"
                    emptyLabel={l('No image available', 'చిత్రం అందుబాటులో లేదు')}
                    openInNewTab
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 capitalize text-lg">{translateCategory(task.category)}</h3>
                    <div className="text-sm text-gray-500 mt-1 flex items-start gap-2">
                      <MapPin size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-700">{getTaskLocation(task).label}</p>
                        {getTaskLocation(task).coordinates && (
                          <p className="text-xs text-gray-500">
                            {l('Coordinates', 'కోఆర్డినేట్లు')}: {getTaskLocation(task).coordinates}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {task.rejection_reason && task.status === 'assigned' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-xs text-red-600 font-bold uppercase mb-1">{l('Rejected by Officer - Rework', 'అధికారి తిరస్కరించారు - మళ్లీ పని చేయండి')}</p>
                    <p className="text-sm text-red-800">{task.rejection_reason}</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}`} target="_blank" rel="noreferrer" className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200">
                    <Navigation size={18} /> {l('Map', 'మ్యాప్')}
                  </a>

                  {task.status === 'assigned' && (
                    <button onClick={() => startTask(task.id)} className="flex-[2] bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 shadow-sm transition">
                      {l('Start Work', 'పని ప్రారంభించండి')}
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button onClick={() => setSelectedTask(task)} className="flex-[2] bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 shadow-sm transition flex items-center justify-center gap-2">
                      <Camera size={18} /> {l('Upload Proof', 'రుజువు అప్లోడ్ చేయండి')}
                    </button>
                  )}
                  {task.status === 'waiting_approval' && (
                    <div className="flex-[2] bg-gray-100 text-gray-400 font-bold py-3 rounded-xl flex items-center justify-center text-sm">
                      {l('Waiting for Officer', 'అధికారి కోసం వేచి ఉంది')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/80 p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{l('Upload Work Proof', 'పని రుజువు అప్లోడ్ చేయండి')}</h3>
            <p className="text-gray-500 text-sm mb-6">{l('Take a clear photo of the resolved issue. This will be sent to your officer for approval.', 'పరిష్కరించిన సమస్యకు స్పష్టమైన ఫోటో తీసుకోండి. ఇది మీ అధికారికి ఆమోదం కోసం పంపబడుతుంది.')}</p>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={fileInputRef}
              onChange={(event) => {
                if (event.target.files && event.target.files[0]) setProofImage(event.target.files[0]);
              }}
            />

            {proofImage ? (
              <div className="relative mb-6">
                <img src={URL.createObjectURL(proofImage)} alt={l('Preview', 'ప్రివ్యూ')} className="w-full h-48 object-cover rounded-xl border border-gray-200 shadow-sm" />
                <button onClick={() => setProofImage(null)} className="absolute top-2 right-2 bg-gray-900/60 p-2 rounded-full text-white">
                  X
                </button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 border-2 border-dashed border-emerald-300 bg-emerald-50 rounded-xl flex flex-col items-center justify-center cursor-pointer mb-6 hover:bg-emerald-100 transition">
                <Camera size={40} className="text-emerald-500 mb-2" />
                <span className="text-emerald-700 font-bold">{l('Tap to open Camera', 'కెమెరా తెరవడానికి ట్యాప్ చేయండి')}</span>
              </div>
            )}

            <div className="mb-6">
              <VoiceRecorderI18n onRecordingComplete={setVoiceFile} label={l('Explain Work Done via Voice (Optional)', 'చేసిన పనిని వాయిస్ ద్వారా వివరించండి (ఐచ్ఛికం)')} />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 !py-3 bg-gray-50" onClick={() => { setSelectedTask(null); setProofImage(null); setVoiceFile(null); }}>
                {l('Cancel', 'రద్దు చేయి')}
              </Button>
              <Button onClick={submitProof} disabled={!proofImage || uploading} className={`flex-1 !py-3 bg-emerald-600 ${!proofImage || uploading ? 'opacity-50' : ''}`}>
                {uploading ? l('Uploading...', 'అప్లోడ్ అవుతోంది...') : l('Submit Proof', 'రుజువు పంపండి')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
