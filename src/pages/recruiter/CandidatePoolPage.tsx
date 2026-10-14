import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { candidatesApi, jobsApi, applicationsApi } from '../../services/api';
import { CandidatePoolItem, Job } from '../../types';
import { SkillBadge } from '../../components/SkillBadge';
import { LoadingState } from '../../components/LoadingState';
import { ErrorAlert } from '../../components/ErrorAlert';
import {
  Users,
  Search,
  Filter,
  GitCompare,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  Check,
} from 'lucide-react';

export const CandidatePoolPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [candidates, setCandidates] = useState<CandidatePoolItem[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(searchParams.get('job_id') || '');
  const [minMatch, setMinMatch] = useState<string>('');
  const [skillFilter, setSkillFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const [candList, jobList] = await Promise.all([
        candidatesApi.list({
          job_id: selectedJobId ? Number(selectedJobId) : undefined,
          min_match: minMatch ? Number(minMatch) : undefined,
          skill_filter: skillFilter || undefined,
          status_filter: statusFilter,
        }),
        jobsApi.list(),
      ]);
      setCandidates(candList);
      setJobs(jobList);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to load candidate pool.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [selectedJobId, minMatch, skillFilter, statusFilter]);

  const handleToggleSelect = (id: number) => {
    const updated = new Set(selectedCandidates);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedCandidates(updated);
  };

  const handleCompareSelected = () => {
    if (selectedCandidates.size < 2) {
      setErrorMessage('Please select at least 2 candidates to compare side-by-side.');
      return;
    }
    const ids = Array.from(selectedCandidates).join(',');
    navigate(`/recruiter/compare?ids=${ids}${selectedJobId ? `&job_id=${selectedJobId}` : ''}`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Talent Discovery & Ranking
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Candidate Talent Pool
          </h1>
          <p className="text-xs text-slate-500">
            Ranked candidate profiles with explainable ATS ratings and semantic job-matching criteria.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCompareSelected}
            disabled={selectedCandidates.size < 2}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-40"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare Selected ({selectedCandidates.size})</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="text-emerald-600">×</button>
        </div>
      )}

      {errorMessage && (
        <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage('')} />
      )}

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
            Target Job Opening
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              setSearchParams(e.target.value ? { job_id: e.target.value } : {});
            }}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
          >
            <option value="">All Job Positions</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.company})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
            Min. Match %
          </label>
          <select
            value={minMatch}
            onChange={(e) => setMinMatch(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
          >
            <option value="">Any Match Percentage</option>
            <option value="80">80% and above (High Match)</option>
            <option value="60">60% and above (Moderate Match)</option>
            <option value="40">40% and above</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
            Technical Skill Filter
          </label>
          <input
            type="text"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            placeholder="e.g. Python, Docker, React"
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
            Pipeline Stage
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
          >
            <option value="All">All Stages</option>
            <option value="Applied">Applied</option>
            <option value="Resume Analyzed">Resume Analyzed</option>
            <option value="Under Review">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interview">Interview</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Ethics Disclaimer */}
      <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
        <span>
          AI provides decision support and objective technical alignment. Final hiring determinations must be made by the recruiter.
        </span>
      </div>

      {/* Candidates Table */}
      {loading ? (
        <LoadingState message="Ranking candidate pool..." />
      ) : candidates.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 w-12 text-center">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="py-3.5 px-4">Candidate Name</th>
                  <th className="py-3.5 px-4">Applied Job</th>
                  <th className="py-3.5 px-4">Match %</th>
                  <th className="py-3.5 px-4">ATS Score</th>
                  <th className="py-3.5 px-4">Top Skills</th>
                  <th className="py-3.5 px-4">Pipeline Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {candidates.map((cand) => {
                  const isChecked = selectedCandidates.has(cand.id);

                  return (
                    <tr
                      key={cand.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(cand.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{cand.full_name}</div>
                        <div className="text-[11px] text-slate-500">{cand.email}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">{cand.job_title}</td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-extrabold text-sm ${
                            cand.match_percentage >= 75
                              ? 'text-emerald-600'
                              : cand.match_percentage >= 50
                              ? 'text-blue-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {Math.round(cand.match_percentage)}%
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-700">
                        {Math.round(cand.ats_score)}%
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {cand.top_skills.slice(0, 3).map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {cand.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/recruiter/candidates/${cand.id}${selectedJobId ? `?job_id=${selectedJobId}` : ''}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">No Candidates Found</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Try adjusting your skill, job, or minimum match filters to expand results.
          </p>
        </div>
      )}
    </div>
  );
};
