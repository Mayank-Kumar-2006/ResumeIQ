import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-8 text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-900">ResumeIQ</span>
            <span className="text-sm text-slate-500">© 2026 AI-Powered Resume Analyzer</span>
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            Built with <Heart className="h-4 w-4 text-rose-500 fill-rose-500" /> for B.Tech IT Portfolios & Interviews
          </p>
        </div>
      </div>
    </footer>
  );
}
