import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  UploadCloud,
  FileSearch,
  Crosshair,
  GraduationCap,
  Briefcase,
  Layers,
  User,
  PlusCircle,
  Users,
  GitCompare,
  BarChart3,
  LogOut,
  Sparkles,
  Settings,
  Home,
  Server,
} from 'lucide-react';
import { ResumeFixLogo } from './ResumeFixLogo';

export const Sidebar: React.FC = () => {
  const { user, isCandidate, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const candidateLinks = [
    { to: '/candidate/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/candidate/resume', label: 'Upload Resume', icon: UploadCloud },
    { to: '/candidate/resume-analysis', label: 'ATS Analysis', icon: FileSearch },
    { to: '/candidate/skill-gap', label: 'Skill Gap', icon: Crosshair },
    { to: '/candidate/recommendations', label: 'Recommendations', icon: GraduationCap },
    { to: '/candidate/jobs', label: 'Explore Jobs', icon: Briefcase },
    { to: '/candidate/applications', label: 'Applications', icon: Layers },
    { to: '/candidate/profile', label: 'My Profile', icon: User },
    { to: '/candidate/settings', label: 'Settings', icon: Settings },
  ];

  const recruiterLinks = [
    { to: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/recruiter/jobs', label: 'Job Postings', icon: Briefcase },
    { to: '/recruiter/jobs/create', label: 'Create Job', icon: PlusCircle },
    { to: '/recruiter/candidates', label: 'Candidate Pool', icon: Users },
    { to: '/recruiter/compare', label: 'Compare Candidates', icon: GitCompare },
    { to: '/recruiter/pipeline', label: 'Hiring Pipeline', icon: Layers },
    { to: '/recruiter/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/recruiter/settings', label: 'Settings', icon: Settings },
  ];

  const links = isCandidate ? candidateLinks : recruiterLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200">
        <Link to="/" className="flex items-center gap-2.5 group">
          <ResumeFixLogo className="w-8 h-8 transition-transform group-hover:scale-105" />
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
              HireSense <span className="text-indigo-600">AI</span>
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
              Resume Fix
            </span>
          </div>
        </Link>
      </div>

      {/* Role Badge Indicator */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
          {isCandidate ? 'Candidate Portal' : 'Recruiter Portal'}
        </span>
        <span className={`w-2 h-2 rounded-full ${isCandidate ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Return to Home & Backend Console Options */}
      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/40 space-y-1">
        <Link
          to="/backend"
          title="Open Full-Stack Backend Console"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/80 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Backend Console</span>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </Link>

        <Link
          to="/"
          title="Return to Public Home Page"
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white hover:shadow-2xs transition-all group"
        >
          <Home className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors shrink-0" />
          <span>Public Home Page</span>
        </Link>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="truncate text-left">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
