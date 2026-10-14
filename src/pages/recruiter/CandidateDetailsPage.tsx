import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { candidatesApi, applicationsApi, jobsApi } from '../../services/api';
import { Job, PipelineStage } from '../../types';
import { ScoreMeter } from '../../components/ScoreMeter';
import { SkillBadge } from '../../components/SkillBadge';
import { LoadingState } from '../../components/LoadingState';
import { ErrorAlert } from '../../components/ErrorAlert';
import {
  User,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';

export const CandidateDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get('job_id') ? Number(searchParams.get('job_id')) : undefined;

  const [candidate, setCandidate] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | undefined>(initialJobId);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [successNote, setSuccessNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const PIPELINE_STAGES: PipelineStage[] = [
    'Applied',
    'Resume Analyzed',
    'Under Review',
    'Shortlisted',
    'Interview',
    'Selected',
    'Rejected',
  ];

  const fetchDetails = async () => {
    if (!id) return;
    try {
      const [candData, jobList] = await Promise.all([
        candidatesApi.getById(Number(id), selectedJobId),
        jobsApi.list(),
      ]);
      setCandidate(candData);
      setJobs(jobList);
      if (!selectedJobId && jobList.length > 0) {
        setSelectedJobId(jobList[0].id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to load candidate details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, selectedJobId]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!candidate?.applications?.[0]?.id) {
      setErrorMessage('No active application found to update stage.');
      return;
    }

    setStatusUpdating(true);
    setErrorMessage('');
    setSuccessNote('');

    try {
      const appId = candidate.applications[0].id;
      await applicationsApi.updateStatus(appId, newStatus, `Stage updated to ${newStatus} by recruiter.`);
      setSuccessNote(`Candidate application status updated to: ${newStatus}`);
      fetchDetails();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update pipeline stage.');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return <LoadingState message="Retrieving full candidate dossier & AI scores..." />;
  }

  if (!candidate) return null;

  const resume = candidate.resume;
  const match = candidate.job_match;
  const currentApp = candidate.applications?.[0];

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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {candidate.full_name}
            </h1>
            <p className="text-xs text-slate-500">
              {candidate.email} · {candidate.location || 'Location Not Specified'} · Profile ID: #{candidate.id}
            </p>
          </div>

          {/* Quick Stage Controls */}
          {currentApp && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleUpdateStatus('Shortlisted')}
                disabled={statusUpdating}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Shortlist</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('Rejected')}
                disabled={statusUpdating}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {successNote && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold flex items-center justify-between">
          <span>{successNote}</span>
          <button onClick={() => setSuccessNote('')} className="text-emerald-600">×</button>
        </div>
      )}

      {errorMessage && (
        <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage('')} />
      )}

      {/* Target Job Selector & Current Status Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Evaluate Against Position
          </label>
          <select
            value={selectedJobId || ''}
            onChange={(e) => setSelectedJobId(Number(e.target.value))}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.company})
              </option>
            ))}
          </select>
        </div>

        {currentApp && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-semibold">Pipeline Stage:</span>
            <select
              value={currentApp.status}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              disabled={statusUpdating}
              className="py-2 px-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              {PIPELINE_STAGES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Top ATS & Job Match Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ATS Score Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center gap-6">
          <div className="shrink-0">
            <ScoreMeter score={resume?.ats_score || 0} size={140} strokeWidth={12} subtitle="ATS Rating" />
          </div>
          <div className="text-xs space-y-2">
            <h3 className="text-sm font-bold text-slate-900">ATS Verification</h3>
            <p className="text-slate-600">
              Evaluated across skill taxonomy, quantified responsibilities, and accredited credentials.
            </p>
            <p className="font-semibold text-indigo-600">
              Profile Completeness: {resume?.completeness_score || 0}%
            </p>
          </div>
        </div>

        {/* Semantic Job Match Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center gap-6">
          <div className="shrink-0">
            <ScoreMeter
              score={match?.overall_match_percentage || 0}
              size={140}
              strokeWidth={12}
              subtitle="Job Match"
            />
          </div>
          <div className="text-xs space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Semantic Job Alignment</h3>
            <p className="text-slate-600">
              Direct match credit + partial credit for adjacent competencies (e.g., JS → TS, SQL → PostgreSQL).
            </p>
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 font-bold">{match?.matched_skills?.length || 0} Matched</span>
              <span>·</span>
              <span className="text-amber-700 font-bold">{match?.partial_skills?.length || 0} Partial</span>
              <span>·</span>
              <span className="text-rose-700 font-bold">{match?.missing_skills?.length || 0} Missing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Support Disclaimer */}
      <div className="p-3.5 bg-slate-100 rounded-xl text-xs text-slate-600 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
        <span className="font-medium">
          AI provides decision support and objective skill alignment. Final hiring determinations must be made by the recruiter.
        </span>
      </div>

      {/* Skills Breakdown */}
      {resume && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Verified Candidate Skills ({resume.skills.length})</h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((s: any, idx: number) => {
              const isDirectMatch = match?.matched_skills?.includes(s.name);
              return (
                <SkillBadge
                  key={idx}
                  name={s.name}
                  category={s.category}
                  variant={isDirectMatch ? 'matched' : 'default'}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Experience, Education & Projects */}
      {resume && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Experience */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider mb-4">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>Experience ({resume.experience?.length || 0})</span>
            </div>
            <div className="space-y-4">
              {resume.experience?.map((exp: any, idx: number) => (
                <div key={idx} className="border-l-2 border-indigo-200 pl-3 py-0.5 text-xs">
                  <p className="font-bold text-slate-900">{exp.role}</p>
                  <p className="text-slate-600 font-medium">{exp.company} · {exp.duration}</p>
                  <p className="text-slate-500 mt-1 leading-relaxed">{exp.responsibilities}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider mb-4">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>Education ({resume.education?.length || 0})</span>
            </div>
            <div className="space-y-4">
              {resume.education?.map((edu: any, idx: number) => (
                <div key={idx} className="border-l-2 border-emerald-200 pl-3 py-0.5 text-xs">
                  <p className="font-bold text-slate-900">{edu.degree}</p>
                  <p className="text-slate-600 font-medium">{edu.university}</p>
                  <p className="text-slate-500 mt-0.5">Year: {edu.graduation_year} {edu.gpa ? `· GPA: ${edu.gpa}` : ''}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider mb-4">
              <FolderGit2 className="w-4 h-4 text-purple-600" />
              <span>Projects ({resume.projects?.length || 0})</span>
            </div>
            <div className="space-y-4">
              {resume.projects?.map((proj: any, idx: number) => (
                <div key={idx} className="border-l-2 border-purple-200 pl-3 py-0.5 text-xs">
                  <p className="font-bold text-slate-900">{proj.name}</p>
                  <p className="text-slate-500 mt-1">{proj.description}</p>
                  <p className="text-[11px] text-indigo-600 font-semibold mt-1">{proj.technologies}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
