import React, { useState, useEffect } from 'react';
import { applicationsApi, jobsApi } from '../../services/api';
import { Application, Job, PipelineStage } from '../../types';
import { LoadingState } from '../../components/LoadingState';
import { ErrorAlert } from '../../components/ErrorAlert';
import {
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Users,
} from 'lucide-react';

export const RecruiterPipelinePage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const PIPELINE_COLUMNS: PipelineStage[] = [
    'Applied',
    'Resume Analyzed',
    'Under Review',
    'Shortlisted',
    'Interview',
    'Selected',
    'Rejected',
  ];

  const fetchPipeline = async () => {
    try {
      const [apps, jobList] = await Promise.all([
        applicationsApi.list({ job_id: selectedJobId ? Number(selectedJobId) : undefined }),
        jobsApi.list(),
      ]);
      setApplications(apps);
      setJobs(jobList);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to load hiring pipeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, [selectedJobId]);

  const handleMoveStage = async (appId: number, targetStage: PipelineStage) => {
    setUpdatingId(appId);
    setErrorMessage('');
    try {
      await applicationsApi.updateStatus(appId, targetStage, `Moved to ${targetStage} via pipeline Kanban board.`);
      fetchPipeline();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update pipeline stage.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <LoadingState message="Loading candidate application pipeline..." />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Applicant Tracking System
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Recruitment Hiring Pipeline
          </h1>
          <p className="text-xs text-slate-500">
            Track candidates across hiring stages from initial application to final offer selection.
          </p>
        </div>

        {/* Job Filter */}
        <div className="w-full sm:w-72">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer shadow-xs"
          >
            <option value="">All Requisitions ({jobs.length})</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.company})
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMessage && (
        <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage('')} />
      )}

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-4 min-w-[1200px]">
          {PIPELINE_COLUMNS.map((stage) => {
            const stageApps = applications.filter((a) => a.status === stage);
            const stageIdx = PIPELINE_COLUMNS.indexOf(stage);

            return (
              <div
                key={stage}
                className="w-80 shrink-0 bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        stage === 'Selected'
                          ? 'bg-emerald-500'
                          : stage === 'Rejected'
                          ? 'bg-rose-500'
                          : stage === 'Shortlisted'
                          ? 'bg-indigo-600'
                          : 'bg-slate-400'
                      }`}
                    />
                    <h2 className="text-xs font-extrabold text-slate-900 tracking-tight">{stage}</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
                    {stageApps.length}
                  </span>
                </div>

                {/* Candidate Cards in Column */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-1">
                  {stageApps.length > 0 ? (
                    stageApps.map((app) => (
                      <div
                        key={app.id}
                        className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-shadow text-xs space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 text-xs">{app.candidate_name}</h3>
                            <p className="text-[11px] text-slate-500 truncate max-w-44">{app.job_title}</p>
                          </div>
                          <span className="font-extrabold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {Math.round(app.match_score)}%
                          </span>
                        </div>

                        {app.notes && (
                          <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg italic line-clamp-2">
                            "{app.notes}"
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          <span>Updated: {app.status_updated_at ? new Date(app.status_updated_at).toLocaleDateString() : 'Recent'}</span>
                        </div>

                        {/* Move Buttons */}
                        <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100">
                          {stageIdx > 0 && stage !== 'Rejected' ? (
                            <button
                              type="button"
                              onClick={() => handleMoveStage(app.id, PIPELINE_COLUMNS[stageIdx - 1])}
                              disabled={updatingId === app.id}
                              title="Move to previous stage"
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div />
                          )}

                          <div className="flex items-center gap-1">
                            {stage !== 'Rejected' && (
                              <button
                                type="button"
                                onClick={() => handleMoveStage(app.id, 'Rejected')}
                                disabled={updatingId === app.id}
                                className="px-2 py-1 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              >
                                Reject
                              </button>
                            )}

                            {stageIdx < PIPELINE_COLUMNS.length - 2 && stage !== 'Rejected' && (
                              <button
                                type="button"
                                onClick={() => handleMoveStage(app.id, PIPELINE_COLUMNS[stageIdx + 1])}
                                disabled={updatingId === app.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                              >
                                <span>Advance</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-xs italic">
                      No candidates in {stage}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
