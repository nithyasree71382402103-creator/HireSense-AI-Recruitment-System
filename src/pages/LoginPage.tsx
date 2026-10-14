import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Lock, Mail, ArrowRight, UserCheck, Briefcase, Home } from 'lucide-react';
import { ErrorAlert } from '../components/ErrorAlert';
import { ResumeFixLogo } from '../components/ResumeFixLogo';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user && user.role === 'candidate') {
        navigate('/candidate/dashboard');
      } else if (user && user.role === 'recruiter') {
        navigate('/recruiter/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex items-center justify-between mb-4 px-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-300 shadow-2xs transition-all group"
          >
            <Home className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            <span>Back to Home</span>
          </Link>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Secure Access</span>
        </div>
        <Link to="/" className="inline-flex items-center gap-3 group mb-4">
          <ResumeFixLogo className="w-11 h-11 transition-transform group-hover:scale-105" />
          <div className="text-left">
            <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
              HireSense <span className="text-indigo-600">AI</span>
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Resume Fix
            </span>
          </div>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to your account</h2>
        <p className="mt-2 text-xs text-slate-600">
          Or{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200 rounded-2xl">
          {errorMessage && (
            <div className="mb-5">
              <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage('')} />
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-500 text-center mb-3">Quick Demo Credentials:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('candidate@hiresense.ai', 'Candidate@123')}
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold mb-0.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Candidate</span>
                </div>
                <p className="text-[10px] text-emerald-600 truncate">candidate@hiresense.ai</p>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('recruiter@hiresense.ai', 'Recruiter@123')}
                className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold text-blue-800 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold mb-0.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  <span>Recruiter</span>
                </div>
                <p className="text-[10px] text-blue-600 truncate">recruiter@hiresense.ai</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
