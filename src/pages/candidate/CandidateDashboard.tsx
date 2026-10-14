import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resumesApi, jobsApi, applicationsApi } from '../../services/api';
import { ResumeData, Job, Application } from '../../types';
import { StatCard } from '../../components/StatCard';
import { ScoreMeter } from '../../components/ScoreMeter';
import { LoadingState } from '../../components/LoadingState';
import { motion } from 'motion/react';
import {
  FileText,
  Code2,
  Briefcase,
  Layers,
  UploadCloud,
  FileSearch,
  Crosshair,
  GraduationCap,
  ArrowRight,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const CandidateDashboard: React.FC = () => {
  const { user } = useAuth();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resData, jobsData, appsData] = await Promise.all([
          resumesApi.getLatest().catch(() => null),
          jobsApi.list().catch(() => []),
          applicationsApi.list().catch(() => []),
        ]);
        setResume(resData);
        setJobs(jobsData);
        setApplications(appsData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading your recruitment dashboard..." />;
  }

  const atsScore = resume?.ats_score || 0;
  const skillsCount = resume?.skills?.length || 0;
  const totalJobs = jobs.length;
  const totalApplications = applications.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-8"
    >
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-linear-to-r from-indigo-700 via-indigo-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-semibold mb-2.5">
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Candidate Intelligence Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="mt-1 text-sm text-indigo-100 max-w-xl">
            Track your ATS compatibility score, explore matched openings, and elevate your technical skills.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/candidate/resume"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-bold rounded-xl shadow-md transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Resume</span>
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/candidate/jobs"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600/70 hover:bg-indigo-600 border border-white/25 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Briefcase className="w-4 h-4" />
              <span>Find Jobs</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="ATS Compatibility"
          value={resume ? `${Math.round(atsScore)}%` : 'N/A'}
          icon={FileText}
          accentColor="indigo"
          subtitle={resume ? 'Based on latest parsing' : 'Upload resume to analyze'}
        />
        <StatCard
          label="Identified Skills"
          value={skillsCount}
          icon={Code2}
          accentColor="emerald"
          subtitle="Indexed in taxonomy"
        />
        <StatCard
          label="Active Job Openings"
          value={totalJobs}
          icon={Briefcase}
          accentColor="blue"
          subtitle="Available for direct apply"
        />
        <StatCard
          label="My Applications"
          value={totalApplications}
          icon={Layers}
          accentColor="purple"
          subtitle="Active in recruiter pipeline"
        />
      </div>

      {/* Grid: Resume Status & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Resume Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Current Resume Status</h2>
              <p className="text-xs text-slate-500">Live AI parsing and completeness metrics</p>
            </div>
            {resume && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified ATS Ready</span>
              </span>
            )}
          </div>

          {resume ? (
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="shrink-0">
                <ScoreMeter score={resume.ats_score} size={150} strokeWidth={12} subtitle="ATS Calculated" />
              </div>
              <div className="flex-1 space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Uploaded File</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{resume.file_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 font-medium">Profile Completeness</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{resume.completeness_score}%</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Last Analyzed</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {resume.created_at ? new Date(resume.created_at).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/candidate/resume-analysis"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors group"
                  >
                    <span>View In-Depth Breakdown & Explanation</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center animate-bounce">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">No Resume Uploaded Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Upload your resume in PDF, DOCX, or TXT format to calculate your ATS score and unlock matching.
                </p>
              </div>
              <Link
                to="/candidate/resume"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload First Resume</span>
              </Link>
            </div>
          )}
        </motion.div>

        {/* Right: Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Quick Actions</h2>
            <p className="text-xs text-slate-500 mb-5">Access key modules with a single click</p>

            <div className="space-y-2.5">
              <Link
                to="/candidate/resume"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 hover:-translate-y-0.5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Upload Resume</h3>
                    <p className="text-[11px] text-slate-500">PDF, DOCX, or TXT format</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                to="/candidate/resume-analysis"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 hover:-translate-y-0.5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <FileSearch className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Analyze ATS Score</h3>
                    <p className="text-[11px] text-slate-500">View positives and improvements</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                to="/candidate/skill-gap"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 hover:-translate-y-0.5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Crosshair className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Skill Gap Analysis</h3>
                    <p className="text-[11px] text-slate-500">Compare skills against target roles</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                to="/candidate/recommendations"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 hover:-translate-y-0.5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Course Recommendations</h3>
                    <p className="text-[11px] text-slate-500">Curated resources for missing skills</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Applications Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Applications</h2>
            <p className="text-xs text-slate-500">Status updates across your submitted candidacies</p>
          </div>
          <Link
            to="/candidate/applications"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1 group"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {applications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Match %</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {applications.slice(0, 5).map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{app.job_title}</td>
                    <td className="py-3 px-4 text-slate-600">{app.job_company}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-indigo-700">{Math.round(app.match_score)}%</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recent'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs">
            No applications submitted yet. Browse open positions to apply!
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
