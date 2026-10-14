import React, { useState, useEffect } from 'react';
import { applicationsApi } from '../../services/api';
import { Application, PipelineStage } from '../../types';
import { LoadingState } from '../../components/LoadingState';
import { ErrorAlert } from '../../components/ErrorAlert';
import {
  Layers,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Briefcase,
  ChevronRight,
} from 'lucide-react';

export const CandidateApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const PIPELINE_ORDER: PipelineStage[] = [
    'Applied',
    'Resume Analyzed',
    'Under Review',
    'Shortlisted',
    'Interview',
    'Selected',
  ];

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const data = await applicationsApi.list();
        setApplications(data);
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to retrieve applications.');
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  if (loading) {
    return <LoadingState message="Loading your submitted candidacies..." />;
  }

  const getStageIndex = (stage: string) => {
    if (stage === 'Rejected') return -1;
    return PIPELINE_ORDER.indexOf(stage as PipelineStage);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          Application Tracking
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
          My Active Job Applications
        </h1>
        <p className="text-xs text-slate-500">
          Track stage progression, recruiter review status, and semantic compatibility ratings in real time.
        </p>
      </div>

      {errorMessage && (
        <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage('')} />
      )}

      {applications.length > 0 ? (
        <div className="space-y-6">
          {applications.map((app) => {
            const currentIdx = getStageIndex(app.status);
            const isRejected = app.status === 'Rejected';

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6"
              >
                {/* Top Info Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{app.job_title}</h2>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="font-semibold text-indigo-600">{app.job_company}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Applied on {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recent'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Match Rating</span>
                      <span className="text-sm font-extrabold text-indigo-600">
                        {Math.round(app.match_score)}%
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        isRejected
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : app.status === 'Selected'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                </div>

                {/* Pipeline Progression Timeline Bar */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Current Hiring Pipeline Stage
                  </h3>

                  {isRejected ? (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                      Position status updated: Application not moving forward at this time.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {PIPELINE_ORDER.map((stageName, idx) => {
                        const isCompleted = currentIdx >= idx;
                        const isCurrent = currentIdx === idx;

                        return (
                          <div
                            key={stageName}
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              isCurrent
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : isCompleted
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            <span className="text-[10px] uppercase font-bold block mb-0.5 opacity-80">
                              Step {idx + 1}
                            </span>
                            <span className="text-xs font-bold block truncate">{stageName}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recruiter Notes / Timestamp details */}
                {app.notes && (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Recruiter Status Note: </span>
                    <span>{app.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">No Applications Submitted</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            You haven't submitted any applications yet. Browse the job portal to match your skills and apply!
          </p>
        </div>
      )}
    </div>
  );
};
