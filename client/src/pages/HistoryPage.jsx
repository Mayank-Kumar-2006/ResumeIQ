import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { History, Search, Trash2, Eye, FileText, ArrowRight } from 'lucide-react';

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyses();
  }, [search]);

  const fetchAnalyses = async () => {
    try {
      const res = await api.get(`/analyses?search=${encodeURIComponent(search)}`);
      setAnalyses(res.data.analyses);
    } catch (err) {
      console.error('Failed to fetch analyses', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return;
    try {
      await api.delete(`/analyses/${id}`);
      setAnalyses(analyses.filter((a) => a._id !== id));
    } catch (err) {
      alert('Failed to delete analysis.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analysis History</h1>
          <p className="text-sm text-slate-600">Review, search, and manage your past job match analyses</p>
        </div>
        <Link
          to="/analyze/new"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all"
        >
          New Analysis
        </Link>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
        <Search className="h-5 w-5 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search by job title, company name, or resume..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-sm"
        />
      </div>

      {/* History Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="flex py-12 justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <History className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm">No analysis history found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4">Job Title & Company</th>
                  <th className="pb-3 px-4">Resume</th>
                  <th className="pb-3 px-4">Compatibility Score</th>
                  <th className="pb-3 px-4">Date</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {analyses.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 pr-4 font-semibold text-slate-900">
                      {item.jobTitle}
                      {item.companyName && <span className="block font-normal text-slate-500 text-xs">{item.companyName}</span>}
                    </td>
                    <td className="py-4 px-4 text-slate-600">{item.resumeName}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.overallScore >= 75 ? 'bg-emerald-100 text-emerald-800' :
                        item.overallScore >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.overallScore}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-500 text-xs">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 pl-4 text-right flex items-center justify-end gap-2">
                      <Link
                        to={`/analyses/${item._id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Link>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
