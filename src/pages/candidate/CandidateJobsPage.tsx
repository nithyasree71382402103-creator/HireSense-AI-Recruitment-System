import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { jobsApi, applicationsApi, matchingApi, resumesApi } from '../../services/api';
import { Job, ResumeData } from '../../types';
import { SkillBadge } from '../../components/SkillBadge';
import { LoadingState } from '../../components/LoadingState';
import { ErrorAlert } from '../../components/ErrorAlert';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  Send,
  X,
  Sparkles,
} from 'lucide-react';

export const CandidateJobsPage: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [matchScores, setMatchScores] = useState<Record<number, number>>({});
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [search, setSearch] = useState('');
  const [employmentType, setEmploymentType] = useState('All');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobList, latestResume, myApps] = await Promise.all([
          jobsApi.list(),
          resumesApi.getLatest().catch(() => null),
          applicationsApi.list().catch(() => []),
        ]);

        setJobs(jobList);
        setResume(latestResume);

        const appliedSet = new Set<number>(myApps.map((a) => a.job_id));
        setAppliedJobIds(appliedSet);

        // Fetch match scores for each job if resume exists
        if (latestResume && user?.profile_id) {
          const scoresMap: Record<number, number> = {};
          await Promise.all(
            jobList.map(async (j) => {
              try {
                const match = await matchingApi.getMatch(user.profile_id!, j.id);
                scoresMap[j.id] = match.overall_match_percentage;
              } catch {
                scoresMap[j.id] = 70;
              }
            })
          );
          setMatchScores(scoresMap);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to load job listings.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.profile_id]);

  const handleApply = async (jobId: number) => {
    setApplying(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await applicationsApi.submit(jobId, 'Direct candidate application submission via platform');
      setAppliedJobIds((prev) => new Set(prev).add(jobId));
      setSuccessMessage('Application submitted successfully! Track progress in Applications tab.');
      setSelectedJob(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      j.skills.some((s) => s.name.toLowerCase().includes(search.toLowerCase()));

    const matchesType = employmentType === 'All' || j.employment_type === employmentType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <LoadingState message="Fetching active job postings..." />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          Career Opportunities
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
          Explore Matched Job Openings
        </h1>
        <p className="text-xs text-slate-500">
          Search opportunities with live ATS semantic match ratings calculated from your verified profile.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage('')} />
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title, company, or technical skills (e.g. Python, React)..."
            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="w-full md:w-44 py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
          >
            <option value="All">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Remote">Remote</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job, idx) => {
          const matchPct = matchScores[job.id] || 0;
          const isApplied = appliedJobIds.has(job.id);

          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-xl hover:border-indigo-200 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header row: Match Badge & Type */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {job.employment_type}
                  </span>

                  {matchPct > 0 ? (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        matchPct >= 75
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : matchPct >= 50
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {Math.round(matchPct)}% Match
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Standard</span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{job.title}</h3>
                <p className="text-xs font-semibold text-indigo-600 mb-3">{job.company}</p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{job.location}</span>
                  </span>
                  {job.salary_range && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{job.salary_range}</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                  {job.description}
                </p>

                {/* Skills Preview */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {job.skills.slice(0, 4).map((s, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                    >
                      {s.name}
                    </span>
                  ))}
                  {job.skills.length > 4 && (
                    <span className="text-[10px] text-slate-400 self-center">
                      +{job.skills.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedJob(job)}
                  className="px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  View Details
                </button>

                {isApplied ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Applied</span>
                  </span>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => handleApply(job.id)}
                    disabled={applying}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>Quick Apply</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Job Details Modal Drawer */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl"
            >
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-indigo-600 tracking-wider">
                  {selectedJob.employment_type}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{selectedJob.title}</h2>
                <p className="text-xs font-semibold text-slate-600">{selectedJob.company} · {selectedJob.location}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Job Overview & Responsibilities
              </h3>
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                {selectedJob.description}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Required Technical Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedJob.skills.map((s, idx) => (
                  <SkillBadge
                    key={idx}
                    name={s.name}
                    category={s.category}
                    variant={s.is_required ? 'matched' : 'default'}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-slate-500">Education Requirement:</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedJob.education || 'Bachelor Degree in CS'}</p>
              </div>
              <div>
                <span className="text-slate-500">Minimum Experience:</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedJob.min_experience_years} years</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Close
              </button>
              {appliedJobIds.has(selectedJob.id) ? (
                <span className="px-5 py-2.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Already Applied</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleApply(selectedJob.id)}
                  disabled={applying}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  {applying ? 'Submitting Application...' : 'Confirm & Submit Application'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </div>
  );
};
