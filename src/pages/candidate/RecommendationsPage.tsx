import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { jobsApi, recommendationsApi } from '../../services/api';
import { Job, RecommendationItem } from '../../types';
import { LoadingState } from '../../components/LoadingState';
import { ErrorAlert } from '../../components/ErrorAlert';
import {
  GraduationCap,
  ExternalLink,
  ShieldCheck,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

export const RecommendationsPage: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [disclaimer, setDisclaimer] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchingRecs, setFetchingRecs] = useState(false);
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
        setErrorMessage(err.message || 'Unable to fetch positions.');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    if (!selectedJobId || !user?.profile_id) return;

    const fetchRecs = async () => {
      setFetchingRecs(true);
      setErrorMessage('');
      try {
        const res = await recommendationsApi.getForJob(user.profile_id!, selectedJobId);
        setRecommendations(res.recommendations);
        setDisclaimer(res.disclaimer);
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to retrieve course recommendations.');
      } finally {
        setFetchingRecs(false);
      }
    };

    fetchRecs();
  }, [selectedJobId, user?.profile_id]);

  if (loading) {
    return <LoadingState message="Loading career learning pathways..." />;
  }

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          Targeted Upskilling Engine
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
          Course & Certification Recommendations
        </h1>
        <p className="text-xs text-slate-500">
          Personalized curriculum curated specifically from the missing technical skills discovered during your job match analysis.
        </p>
      </div>

      {errorMessage && (
        <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage('')} />
      )}

      {/* Target Job Position Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Target Job for Learning Pathway
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
              <span>{selectedJob.company}</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Ethics & Transparency Disclaimer Banner */}
      <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Transparent Learning Disclaimer: </span>
          <span>
            {disclaimer ||
              'AI provides decision support and upskilling guidance. Completing recommended courses enhances technical competence but does not guarantee employment or interview selection.'}
          </span>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      {fetchingRecs ? (
        <LoadingState message="Curating personalized learning resources..." />
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Header row: Order & Priority */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                      {rec.learning_order}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Suggested Order</span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      rec.priority === 'High'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : rec.priority === 'Medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {rec.priority} Priority
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{rec.course_name}</h3>
                
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <span className="font-semibold text-indigo-600">Target Skill: {rec.skill_name}</span>
                  <span>·</span>
                  <span>{rec.platform}</span>
                  <span>·</span>
                  <span className="font-medium text-slate-700">{rec.difficulty}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 mb-4">
                  <span className="font-bold text-slate-700 block mb-0.5">Why this resource?</span>
                  <p>{rec.reason}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Self-paced credential</span>
                {rec.url ? (
                  <a
                    href={rec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    <span>Explore Course</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">Curriculum catalog</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Zero Skill Deficiencies Detected!</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Your resume already satisfies all technical requirements for this position. You are in prime alignment for application submission!
          </p>
        </div>
      )}
    </div>
  );
};
