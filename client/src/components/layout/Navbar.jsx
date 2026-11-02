import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { FileText, LayoutDashboard, Briefcase, History, Settings, LogOut, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Resume<span className="text-indigo-600">IQ</span>
          </span>
        </Link>

        {user ? (
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/dashboard') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link
              to="/resumes"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/resumes') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="h-4 w-4" /> Resumes
            </Link>
            <Link
              to="/analyze/new"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/analyze/new') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="h-4 w-4" /> New Analysis
            </Link>
            <Link
              to="/history"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/history') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <History className="h-4 w-4" /> History
            </Link>
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600">
              How It Works
            </a>
            <a href="#sample" className="text-sm font-medium text-slate-600 hover:text-indigo-600">
              Sample Report
            </a>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/settings"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive('/settings') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="Settings"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">{user.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <LogOut className="h-4 w-4 text-slate-500" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
