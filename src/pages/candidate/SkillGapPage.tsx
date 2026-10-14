import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jobsApi, skillGapApi } from '../../services/api';
import { Job, SkillGapData } from '../../types';
import { SkillBadge } from '../../components/SkillBadge';
import { LoadingState } from '../../components/LoadingState';
import { ErrorAlert } from '../../components/ErrorAlert';
import { motion } from 'motion/react';
import {
  Crosshair,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Sparkles,
  Briefcase,
  GraduationCap,
} from 'lucide-react';

export const SkillGapPage: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [gapData, setGapData] = useState<SkillGapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobList = await jobsApi.list();
        setJobs(jobList);
        if (jobList.length > 0) {
          setSelectedJobId(jobList[0].id);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to fetch active positions.');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    if (!selectedJobId || !user?.profile_id) return;

    const fetchGap = async () => {
      setAnalyzing(true);
      setErrorMessage('');
      try {
        const data = await skillGapApi.getGap(user.profile_id!, selectedJobId);
        setGapData(data);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to calculate skill gap.');
      } finally {
        setAnalyzing(false);
      }
    };

    fetchGap();
  }, [selectedJobId, user?.profile_id]);

  if (loading) {
    return <LoadingState message="Loading target job positions..." />;
  }

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Comparative Alignment
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Skill Gap Analysis
          </h1>
          <p className="text-xs text-slate-500">
            Compare your profile against real job postings to uncover strengths, transferrable skills, and missing requirements.
          </p>
        </div>

        {selectedJobId && (
          <Link
            to="/candidate/recommendations"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <GraduationCap className="w-4 h-4" />
            <span>View Learning Path</span>
          </Link>
        )}
      </div>

      {errorMessage && (
        <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage('')} />
      )}

      {/* Target Job Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Select Target Job Position
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full">
            <select
              value={selectedJobId || ''}
              onChange={(e) => setSelectedJobId(Number(e.target.value))}
              className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} · {j.company} ({j.location})
                </option>
              ))}
            </select>
          </div>

          {selectedJob && (
            <div className="shrink-0 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>{selectedJob.employment_type}</span>
              <span>·</span>
              <span>Min. {selectedJob.min_experience_years} yrs exp</span>
            </div>
          )}
        </div>
      </div>

      {analyzing ? (
        <LoadingState message="Computing skill gap against role requirements..." />
      ) : gapData ? (
        <div className="space-y-8">
          {/* Readiness Summary Banner */}
          <div className="p-6 bg-linear-to-r from-slate-900 to-indigo-950 rounded-2xl text-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                Readiness Evaluation
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5">
                {gapData.readiness_level}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Calculated match score of <span className="font-bold text-white">{Math.round(gapData.overall_match_percentage)}%</span> against {gapData.job_title} requirements.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/10 px-5 py-3 rounded-xl border border-white/10">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-300 block">Overall Alignment</span>
                <span className="text-2xl font-extrabold text-white">{Math.round(gapData.overall_match_percentage)}%</span>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-indigo-400 border-t-emerald-400 flex items-center justify-center font-bold text-xs">
                {Math.round(gapData.overall_match_percentage)}%
              </div>
            </div>
          </div>

          {/* Three Column Breakdown: Strong, Partial, Missing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Strong Skills Possessed */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider pb-3 border-b border-slate-100 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Strong Matches ({gapData.strong_skills.length})</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Requirements fully validated on your resume.
                </p>
                <div className="flex flex-wrap gap-2">
                  {gapData.strong_skills.length > 0 ? (
                    gapData.strong_skills.map((skill, idx) => (
                      <SkillBadge key={idx} name={skill} variant="matched" />
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No direct matching skills found.</p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-emerald-700 font-medium">
                ✓ Full ATS scoring credit awarded
              </div>
            </div>

            {/* 2. Improvement Areas (Partial Transferability) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider pb-3 border-b border-slate-100 mb-4">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Transferable / Partial ({gapData.improvement_areas.length})</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Related technologies providing partial credit.
                </p>
                <div className="space-y-2.5">
                  {gapData.improvement_areas.length > 0 ? (
                    gapData.improvement_areas.map((part, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-xs">
                        <div className="flex items-center justify-between font-bold text-amber-900 mb-1">
                          <span>{part.required}</span>
                          <span className="text-[10px] text-amber-700 font-normal">from {part.possessed}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{part.similarity_note}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No partial transfers identified.</p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-amber-700 font-medium">
                ⚡ Rapid ramp-up potential
              </div>
            </div>

            {/* 3. Missing Skills */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider pb-3 border-b border-slate-100 mb-4">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>Missing Requirements ({gapData.missing_skills.length})</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Required skills not detected in your profile.
                </p>
                <div className="flex flex-wrap gap-2">
                  {gapData.missing_skills.length > 0 ? (
                    gapData.missing_skills.map((skill, idx) => (
                      <SkillBadge key={idx} name={skill} variant="missing" />
                    ))
                  ) : (
                    <p className="text-xs text-emerald-600 font-bold">100% of required skills present!</p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  to="/candidate/recommendations"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <span>Get Course Recommendations</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
};
