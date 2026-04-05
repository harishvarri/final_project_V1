import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { uploadComplaint } from '../services/api';
import toast from 'react-hot-toast';
import { Upload, CheckCircle2, Brain, Building2, ArrowRight, ImagePlus } from 'lucide-react';
import VoiceRecorder from '../components/VoiceRecorder';

export default function Report() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [voiceFile, setVoiceFile] = useState(null);
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dropRef.current?.classList.remove('border-blue-500', 'bg-blue-50');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dropRef.current?.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = () => {
    dropRef.current?.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please upload an image first');
      return;
    }
    setLoading(true);
    try {
      const data = await uploadComplaint(file, priority, voiceFile, user?.email);
      if (data?.error) {
        toast.error(data.error);
        setResult(data);
        return;
      }
      toast.success('Complaint submitted successfully!');
      if (user?.email) {
        navigate('/reported-issues');
      } else {
        setResult(data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed. Please try again.');
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
      {/* Page header */}
      <div className="gradient-blue text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold">Report a Civic Issue</h1>
          <p className="text-blue-100 mt-1 text-sm">Upload a photo and our AI will classify it automatically</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className={`grid ${result ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-2xl mx-auto'} gap-6`}>
          {/* Upload Form */}
          {!result && (
            <Card className="p-6 animate-fade-in-up">
              <form onSubmit={handleSubmit}>
                {/* Drop area */}
                <div
                  ref={dropRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50/50"
                >
                  {preview ? (
                    <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-xl shadow-md" />
                  ) : (
                    <>
                      <ImagePlus size={48} className="mx-auto text-blue-400 mb-3" />
                      <p className="text-gray-600 font-medium">Drag & drop an image here</p>
                      <p className="text-gray-400 text-sm mt-1">or click to browse • JPG, PNG, WebP • Max 5MB</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files[0])}
                  />
                </div>

                {preview && (
                  <button type="button" onClick={resetForm} className="text-sm text-blue-600 hover:underline mt-2">
                    Change image
                  </button>
                )}

                {/* Priority */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                  >
                    <option value="Low">🟢 Low - Not urgent</option>
                    <option value="Medium">🟡 Medium - Normal priority</option>
                    <option value="High">🟠 High - Needs quick action</option>
                    <option value="Urgent">🔴 Urgent - Immediate attention</option>
                  </select>
                </div>
                
                {/* Voice Note */}
                <div className="mt-6">
                  <VoiceRecorder onRecordingComplete={setVoiceFile} label="Describe the issue with Voice (Optional)" />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading || !file}
                  className="w-full mt-6 !py-3 !text-base"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      AI is analyzing...
                    </>
                  ) : (
                    <>
                      <Upload size={18} /> Analyze & Submit Issue
                    </>
                  )}
                </Button>
              </form>
            </Card>
          )}

          {/* Result Card */}
          {result && (
            <>
              <Card className="p-6 animate-fade-in-up">
                <div className="text-center mb-4">
                  <CheckCircle2 size={48} className="text-green-500 mx-auto mb-2" />
                  <h3 className="text-lg font-bold text-gray-800">Issue Reported Successfully!</h3>
                </div>
                <img src={preview} alt="Uploaded" className="w-full max-h-48 object-cover rounded-xl shadow mb-4" />
                <p className="text-gray-500 text-sm text-center">Priority: <span className="font-semibold">{priority}</span></p>
              </Card>

              <Card className="p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Brain size={20} className="text-blue-600" /> AI Analysis Result
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Detected Category</p>
                    <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold capitalize">
                      {result.category?.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">AI Confidence</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full gradient-blue transition-all duration-1000"
                          style={{ width: `${(result.confidence * 100).toFixed(0)}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-700">{(result.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Routed Department</p>
                    <p className="text-gray-800 font-semibold flex items-center gap-1.5">
                      <Building2 size={16} className="text-blue-600" /> {result.department}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      result.status === 'needs_manual_review'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {result.status === 'needs_manual_review' ? 'Manual Review Needed' : 'Submitted'}
                    </span>
                  </div>

                  {result.top3?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Top Suggestions</p>
                      <div className="space-y-2">
                        {result.top3.map((item) => (
                          <div key={item.category} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                            <span className="capitalize text-gray-700">{item.category?.replace('_', ' ')}</span>
                            <span className="font-semibold text-gray-900">{(item.confidence * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button variant="outline" className="w-full mt-6" onClick={resetForm}>
                  Report Another Issue <ArrowRight size={16} />
                </Button>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
