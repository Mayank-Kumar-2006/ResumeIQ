import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FileText, Plus, TrendingUp, Award, CheckCircle, ArrowRight, Trash2, Eye } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/analyses/stats');
      setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const hasData = stats && stats.totalAnalyses > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">Overview of your resumes and job compatibility analyses</p>
        </div>
        <Link
          to="/analyze/new"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all"
        >
          <Plus className="h-4 w-4" /> Start New Analysis
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Saved Resumes</span>
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold text-slate-900">{stats?.savedResumes || 0}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Total Analyses</span>
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold text-slate-900">{stats?.totalAnalyses || 0}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Average Score</span>
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold text-slate-900">{stats?.avgScore || 0}%</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Completed</span>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold text-slate-900">{stats?.completedAnalyses || 0}</span>
          </div>
        </div>
      </div>

      {/* Recent Analyses / Empty State */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Recent Analyses</h2>
          {hasData && (
            <Link to="/history" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {!hasData ? (
          <div className="text-center py-16">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No analyses yet</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              Upload your resume and paste a job description to get your first compatibility score and AI advice.
            </p>
            <div className="mt-6">
              <Link
                to="/analyze/new"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all"
              >
                <Plus className="h-4 w-4" /> Start Your First Analysis
              </Link>
            </div>
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
                  <th className="pb-3 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {stats.recentAnalyses.map((item) => (
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
                    <td className="py-4 pl-4 text-right">
                      <Link
                        to={`/analyses/${item._id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Results
                      </Link>
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
