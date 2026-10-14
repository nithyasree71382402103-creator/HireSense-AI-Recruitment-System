import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Settings, ArrowLeft, ArrowRight, Home, Server } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { ResumeFixLogo } from './ResumeFixLogo';

interface TopNavProps {
  title?: string;
}

export const TopNav: React.FC<TopNavProps> = ({ title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isCandidate } = useAuth();

  const settingsPath = isCandidate ? '/candidate/settings' : '/recruiter/settings';

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(isCandidate ? '/candidate/dashboard' : '/recruiter/dashboard');
    }
  };

  const handleForward = () => {
    navigate(1);
  };

  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between transition-all duration-200">
      {/* Left: Back/Forward Navigation Symbols, Home Page Option & Path Title */}
      <div className="flex items-center gap-3">
        {/* Navigation Group (Back, Forward, Home) */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleBack}
            type="button"
            title="Go back to the previous page (←)"
            aria-label="Go back to previous page"
            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white transition-colors cursor-pointer flex items-center justify-center group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          </motion.button>
          <div className="w-px h-3.5 bg-slate-200" />
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleForward}
            type="button"
            title="Go forward to the next page you visited (→)"
            aria-label="Go forward to next page"
            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white transition-colors cursor-pointer flex items-center justify-center group"
          >
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
          <div className="w-px h-3.5 bg-slate-200" />
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/"
              title="Return to Home Page"
              aria-label="Go to Home Page"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-white transition-all shadow-2xs cursor-pointer group"
            >
              <Home className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-600 transition-colors" />
              <span>Home</span>
            </Link>
          </motion.div>
        </div>

        {/* Path Title with animated fade and ResumeFix logo */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
          <ResumeFixLogo className="w-5 h-5" />
          <span className="text-slate-800 font-bold">HireSense</span>
          <span>/</span>
          <span className="font-semibold text-slate-800 capitalize">
            {title || location.pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Dashboard'}
          </span>
        </div>
      </div>

      {/* Right: Quick Action Controls (Backend status, Settings, User Profile link) */}
      <div className="flex items-center gap-2.5">
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link
            to="/backend"
            title="Backend Server & API Status"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors border border-emerald-200/80 shadow-2xs"
          >
            <Server className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Backend</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </Link>
        </motion.div>

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link
            to={settingsPath}
            title="Account & System Settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-colors border border-slate-200/80 shadow-2xs"
          >
            <Settings className="w-3.5 h-3.5 transition-transform group-hover:rotate-45" />
            <span className="hidden md:inline">Settings</span>
          </Link>
        </motion.div>

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="w-7 h-7 rounded-full bg-linear-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs cursor-pointer"
            >
              {user.full_name?.charAt(0) || 'U'}
            </motion.div>
            <span className="hidden lg:inline text-xs font-bold text-slate-800">
              {user.full_name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
