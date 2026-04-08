import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, Building2, CheckCircle2, ImagePlus, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { uploadComplaint } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import VoiceRecorderI18n from '../components/VoiceRecorderI18n';

const REPORT_MODE = (import.meta.env.VITE_REPORT_API_MODE || 'backend').trim().toLowerCase();

export default function ReportI18n() {
  const { user } = useAuth();
  const { l, translateCategory, translateDepartment, translatePriority, translateStatus, translateMessage } = useLanguage();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [voiceFile, setVoiceFile] = useState(null);
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      toast.error(translateMessage('Please select a valid image file'));
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error(translateMessage('Image must be under 5MB'));
      return;
    }

    setFile(selectedFile);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (event) => setPreview(event.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    dropRef.current?.classList.remove('border-blue-500', 'bg-blue-50');
    if (event.dataTransfer.files.length) handleFile(event.dataTransfer.files[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    dropRef.current?.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = () => {
    dropRef.current?.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      toast.error(translateMessage('Please upload an image first'));
      return;
    }

    setLoading(true);
    try {
      const data = await uploadComplaint(file, priority, voiceFile, user?.email);
      if (data?.error) {
        toast.error(translateMessage(data.error));
        setResult(data);
        return;
      }

      if (data?.warning) {
        toast.error(translateMessage(data.warning));
      } else {
        toast.success(translateMessage('Complaint submitted successfully!'));
      }

      if (REPORT_MODE === 'gradio' || !user?.email) {
        setResult(data);
      } else {
        navigate('/reported-issues');
      }
    } catch (error) {
      toast.error(translateMessage(error.response?.data?.error || error.message || 'Submission failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setVoiceFile(null);
    setResult(null);
    setPriority('Medium');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="gradient-blue text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold">{l('Report a Civic Issue', 'పౌర సమస్యను నివేదించండి')}</h1>
          <p className="text-blue-100 mt-1 text-sm">{l('Upload a photo and our AI will classify it automatically', 'ఒక ఫోటో అప్లోడ్ చేయండి, మా ఏఐ దానిని స్వయంచాలకంగా వర్గీకరిస్తుంది')}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className={`grid ${result ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-2xl mx-auto'} gap-6`}>
          {!result && (
            <Card className="p-6 animate-fade-in-up">
              <form onSubmit={handleSubmit}>
                <div
                  ref={dropRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50/50"
                >
                  {preview ? (
                    <img src={preview} alt={l('Preview', 'ప్రివ్యూ')} className="max-h-64 mx-auto rounded-xl shadow-md" />
                  ) : (
                    <>
                      <ImagePlus size={48} className="mx-auto text-blue-400 mb-3" />
                      <p className="text-gray-600 font-medium">{l('Drag & drop an image here', 'ఇక్కడ చిత్రాన్ని డ్రాగ్ చేసి వదలండి')}</p>
                      <p className="text-gray-400 text-sm mt-1">{l('or click to browse • JPG, PNG, WebP • Max 5MB', 'లేక క్లిక్ చేసి ఫైల్ ఎంచుకోండి • JPG, PNG, WebP • గరిష్టం 5MB')}</p>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleFile(event.target.files[0])} />
                </div>

                {preview && (
                  <button type="button" onClick={resetForm} className="text-sm text-blue-600 hover:underline mt-2">
                    {l('Change image', 'చిత్రాన్ని మార్చండి')}
                  </button>
                )}

                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{l('Priority Level', 'ప్రాధాన్యత స్థాయి')}</label>
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                  >
                    <option value="Low">{l('Low - Not urgent', 'తక్కువ - అత్యవసరం కాదు')}</option>
                    <option value="Medium">{l('Medium - Normal priority', 'మధ్యస్థ - సాధారణ ప్రాధాన్యత')}</option>
                    <option value="High">{l('High - Needs quick action', 'అధిక - త్వరిత చర్య అవసరం')}</option>
                    <option value="Urgent">{l('Urgent - Immediate attention', 'అత్యవసరం - వెంటనే శ్రద్ధ అవసరం')}</option>
                  </select>
                </div>

                <div className="mt-6">
                  <VoiceRecorderI18n onRecordingComplete={setVoiceFile} label={l('Describe the issue with Voice (Optional)', 'వాయిస్ ద్వారా సమస్యను వివరించండి (ఐచ్ఛికం)')} />
                </div>

                <Button type="submit" disabled={loading || !file} className="w-full mt-6 !py-3 !text-base">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {l('AI is analyzing...', 'ఏఐ విశ్లేషిస్తోంది...')}
                    </>
                  ) : (
                    <>
                      <Upload size={18} /> {l('Analyze & Submit Issue', 'విశ్లేషించి ఫిర్యాదు పంపండి')}
                    </>
                  )}
                </Button>
              </form>
            </Card>
          )}

          {result && (
            <>
              <Card className="p-6 animate-fade-in-up">
                <div className="text-center mb-4">
                  <CheckCircle2 size={48} className="text-green-500 mx-auto mb-2" />
                  <h3 className="text-lg font-bold text-gray-800">{l('Issue Reported Successfully!', 'సమస్య విజయవంతంగా నమోదైంది!')}</h3>
                </div>
                <img src={preview} alt={l('Uploaded preview', 'అప్లోడ్ చేసిన ప్రివ్యూ')} className="w-full max-h-48 object-cover rounded-xl shadow mb-4" />
                <p className="text-gray-500 text-sm text-center">
                  {l('Priority', 'ప్రాధాన్యత')}: <span className="font-semibold">{translatePriority(priority)}</span>
                </p>
              </Card>

              <Card className="p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Brain size={20} className="text-blue-600" /> {l('AI Analysis Result', 'ఏఐ విశ్లేషణ ఫలితం')}
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{l('Detected Category', 'గుర్తించిన వర్గం')}</p>
                    <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold capitalize">
                      {translateCategory(result.category)}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{l('AI Confidence', 'ఏఐ నమ్మకం')}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full gradient-blue transition-all duration-1000" style={{ width: `${(result.confidence * 100).toFixed(0)}%` }} />
                      </div>
                      <span className="text-sm font-bold text-gray-700">{(result.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{l('Routed Department', 'పంపిన శాఖ')}</p>
                    <p className="text-gray-800 font-semibold flex items-center gap-1.5">
                      <Building2 size={16} className="text-blue-600" /> {translateDepartment(result.department)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{l('Status', 'స్థితి')}</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        result.status === 'needs_manual_review'
                          ? 'bg-amber-100 text-amber-700'
                          : result.status === 'classified_only'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {translateStatus(result.status)}
                    </span>
                  </div>

                  {result.warning && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      {result.warning}
                    </div>
                  )}

                  {result.top3?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{l('Top Suggestions', 'ముఖ్య సూచనలు')}</p>
                      <div className="space-y-2">
                        {result.top3.map((item) => (
                          <div key={item.category} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                            <span className="capitalize text-gray-700">{translateCategory(item.category)}</span>
                            <span className="font-semibold text-gray-900">{(item.confidence * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button variant="outline" className="w-full mt-6" onClick={resetForm}>
                  {l('Report Another Issue', 'మరో సమస్యను నివేదించండి')} <ArrowRight size={16} />
                </Button>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
