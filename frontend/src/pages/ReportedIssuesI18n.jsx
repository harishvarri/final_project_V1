import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, FileText, MapPin, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { fetchComplaints } from '../services/api';
import { formatCoordinates } from '../utils/location';

const STATUS_COLORS = {
  submitted: 'bg-blue-100 text-blue-700',
  assigned: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-amber-100 text-amber-700',
  waiting_approval: 'bg-purple-100 text-purple-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

const STATUS_ICONS = {
  submitted: <AlertCircle size={16} />,
  assigned: <Clock size={16} />,
  in_progress: <Clock size={16} />,
  waiting_approval: <Clock size={16} />,
  resolved: <CheckCircle2 size={16} />,
  rejected: <AlertCircle size={16} />,
};

export default function ReportedIssuesI18n() {
  const { user } = useAuth();
  const { l, translateStatus, translatePriority, translateCategory, formatDate, formatDateTime } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplaints(user.email, 'citizen');
      setComplaints(data || []);
    } catch {
      setError(l('Failed to load your reported issues', 'మీ నివేదించిన సమస్యలను లోడ్ చేయలేకపోయాం'));
    } finally {
      setLoading(false);
    }
  };

  const getLocationName = (locationName, latitude, longitude) => {
    if (locationName) {
      const coordinates = formatCoordinates(latitude, longitude);
      return coordinates ? `${locationName} (${coordinates})` : locationName;
    }
    if (!latitude || !longitude || latitude === 0 || longitude === 0) {
      return l('Location not provided', 'స్థానం ఇవ్వలేదు');
    }
    return formatCoordinates(latitude, longitude);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{l('Loading your issues...', 'మీ సమస్యలు లోడ్ అవుతున్నాయి...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="gradient-blue text-white py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <FileText size={22} /> {l('Your Reported Issues', 'మీ నివేదించిన సమస్యలు')}
            </h1>
            <p className="text-blue-100 text-sm mt-1">{l('Track all your submitted complaints', 'మీరు పంపిన అన్ని ఫిర్యాదులను ట్రాక్ చేయండి')}</p>
          </div>
          <Button variant="outline" className="!border-white !text-white hover:!bg-white/10 !text-xs w-fit" onClick={loadData}>
            <RefreshCw size={14} /> {l('Refresh', 'రిఫ్రెష్')}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <Card className="p-6 bg-red-50 border border-red-200 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          </Card>
        )}

        {complaints.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">{l('No reported issues yet', 'ఇప్పటివరకు ఫిర్యాదులు లేవు')}</p>
            <p className="text-gray-400 text-sm mt-1">
              <a href="/report" className="text-blue-600 hover:underline">
                {l('Report a new issue', 'కొత్త సమస్యను నివేదించండి')}
              </a>
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <Card key={complaint.id} className="p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedComplaint(complaint)}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-800 capitalize">{translateCategory(complaint.category)}</h3>
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[complaint.status] || STATUS_COLORS.submitted}`}>
                        {STATUS_ICONS[complaint.status] || STATUS_ICONS.submitted}
                        {translateStatus(complaint.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="flex items-center gap-2">
                        <MapPin size={14} /> {getLocationName(complaint.location_name, complaint.latitude, complaint.longitude)}
                      </p>
                      <p>
                        {l('Priority', 'ప్రాధాన్యత')}: <span className="font-medium">{translatePriority(complaint.priority)}</span>
                      </p>
                      <p>
                        {l('Reported', 'నివేదించిన తేదీ')}: {formatDate(complaint.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">{l('Confidence', 'నమ్మకం')}</div>
                    <div className="text-xl font-bold text-blue-600">{(complaint.confidence * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedComplaint(null)}>
          <Card className="max-w-md w-full p-6 animate-fade-in-up" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{translateCategory(selectedComplaint.category)}</h2>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase">{l('Status', 'స్థితి')}</p>
                <p className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[selectedComplaint.status]}`}>
                  {STATUS_ICONS[selectedComplaint.status]}
                  {translateStatus(selectedComplaint.status)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">{l('Location', 'స్థానం')}</p>
                <p className="text-sm text-gray-700">{getLocationName(selectedComplaint.location_name, selectedComplaint.latitude, selectedComplaint.longitude)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">{l('Priority', 'ప్రాధాన్యత')}</p>
                <p className="text-sm font-medium text-gray-700">{translatePriority(selectedComplaint.priority)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">{l('Confidence', 'నమ్మకం')}</p>
                <p className="text-sm font-medium text-gray-700">{(selectedComplaint.confidence * 100).toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">{l('Reported Date', 'నివేదించిన తేదీ')}</p>
                <p className="text-sm text-gray-700">{formatDateTime(selectedComplaint.created_at)}</p>
              </div>
              {selectedComplaint.notes && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">{l('Notes', 'గమనికలు')}</p>
                  <p className="text-sm text-gray-700">{selectedComplaint.notes}</p>
                </div>
              )}
            </div>
            <button onClick={() => setSelectedComplaint(null)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              {l('Close', 'మూసివేయి')}
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
