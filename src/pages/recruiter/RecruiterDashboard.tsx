import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyticsApi } from '../../services/api';
import { RecruiterAnalytics } from '../../types';
import { StatCard } from '../../components/StatCard';
import { LoadingState } from '../../components/LoadingState';
import { motion } from 'motion/react';
import {
  Briefcase,
  Users,
  FileSearch,
  Layers,
  CheckCircle2,
  Clock,
  XCircle,
  PlusCircle,
  BarChart3,
  GitCompare,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const RecruiterDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<RecruiterAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await analyticsApi.getAnalytics();
        setAnalytics(data);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <LoadingState message="Aggregating recruitment metrics & charts..." />;
  }

  if (!analytics) return null;

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-indigo-300 text-xs font-semibold mb-2.5">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" style={{ animationDuration: '6s' }} />
            <span>Recruiter Intelligence Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="mt-1 text-sm text-slate-300 max-w-xl">
            {user?.company_name || 'Apex Global Technologies'} · Manage talent pipelines, review explainable AI candidate matches, and post job requirements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/recruiter/jobs/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Job</span>
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/recruiter/candidates"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Users className="w-4 h-4" />
              <span>Candidate Pool</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Top 7 Statistics Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        <StatCard label="Total Jobs" value={analytics.total_jobs} icon={Briefcase} accentColor="indigo" />
        <StatCard label="Candidates" value={analytics.total_candidates} icon={Users} accentColor="blue" />
        <StatCard label="Resumes" value={analytics.resumes_analyzed} icon={FileSearch} accentColor="purple" />
        <StatCard label="Applications" value={analytics.total_applications} icon={Layers} accentColor="indigo" />
        <StatCard label="Shortlisted" value={analytics.shortlisted_count} icon={CheckCircle2} accentColor="emerald" />
        <StatCard label="Under Review" value={analytics.under_review_count} icon={Clock} accentColor="amber" />
        <StatCard label="Rejected" value={analytics.rejected_count} icon={XCircle} accentColor="indigo" />
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Applications by Job (Bar Chart) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Applications by Job Posting</h2>
              <p className="text-xs text-slate-500">Applicant volume distribution across open requisitions</p>
            </div>
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.applications_by_job} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis
                  dataKey="job_title"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', fontSize: '12px' }}
                />
                <Bar dataKey="application_count" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Applicants" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Match Distribution (Pie/Donut Chart) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Match Distribution</h2>
                <p className="text-xs text-slate-500">Candidate alignment bands</p>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.match_distribution}
                    dataKey="count"
                    nameKey="range"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {analytics.match_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Skills Demand & Pipeline Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Most Demanded Skills in Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3 }}
          className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Top In-Demand Skills</h2>
              <p className="text-xs text-slate-500">Frequency of technical requirements across job postings</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.skill_distribution} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis dataKey="skill" type="category" tick={{ fontSize: 11, fill: '#1E293B', fontWeight: 600 }} width={85} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#10B981" radius={[0, 6, 6, 0]} name="Required in Jobs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Candidate Pipeline Funnel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.35 }}
          className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Candidate Pipeline Stages</h2>
                <p className="text-xs text-slate-500">Current candidate status distribution</p>
              </div>
              <Link
                to="/recruiter/pipeline"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group"
              >
                <span>Pipeline Board</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {analytics.pipeline_stages.map((st) => (
                <div
                  key={st.stage}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 text-xs transition-colors"
                >
                  <span className="font-semibold text-slate-700">{st.stage}</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-900 shadow-2xs">
                    {st.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
