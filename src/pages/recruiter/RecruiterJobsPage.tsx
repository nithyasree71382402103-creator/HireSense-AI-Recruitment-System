import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi, resumesApi } from '../../services/api';
import { Job } from '../../types';
import { LoadingState } from '../../components/LoadingState';
import { ErrorAlert } from '../../components/ErrorAlert';
import {
  Briefcase,
  PlusCircle,
  Users,
  UploadCloud,
  MapPin,
  Clock,
  DollarSign,
  X,
  CheckCircle2,
} from 'lucide-react';

export const RecruiterJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchModalJob, setBatchModalJob] = useState<Job | null>(null);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [uploadingBatch, setUploadingBatch] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchJobs = async () => {
    try {
      const data = await jobsApi.list();
      setJobs(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to retrieve job postings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleBatchFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setBatchFiles(Array.from(e.target.files));
    }
  };

  const handleBatchUpload = async () => {
    if (!batchModalJob || batchFiles.length === 0) return;
    setUploadingBatch(true);
    setErrorMessage('');
    try {
      const res = await resumesApi.batchUpload(batchModalJob.id, batchFiles);
      setBatchResult(res);
      fetchJobs();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to batch ingest candidate resumes.');
    } finally {
      setUploadingBatch(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading requisition records..." />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Requisition Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Active Job Postings
          </h1>
          <p className="text-xs text-slate-500">
            Publish requirements, ingest candidate resumes, and evaluate applicant match scores.
          </p>
        </div>

        <Link
          to="/recruiter/jobs/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Job Requisition</span>
        </Link>
      </div>

      {errorMessage && (
        <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage('')} />
      )}

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  {job.employment_type}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Users className="w-3 h-3" />
                  <span>{job.application_count} Applicants</span>
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1">{job.title}</h3>
              <p className="text-xs font-semibold text-slate-500 mb-3">{job.company}</p>

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

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {job.skills.slice(0, 4).map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                to={`/recruiter/candidates?job_id=${job.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <span>View Candidates</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setBatchModalJob(job);
                  setBatchFiles([]);
                  setBatchResult(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Batch Upload</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Multiple Resume Upload Modal */}
      {batchModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-indigo-600 tracking-wider">
                  Multiple Resume Ingestion
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  Upload Resumes for {batchModalJob.title}
                </h2>
                <p className="text-xs text-slate-500">
                  Select multiple candidate resumes (PDF, DOCX, TXT) to evaluate and rank against this job.
                </p>
              </div>
              <button
                onClick={() => setBatchModalJob(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!batchResult ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50/50">
                  <UploadCloud className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800 mb-1">
                    Select Multiple Resume Files
                  </p>
                  <p className="text-[11px] text-slate-500 mb-4">
                    PDF, DOCX, or TXT format (Hold Ctrl/Cmd to select multiple)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt"
                    onChange={handleBatchFileSelect}
                    className="block mx-auto text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                  />
                </div>

                {batchFiles.length > 0 && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
                    <span className="font-bold">{batchFiles.length} resume(s) selected: </span>
                    <span>{batchFiles.map((f) => f.name).join(', ')}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBatchModalJob(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchUpload}
                    disabled={uploadingBatch || batchFiles.length === 0}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                  >
                    {uploadingBatch ? 'Analyzing All Resumes...' : `Parse & Score ${batchFiles.length} Resumes`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Successfully Analyzed {batchResult.uploaded_count} Resumes</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Calculated ATS compatibility and semantic match percentages for all candidates.
                  </p>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {batchResult.candidates.map((cand: any, idx: number) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{cand.candidate_name}</p>
                        <p className="text-[11px] text-slate-500">{cand.file_name}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-indigo-600 text-sm">{Math.round(cand.match_percentage)}% Match</span>
                        <p className="text-[10px] text-slate-400">ATS: {Math.round(cand.ats_score)}%</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Link
                    to={`/recruiter/candidates?job_id=${batchModalJob.id}`}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    Review Ranked Candidates
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
