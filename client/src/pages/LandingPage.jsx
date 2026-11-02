import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { Sparkles, CheckCircle2, ShieldCheck, Zap, ArrowRight, FileCheck, Award, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/dashboard');
  }

  const sampleScore = 88;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-white py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-600 mb-6">
              <Sparkles className="h-4 w-4" /> AI-Powered Resume Matcher & ATS Optimizer
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
              Land Your Dream Job With <span className="text-indigo-600">ResumeIQ</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 sm:text-xl">
              Upload your resume, paste a job description, and instantly get compatibility scores, skill gap analysis, and AI-assisted improvements.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
              >
                Get Started Free <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto flex items-center justify-center rounded-xl border border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Sample Analysis Preview (Clearly Marked) */}
          <div id="sample" className="mt-20 rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xl shadow-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                  SAMPLE PREVIEW (DEMO DATA)
                </span>
                <span className="text-sm font-medium text-slate-600">Software Engineer — TechCorp Inc.</span>
              </div>
              <span className="text-sm text-slate-400">Analyzed just now</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="flex flex-col items-center justify-center rounded-xl bg-indigo-50/50 p-6 border border-indigo-100">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                  <span className="text-4xl font-black">{sampleScore}</span>
                  <span className="absolute bottom-4 text-xs font-medium text-indigo-200">/ 100</span>
                </div>
                <h3 className="mt-4 font-bold text-slate-900">Compatibility Score</h3>
                <p className="text-xs text-slate-500 text-center mt-1">Strong match for required technical skills</p>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Matched Skills (5)
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {['React', 'Node.js', 'JavaScript', 'MongoDB', 'Git'].map((s) => (
                        <span key={s} className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-2 flex items-center gap-1">
                      <Zap className="h-4 w-4" /> Missing Skills (2)
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {['Docker', 'Kubernetes'].map((s) => (
                        <span key={s} className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-1">
                    AI Advisor Recommendation
                  </h4>
                  <p className="text-sm text-slate-700">
                    "Highlight your containerization experience or add a project demonstrating Docker setup to address the missing infrastructure skills."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything You Need to Beat the ATS
            </h2>
            <p className="mt-4 text-slate-600">
              ResumeIQ combines robust deterministic algorithms with advanced AI to give you actionable insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-6">
                <FileCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Smart PDF Parsing</h3>
              <p className="text-slate-600">
                Extracts text and automatically detects sections like Skills, Education, Experience, and Projects with high precision.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-6">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Deterministic Scoring</h3>
              <p className="text-slate-600">
                Transparent 0-100 scoring engine based on Skills match, Keywords, Project relevance, and Resume structure.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-6">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">AI Bullet Rewrites</h3>
              <p className="text-slate-600">
                Get specific recommendations and reworded resume bullet points tailored to the exact job description you are targeting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            Ready to Optimize Your Resume?
          </h2>
          <p className="text-indigo-100 max-w-2xl mx-auto mb-10 text-lg">
            Join students and professionals who use ResumeIQ to secure interviews at top companies.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-600 shadow-lg hover:bg-indigo-50 transition-all"
          >
            Create Free Account <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
