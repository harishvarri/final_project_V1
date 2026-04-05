import { useState, useEffect } from 'react';
import Card from '../components/Card';
import { fetchComplaints } from '../services/api';
import { FileText, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  submitted: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
};

const CATEGORIES = ['dead_animals', 'garbage', 'illegal_dumping', 'pothole', 'sewer', 'streetlight', 'waterlogging'];

export default function Issues() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplaints(user?.email, user?.role);
      setComplaints(data);
    } catch {
      setError('Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const filtered = complaints.filter((c) => {
    const statusMatch = statusFilter === 'all' || c.status === statusFilter;
    const catMatch = categoryFilter === 'all' || c.category === categoryFilter;
    const searchMatch = !search || c.category?.toLowerCase().includes(search.toLowerCase()) ||
      c.department?.toLowerCase().includes(search.toLowerCase());
    return statusMatch && catMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="gradient-blue text-white py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText size={22} /> All Civic Issues
          </h1>
          <p className="text-blue-100 text-sm mt-0.5">Track all reported issues and their status</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <Card className="p-4 mb-6" hover={false}>
          <h3 className="text-sm font-bold text-blue-600 mb-3">Filters</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="all">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search issues..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Content */}
        {loading ? (
          <Card className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Loading issues...</p>
          </Card>
        ) : error ? (
          <Card className="p-12 text-center">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-500 font-medium">{error}</p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-400">No issues found matching your filters.</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c, i) => (
              <Card key={c.id || i} className="overflow-hidden group">
                <img
                  src={c.image_url || 'https://via.placeholder.com/400x200'}
                  alt={c.category}
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold capitalize">
                      {c.category?.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[c.status] || ''}`}>
                      {c.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{c.department}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                    <span>Priority: <span className="font-semibold text-gray-600">{c.priority}</span></span>
                    <span>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '--'}</span>
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
