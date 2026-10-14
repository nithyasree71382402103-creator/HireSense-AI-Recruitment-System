import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, User, LogOut, LayoutDashboard, Briefcase, FileText, Settings } from 'lucide-react';
import { ResumeFixLogo } from './ResumeFixLogo';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isCandidate, isRecruiter } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center gap-1.5">
              <ResumeFixLogo className="w-10 h-10 shadow-sm transition-transform group-hover:scale-105" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  HireSense <span className="text-indigo-600">AI</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-900 text-slate-100 tracking-wider">
                  Resume Fix
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 block leading-none">
                Intelligent ATS & Skill Matching
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-indigo-600 transition-colors">
              Home
            </Link>
            <a href="/#features" className="hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="/#how-it-works" className="hover:text-indigo-600 transition-colors">
              How It Works
            </a>
            <Link to="/candidate/dashboard" className="hover:text-indigo-600 transition-colors">
              For Candidates
            </Link>
            <Link to="/recruiter/dashboard" className="hover:text-indigo-600 transition-colors">
              For Recruiters
            </Link>
          </nav>

          {/* Right Action / Auth CTA */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link
                  to={isCandidate ? '/candidate/dashboard' : '/recruiter/dashboard'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to={isCandidate ? '/candidate/settings' : '/recruiter/settings'}
                  title="Settings"
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </Link>

                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 pl-2 border-l border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 uppercase">
                    {user.full_name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900 leading-tight">{user.full_name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
