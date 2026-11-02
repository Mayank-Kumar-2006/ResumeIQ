import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle2, Zap, Award, FileText, ArrowLeft, Sparkles, AlertCircle, Copy, Check } from 'lucide-react';

export default function AnalysisResultsPage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pollTimer;
    let attempts = 0;
    const maxAttempts = 120; // Up to 3 minutes at a 1.5 second interval.

    const fetchAnalysis = async () => {
      try {
        const res = await api.get(`/analyses/${id}`);
        if (cancelled) return;

        const result = res.data.analysis;
        setAnalysis(result);
        if (result.status === 'processing' && attempts < maxAttempts) {
          attempts += 1;
          pollTimer = window.setTimeout(fetchAnalysis, 1500);
          return;
        }
        if (result.status === 'processing') {
          setError('This analysis is taking longer than expected. Please refresh to check its status.');
        } else if (result.status === 'failed') {
          setError(result.errorMessage || 'Analysis failed. Please try again with this resume and job description.');
        }
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Failed to load analysis results.');
        setLoading(false);
      }
    };

    fetchAnalysis();
    return () => {
      cancelled = true;
      if (pollTimer) window.clearTimeout(pollTimer);
    };
  }, [id]);

  const handleRegenerateAI = async () => {
    setRegenerating(true);
    try {
      const res = await api.post(`/analyses/${id}/ai-recommendations`);
      setAnalysis((prev) => ({
        ...prev,
        aiRecommendations: res.data.aiRecommendations,
      }));
    } catch (err) {
      alert('Failed to regenerate AI recommendations.');
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="space-y-3 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div><p className="text-sm text-slate-600">Analyzing your resume against the job description…</p><p className="text-xs text-slate-500">This page updates automatically when the analysis finishes.</p></div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">{analysis?.status === 'failed' ? 'Analysis failed' : 'Analysis results unavailable'}</h2>
        <p className="mt-2 text-sm text-slate-600">{error || 'Could not retrieve analysis details.'}</p>
        <Link to="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const {
    jobTitle,
    companyName,
    resumeName,
    overallScore,
    scoreBreakdown = {},
    matchedRequiredSkills = [],
    missingRequiredSkills = [],
    matchedPreferredSkills = [],
    missingPreferredSkills = [],
    matchedKeywords = [],
    missingKeywords = [],
    structureFeedback = {},
    aiRecommendations = {},
  } = analysis;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link to="/dashboard" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {jobTitle} {companyName && <span className="font-normal text-slate-500">at {companyName}</span>}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Resume Evaluated: <span className="font-medium text-slate-700">{resumeName}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Analysis ID: {analysis._id.slice(-6)}</span>
        </div>
      </div>

      {/* Score Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-200 mb-4">
            <span className="text-5xl font-black">{overallScore}</span>
            <span className="absolute bottom-5 text-xs font-medium text-indigo-200">/ 100</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Compatibility Score</h2>
          <p className="text-xs text-slate-500 mt-1">ResumeIQ Algorithmic Estimate</p>
        </div>

        <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Category Score Breakdown</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                <span>Skills Match (40%)</span>
                <span className="font-bold">{scoreBreakdown.skillsMatch || 0}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${scoreBreakdown.skillsMatch || 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                <span>Keyword Match (25%)</span>
                <span className="font-bold">{scoreBreakdown.keywordMatch || 0}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${scoreBreakdown.keywordMatch || 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                <span>Project Relevance (15%)</span>
                <span className="font-bold">{scoreBreakdown.projectRelevance || 0}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${scoreBreakdown.projectRelevance || 0}%` }}></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <span className="text-xs text-slate-400 block">Experience Relevance</span>
                <span className="text-base font-bold text-slate-900">{scoreBreakdown.experienceRelevance || 0}%</span>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <span className="text-xs text-slate-400 block">Resume Structure</span>
                <span className="text-base font-bold text-slate-900">{scoreBreakdown.resumeStructure || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Match Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Required Skills */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Required Skills Match
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-2">
                Matched Required ({matchedRequiredSkills.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {matchedRequiredSkills.length === 0 ? (
                  <p className="text-xs text-slate-400">None matched</p>
                ) : (
                  matchedRequiredSkills.map((s) => (
                    <span key={s} className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      ✓ {s}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block mb-2">
                Missing Required ({missingRequiredSkills.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {missingRequiredSkills.length === 0 ? (
                  <p className="text-xs text-slate-400">All required skills present!</p>
                ) : (
                  missingRequiredSkills.map((s) => (
                    <span key={s} className="rounded-lg bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
                      ✗ {s}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preferred Skills & Keywords */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" /> Preferred Skills
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {matchedPreferredSkills.length === 0 && missingPreferredSkills.length === 0 ? (
                <p className="text-xs text-slate-400">No preferred skills specified in job description</p>
              ) : (
                <>
                  {matchedPreferredSkills.map((s) => (
                    <span key={s} className="rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                      ✓ {s}
                    </span>
                  ))}
                  {missingPreferredSkills.map((s) => (
                    <span key={s} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {s} (optional)
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" /> Keywords Match ({matchedKeywords.length}/{matchedKeywords.length + missingKeywords.length})
            </h3>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {matchedKeywords.map((k) => (
                <span key={k} className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {k}
                </span>
              ))}
              {missingKeywords.map((k) => (
                <span key={k} className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-400 line-through">
                  {k}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Structure Feedback */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Resume Structure & Formatting Feedback</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Detected Sections</span>
            <div className="flex flex-wrap gap-2">
              {structureFeedback.detectedSections?.map((sec) => (
                <span key={sec} className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800 capitalize">
                  ✓ {sec}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Improvement Suggestions</span>
            {structureFeedback.suggestions?.length === 0 ? (
              <p className="text-sm text-slate-600">Resume structure looks great! All core sections detected.</p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-600">
                {structureFeedback.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="rounded-full bg-amber-100 text-amber-800 h-5 w-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">!</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/30 to-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-indigo-600 p-2.5 text-white shadow-md shadow-indigo-200">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">AI Career Advisor Recommendations</h3>
              <p className="text-xs text-slate-500">Tailored insights and bullet point rewrites generated for this role</p>
            </div>
          </div>
          <button
            onClick={handleRegenerateAI}
            disabled={regenerating}
            className="rounded-xl border border-indigo-200 bg-white px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
          >
            {regenerating ? 'Generating AI advice...' : 'Regenerate AI Advice'}
          </button>
        </div>

        {!aiRecommendations.available ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            {aiRecommendations.summary || 'AI recommendations are currently disabled or unavailable. Deterministic scoring is fully complete.'}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl bg-white p-5 border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Overall Assessment</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{aiRecommendations.summary}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl bg-white p-5 border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3">Prioritized Action Items</h4>
                <ul className="space-y-2.5 text-sm text-slate-700">
                  {aiRecommendations.prioritizedSuggestions?.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="rounded-full bg-indigo-600 text-white h-5 w-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-white p-5 border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3">Project Highlight Suggestions</h4>
                <ul className="space-y-2.5 text-sm text-slate-700">
                  {aiRecommendations.projectHighlightSuggestions?.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="rounded-full bg-emerald-100 text-emerald-800 h-5 w-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {aiRecommendations.bulletRewrites?.length > 0 && (
              <div className="rounded-xl bg-white p-6 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Suggested Bullet Point Rewrites</h4>
                <p className="text-xs text-slate-500">Review and copy improved bullet points preserving your original facts.</p>
                <div className="space-y-4">
                  {aiRecommendations.bulletRewrites.map((b, i) => (
                    <div key={i} className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="rounded-lg bg-white p-3 border border-slate-200">
                          <span className="font-bold text-slate-400 block mb-1">ORIGINAL</span>
                          <p className="text-slate-600 italic">"{b.original}"</p>
                        </div>
                        <div className="rounded-lg bg-indigo-50/50 p-3 border border-indigo-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-indigo-600">IMPROVED</span>
                            <button
                              onClick={() => copyToClipboard(b.improved, i)}
                              className="flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors"
                            >
                              {copiedIndex === i ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                              {copiedIndex === i ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <p className="text-slate-800 font-medium">{b.improved}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500"><span className="font-semibold text-slate-700">Why:</span> {b.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
