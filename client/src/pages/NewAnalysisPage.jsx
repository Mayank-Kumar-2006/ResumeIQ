import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Briefcase, FileText, Sparkles, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function NewAnalysisPage() {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const res = await api.get('/resumes');
      setResumes(res.data.resumes);
      if (res.data.resumes.length > 0) {
        setSelectedResumeId(res.data.resumes[0]._id);
      }
    } catch (err) {
      console.error('Failed to load resumes', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedResumeId) {
      setError('Please select or upload a resume first.');
      return;
    }
    if (jobDescription.trim().length < 50) {
      setError('Job description must be at least 50 characters.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/analyses', {
        resumeId: selectedResumeId,
        jobTitle,
        companyName,
        jobDescription,
      });

      const analysisId = res.data.analysisId;
      // Navigate to analysis results page
      navigate(`/analyses/${analysisId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start analysis. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Job Compatibility Analysis</h1>
        <p className="text-sm text-slate-600">Select a resume and provide job details to evaluate compatibility and get AI insights</p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {resumes.length === 0 && !loading && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 text-center space-y-4">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-600" />
          <h2 className="text-base font-bold text-amber-900">No resumes found</h2>
          <p className="text-sm text-amber-700">You need to upload at least one PDF resume before running an analysis.</p>
          <button
            onClick={() => navigate('/resumes')}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition-all"
          >
            Upload Resume Now
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Resume</label>
          <select
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            {resumes.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name} ({r.originalFilename}) — {r.wordCount} words
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Target Job Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Full Stack Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Company Name (Optional)</label>
            <input
              type="text"
              placeholder="e.g. TechCorp Inc."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Job Description *</label>
          <p className="text-xs text-slate-500 mb-2">Paste the complete job description including requirements, responsibilities, and tech stack.</p>
          <textarea
            required
            rows={10}
            placeholder="Paste job description here (min 50 characters)..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading || resumes.length === 0}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Analyzing Match & AI Advice...
              </>
            ) : (
              <>
                Run ResumeIQ Analysis <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
