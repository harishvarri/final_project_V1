import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, FileText, MapPin, MessageSquareText, RefreshCw, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchComplaints, submitComplaintFeedback } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import Button from '../components/Button';
import ComplaintThumbnail from '../components/ComplaintThumbnail';
import { formatCoordinates } from '../utils/location';
import { supabase } from '../services/supabaseClient';

const STATUS_COLORS = {
  submitted: 'bg-blue-100 text-blue-700',
  assigned: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-amber-100 text-amber-700',
  waiting_approval: 'bg-purple-100 text-purple-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-emerald-200 text-emerald-900',
  reopened: 'bg-red-100 text-red-700',
  in_review: 'bg-orange-100 text-orange-700',
  rejected: 'bg-red-100 text-red-700',
};

const STATUS_ICONS = {
  submitted: <AlertCircle size={16} />,
  assigned: <Clock size={16} />,
  in_progress: <Clock size={16} />,
  waiting_approval: <Clock size={16} />,
  resolved: <CheckCircle2 size={16} />,
  closed: <CheckCircle2 size={16} />,
  reopened: <RotateCcw size={16} />,
  in_review: <MessageSquareText size={16} />,
  rejected: <AlertCircle size={16} />,
};

const FEEDBACK_OPTIONS = [
  { value: 'solved', status: 'closed' },
  { value: 'partially_solved', status: 'in_review' },
  { value: 'not_solved', status: 'reopened' },
];

export default function ReportedIssuesFeedbackI18n() {
  const { user } = useAuth();
  const { l, translateStatus, translatePriority, translateCategory, formatDate, formatDateTime } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [feedbackChoice, setFeedbackChoice] = useState('solved');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    loadData();
  }, [user]);

  useEffect(() => {
    if (!selectedComplaint) return;
    setFeedbackChoice(selectedComplaint.citizen_feedback || 'solved');
    setFeedbackComment(selectedComplaint.feedback_comment || '');
  }, [selectedComplaint]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplaints(user.email, 'citizen');
      setComplaints(data || []);
    } catch (reason) {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        const resolvedEmail = String(authUser?.email || user?.email || '').trim().toLowerCase();

        if (!resolvedEmail) throw reason;

        const { data, error: supabaseError } = await supabase
          .from('complaints')
          .select('*')
          .eq('user_email', resolvedEmail)
          .order('created_at', { ascending: false });

        if (supabaseError) throw supabaseError;

        setComplaints(data || []);
        setError(null);
      } catch (fallbackError) {
        console.error('Failed to load reported issues:', fallbackError);
        setError(
          fallbackError?.message ||
            l('Failed to load your reported issues', 'మీ నివేదించిన సమస్యలను లోడ్ చేయలేకపోయాం')
        );
      }
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

  const getFeedbackLabel = (value) => {
    if (value === 'solved') return l('Solved', 'పరిష్కరించబడింది');
    if (value === 'partially_solved') return l('Partially Solved', 'పాక్షికంగా పరిష్కరించబడింది');
    if (value === 'not_solved') return l('Not Solved', 'పరిష్కరించబడలేదు');
    return value;
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedComplaint || !user?.email) return;
    setSubmittingFeedback(true);
    try {
      const response = await submitComplaintFeedback(selectedComplaint.id, feedbackChoice, feedbackComment, user.email);
      const updatedComplaint = response.complaint;
      setComplaints((current) => current.map((complaint) => (complaint.id === updatedComplaint.id ? updatedComplaint : complaint)));
      setSelectedComplaint(updatedComplaint);
      toast.success(l('Feedback submitted successfully', 'అభిప్రాయం విజయవంతంగా సమర్పించబడింది'));
    } catch (reason) {
      toast.error(reason.response?.data?.error || l('Failed to submit feedback', 'అభిప్రాయాన్ని సమర్పించలేకపోయాం'));
    } finally {
      setSubmittingFeedback(false);
    }
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
          <Card className="max-w-2xl w-full p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-gray-800">{translateCategory(selectedComplaint.category)}</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[selectedComplaint.status] || STATUS_COLORS.submitted}`}>
                {STATUS_ICONS[selectedComplaint.status] || STATUS_ICONS.submitted}
                {translateStatus(selectedComplaint.status)}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">{l('Reported Image', 'నివేదించిన చిత్రం')}</p>
                <ComplaintThumbnail
                  src={selectedComplaint.image_url}
                  alt={translateCategory(selectedComplaint.category)}
                  className="w-full h-48 object-cover rounded-xl border border-gray-100"
                  emptyLabel={l('No image available', 'చిత్రం అందుబాటులో లేదు')}
                  openInNewTab
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">{l('Work Proof', 'పని రుజువు')}</p>
                <ComplaintThumbnail
                  src={selectedComplaint.proof_url || selectedComplaint.image_url}
                  alt={l('Work proof', 'పని రుజువు')}
                  className="w-full h-48 object-cover rounded-xl border border-gray-100"
                  emptyLabel={l('No proof image available', 'రుజువు చిత్రం అందుబాటులో లేదు')}
                  openInNewTab
                />
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase">{l('Location', 'స్థానం')}</p>
                <p className="text-sm text-gray-700">{getLocationName(selectedComplaint.location_name, selectedComplaint.latitude, selectedComplaint.longitude)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">{l('Priority', 'ప్రాధాన్యత')}</p>
                <p className="text-sm font-medium text-gray-700">{translatePriority(selectedComplaint.priority)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">{l('Reported Date', 'నివేదించిన తేదీ')}</p>
                <p className="text-sm text-gray-700">{formatDateTime(selectedComplaint.created_at)}</p>
              </div>
              {selectedComplaint.notes && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">{l('Officer Notes', 'అధికారి గమనికలు')}</p>
                  <p className="text-sm text-gray-700">{selectedComplaint.notes}</p>
                </div>
              )}
            </div>

            {selectedComplaint.status === 'resolved' && !selectedComplaint.citizen_feedback && (
              <div className="border border-emerald-200 bg-emerald-50 rounded-2xl p-4 mb-6">
                <h3 className="text-base font-bold text-emerald-900 mb-1">{l('Was your issue actually solved?', 'మీ సమస్య నిజంగా పరిష్కరించబడిందా?')}</h3>
                <p className="text-sm text-emerald-800 mb-4">
                  {l('Your feedback will help us either close the complaint or reopen it for follow-up action.', 'మీ అభిప్రాయం ఆధారంగా ఫిర్యాదు మూసివేయబడుతుంది లేదా తదుపరి చర్య కోసం మళ్లీ తెరవబడుతుంది.')}
                </p>

                <div className="grid md:grid-cols-3 gap-3 mb-4">
                  {FEEDBACK_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFeedbackChoice(option.value)}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        feedbackChoice === option.value
                          ? 'border-emerald-500 bg-white shadow-sm'
                          : 'border-emerald-100 bg-white/70 hover:border-emerald-300'
                      }`}
                    >
                      <p className="font-semibold text-gray-800">{getFeedbackLabel(option.value)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {l('Status after feedback', 'అభిప్రాయం తర్వాత స్థితి')}: {translateStatus(option.status)}
                      </p>
                    </button>
                  ))}
                </div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">{l('Comment (Optional)', 'వ్యాఖ్య (ఐచ్ఛికం)')}</label>
                <textarea
                  value={feedbackComment}
                  onChange={(event) => setFeedbackComment(event.target.value)}
                  placeholder={l('Share what was fixed or what still needs attention...', 'ఏం సరిచేశారు లేదా ఇంకా ఏం చేయాలి అనేది ఇక్కడ రాయండి...')}
                  className="w-full rounded-xl border border-emerald-100 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400 min-h-28"
                />

                <Button onClick={handleFeedbackSubmit} disabled={submittingFeedback} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">
                  {submittingFeedback ? l('Submitting feedback...', 'అభిప్రాయం సమర్పిస్తోంది...') : l('Submit Feedback', 'అభిప్రాయం సమర్పించండి')}
                </Button>
              </div>
            )}

            {selectedComplaint.citizen_feedback && (
              <div className="border border-blue-200 bg-blue-50 rounded-2xl p-4 mb-6">
                <h3 className="text-base font-bold text-blue-900 mb-2">{l('Your Feedback', 'మీ అభిప్రాయం')}</h3>
                <p className="text-sm text-blue-800">
                  {l('Feedback', 'అభిప్రాయం')}: <span className="font-semibold">{getFeedbackLabel(selectedComplaint.citizen_feedback)}</span>
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  {l('Current workflow status', 'ప్రస్తుత వర్క్‌ఫ్లో స్థితి')}: <span className="font-semibold">{translateStatus(selectedComplaint.status)}</span>
                </p>
                {selectedComplaint.feedback_comment && (
                  <p className="text-sm text-blue-900 mt-3">{selectedComplaint.feedback_comment}</p>
                )}
              </div>
            )}

            <button onClick={() => setSelectedComplaint(null)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              {l('Close', 'మూసివేయి')}
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
