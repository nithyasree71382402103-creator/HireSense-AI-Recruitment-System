import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api';
import { RecruiterAnalytics } from '../../types';
import { StatCard } from '../../components/StatCard';
import { LoadingState } from '../../components/LoadingState';
import {
  BarChart3,
  Briefcase,
  Users,
  FileSearch,
  Layers,
  CheckCircle2,
  PieChart as PieIcon,
  TrendingUp,
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

export const RecruiterAnalyticsPage: React.FC = () => {
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
    return <LoadingState message="Calculating analytics and telemetry metrics..." />;
  }

  if (!analytics) return null;

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          Decision Intelligence
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
          Recruitment System Analytics
        </h1>
        <p className="text-xs text-slate-500">
          Real-time metrics tracking applicant volume, match distribution, skill frequency, and pipeline conversions.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Active Requisitions"
          value={analytics.total_jobs}
          icon={Briefcase}
          accentColor="indigo"
          subtitle="Open positions posted"
        />
        <StatCard
          label="Indexed Candidates"
          value={analytics.total_candidates}
          icon={Users}
          accentColor="blue"
          subtitle="In talent database"
        />
        <StatCard
          label="Total Applications"
          value={analytics.total_applications}
          icon={Layers}
          accentColor="purple"
          subtitle="Processed through pipeline"
        />
        <StatCard
          label="Shortlisted Candidates"
          value={analytics.shortlisted_count}
          icon={CheckCircle2}
          accentColor="emerald"
          subtitle="Advanced to interview stage"
        />
      </div>

      {/* Chart 1: Applications by Job */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Application Volume by Position</h2>
            <p className="text-xs text-slate-500">Candidate applications received across open positions</p>
          </div>
          <TrendingUp className="w-5 h-5 text-indigo-600" />
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.applications_by_job} margin={{ top: 10, right: 20, left: -10, bottom: 30 }}>
              <XAxis dataKey="job_title" tick={{ fontSize: 11, fill: '#64748B' }} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', fontSize: '12px' }} />
              <Bar dataKey="application_count" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Applicants" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2 & 3: Match Distribution & Skill Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Match Distribution Pie */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Candidate Match Distribution</h2>
              <p className="text-xs text-slate-500">Proportion of candidate scores across rating tiers</p>
            </div>
            <PieIcon className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.match_distribution}
                  dataKey="count"
                  nameKey="range"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {analytics.match_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Demanded Skills Bar */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Most In-Demand Skills</h2>
              <p className="text-xs text-slate-500">Technical requirements frequency across job descriptions</p>
            </div>
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.skill_distribution} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis dataKey="skill" type="category" tick={{ fontSize: 11, fill: '#1E293B', fontWeight: 600 }} width={90} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#10B981" radius={[0, 6, 6, 0]} name="Skill Postings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
