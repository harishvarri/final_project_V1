import { useEffect, useState } from 'react';
import { AlertCircle, FileText, Search } from 'lucide-react';
import { fetchComplaints } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import ComplaintThumbnail from '../components/ComplaintThumbnail';

const STATUS_COLORS = {
  submitted: 'bg-blue-100 text-blue-700',
  assigned: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  waiting_approval: 'bg-purple-100 text-purple-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-emerald-200 text-emerald-900',
  reopened: 'bg-red-100 text-red-700',
  in_review: 'bg-orange-100 text-orange-700',
  rejected: 'bg-red-100 text-red-700',
};

const CATEGORIES = ['dead_animals', 'garbage', 'illegal_dumping', 'pothole', 'sewer', 'streetlight', 'waterlogging'];

export default function IssuesI18n() {
  const { user } = useAuth();
  const { l, translateCategory, translateDepartment, translateStatus, translatePriority, formatDate } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplaints(user?.email, user?.role);
      setComplaints(Array.isArray(data) ? data : []);
    } catch {
      setError(l('Failed to fetch issues', 'Failed to fetch issues'));
    } finally {
      setLoading(false);
    }
  };

  const filtered = complaints.filter((complaint) => {
    const statusMatch = statusFilter === 'all' || complaint.status === statusFilter;
    const categoryMatch = categoryFilter === 'all' || complaint.category === categoryFilter;
    const searchMatch =
      !search ||
      complaint.category?.toLowerCase().includes(search.toLowerCase()) ||
      complaint.department?.toLowerCase().includes(search.toLowerCase());
    return statusMatch && categoryMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="gradient-blue text-white py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText size={22} /> {l('All Civic Issues', 'All Civic Issues')}
          </h1>
          <p className="text-blue-100 text-sm mt-0.5">{l('Track all reported issues and their status', 'Track all reported issues and their status')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card className="p-4 mb-6" hover={false}>
          <h3 className="text-sm font-bold text-blue-600 mb-3">{l('Filters', 'Filters')}</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{l('Status', 'Status')}</label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="all">{l('All Status', 'All Status')}</option>
                <option value="submitted">{translateStatus('submitted')}</option>
                <option value="assigned">{translateStatus('assigned')}</option>
                <option value="in_progress">{translateStatus('in_progress')}</option>
                <option value="waiting_approval">{translateStatus('waiting_approval')}</option>
                <option value="resolved">{translateStatus('resolved')}</option>
                <option value="in_review">{translateStatus('in_review')}</option>
                <option value="reopened">{translateStatus('reopened')}</option>
                <option value="closed">{translateStatus('closed')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{l('Category', 'Category')}</label>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="all">{l('All Categories', 'All Categories')}</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {translateCategory(category)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{l('Search', 'Search')}</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={l('Search issues...', 'Search issues...')}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">{l('Loading issues...', 'Loading issues...')}</p>
          </Card>
        ) : error ? (
          <Card className="p-12 text-center">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-500 font-medium">{error}</p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-400">{l('No issues found matching your filters.', 'No issues found matching your filters.')}</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((complaint, index) => (
              <Card key={complaint.id || index} className="overflow-hidden group">
                <ComplaintThumbnail
                  src={complaint.image_url}
                  alt={translateCategory(complaint.category)}
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                  emptyLabel={l('No image available', 'No image available')}
                  openInNewTab
                />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold capitalize">{translateCategory(complaint.category)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[complaint.status] || ''}`}>{translateStatus(complaint.status)}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{translateDepartment(complaint.department)}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                    <span>
                      {l('Priority', 'Priority')}: <span className="font-semibold text-gray-600">{translatePriority(complaint.priority)}</span>
                    </span>
                    <span>{formatDate(complaint.created_at)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

