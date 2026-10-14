import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { matchingApi, jobsApi, candidatesApi } from '../../services/api';
import { CandidateComparisonItem, Job, CandidatePoolItem } from '../../types';
import { LoadingState } from '../../components/LoadingState';
import { ErrorAlert } from '../../components/ErrorAlert';
import {
  GitCompare,
  ShieldCheck,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Award,
  Briefcase,
  Users,
} from 'lucide-react';

export const CandidateComparisonPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const idsParam = searchParams.get('ids');
  const initialJobId = searchParams.get('job_id') ? Number(searchParams.get('job_id')) : undefined;

  const [candidates, setCandidates] = useState<CandidateComparisonItem[]>([]);
  const [allCandidates, setAllCandidates] = useState<CandidatePoolItem[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | undefined>(initialJobId);
  const [disclaimer, setDisclaimer] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobList, poolList] = await Promise.all([
          jobsApi.list(),
          candidatesApi.list(),
        ]);
        setJobs(jobList);
        setAllCandidates(poolList);

        const currentJob = initialJobId || (jobList.length > 0 ? jobList[0].id : undefined);
        setSelectedJobId(currentJob);

        let candidateIds: number[] = [];
        if (idsParam) {
          candidateIds = idsParam.split(',').map((id) => Number(id)).filter(Boolean);
        } else if (poolList.length >= 2) {
          candidateIds = [poolList[0].id, poolList[1].id];
        } else if (poolList.length === 1) {
          candidateIds = [poolList[0].id];
        }

        if (candidateIds.length > 0) {
          const res = await matchingApi.compare(candidateIds, currentJob);
          setCandidates(res.candidates);
          setDisclaimer(res.decision_support_disclaimer);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to compare candidates.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleJobChange = async (newJobId: number) => {
    setSelectedJobId(newJobId);
    if (candidates.length > 0) {
      setLoading(true);
      try {
        const ids = candidates.map((c) => c.candidate_id);
        const res = await matchingApi.compare(ids, newJobId);
        setCandidates(res.candidates);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to refresh candidate comparison.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <LoadingState message="Generating factual candidate comparison matrix..." />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Back button & Header */}
      <div>
        <Link
          to="/recruiter/candidates"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Candidate Pool</span>
        </Link>

        <div>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Objective Evaluation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Candidate Comparison Matrix
          </h1>
          <p className="text-xs text-slate-500">
            Factual side-by-side assessment across validated technical qualifications and experience metrics.
          </p>
        </div>
      </div>

      {errorMessage && (
        <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage('')} />
      )}

      {/* Target Position Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Compare Against Position
          </label>
          <select
            value={selectedJobId || ''}
            onChange={(e) => handleJobChange(Number(e.target.value))}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.company})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Comparing <span className="font-bold text-slate-900">{candidates.length} candidates</span>
        </div>
      </div>

      {/* Critical Decision Support Banner */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200/90 rounded-2xl text-xs text-indigo-950 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Human-in-the-Loop Decision Support: </span>
          <span>
            {disclaimer ||
              'AI provides decision support and objective skill alignment. Final hiring decisions must be made by the recruiter.'}
          </span>
        </div>
      </div>

      {/* Comparison Table */}
      {candidates.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-6 w-48 bg-slate-100/50">Evaluation Metric</th>
                  {candidates.map((cand) => (
                    <th key={cand.candidate_id} className="py-4 px-6 min-w-56 text-slate-900">
                      <div className="font-extrabold text-sm">{cand.name}</div>
                      <div className="text-[11px] text-slate-500 font-normal">{cand.email}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {/* Overall Match % */}
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900 bg-slate-50/50">Role Match Rating</td>
                  {candidates.map((c) => (
                    <td key={c.candidate_id} className="py-4 px-6">
                      <span
                        className={`text-lg font-black ${
                          c.match_percentage >= 75
                            ? 'text-emerald-600'
                            : c.match_percentage >= 50
                            ? 'text-blue-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {Math.round(c.match_percentage)}%
                      </span>
                    </td>
                  ))}
                </tr>

                {/* ATS Score */}
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900 bg-slate-50/50">ATS Score</td>
                  {candidates.map((c) => (
                    <td key={c.candidate_id} className="py-4 px-6 font-bold text-slate-800 text-sm">
                      {Math.round(c.ats_score)}%
                    </td>
                  ))}
                </tr>

                {/* Skills Count */}
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900 bg-slate-50/50">Identified Skills</td>
                  {candidates.map((c) => (
                    <td key={c.candidate_id} className="py-4 px-6 font-semibold">
                      {c.skills_count} skills
                    </td>
                  ))}
                </tr>

                {/* Experience Years */}
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900 bg-slate-50/50">Estimated Experience</td>
                  {candidates.map((c) => (
                    <td key={c.candidate_id} className="py-4 px-6 font-semibold">
                      {c.experience_years} years
                    </td>
                  ))}
                </tr>

                {/* Projects Count */}
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900 bg-slate-50/50">Practical Projects</td>
                  {candidates.map((c) => (
                    <td key={c.candidate_id} className="py-4 px-6 font-semibold">
                      {c.projects_count} projects
                    </td>
                  ))}
                </tr>

                {/* Certifications Count */}
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900 bg-slate-50/50">Certifications</td>
                  {candidates.map((c) => (
                    <td key={c.candidate_id} className="py-4 px-6 font-semibold">
                      {c.certifications_count} verified
                    </td>
                  ))}
                </tr>

                {/* Matched Skills List */}
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900 bg-slate-50/50 align-top">Matched Skills</td>
                  {candidates.map((c) => (
                    <td key={c.candidate_id} className="py-4 px-6 align-top">
                      <div className="flex flex-wrap gap-1">
                        {c.matched_skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold"
                          >
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Missing Skills List */}
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900 bg-slate-50/50 align-top">Missing Requirements</td>
                  {candidates.map((c) => (
                    <td key={c.candidate_id} className="py-4 px-6 align-top">
                      <div className="flex flex-wrap gap-1">
                        {c.missing_skills.length > 0 ? (
                          c.missing_skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-semibold"
                            >
                              ⚠ {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold">None</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Current Pipeline Status */}
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900 bg-slate-50/50">Pipeline Stage</td>
                  {candidates.map((c) => (
                    <td key={c.candidate_id} className="py-4 px-6">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {c.status}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Action Row */}
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900 bg-slate-50/50">Actions</td>
                  {candidates.map((c) => (
                    <td key={c.candidate_id} className="py-4 px-6">
                      <Link
                        to={`/recruiter/candidates/${c.candidate_id}${selectedJobId ? `?job_id=${selectedJobId}` : ''}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-lg transition-colors"
                      >
                        <span>View Profile</span>
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">No Candidates Selected</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Go to Candidate Pool to select candidates for side-by-side evaluation.
          </p>
          <Link
            to="/recruiter/candidates"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <span>Browse Candidate Pool</span>
          </Link>
        </div>
      )}
    </div>
  );
};
