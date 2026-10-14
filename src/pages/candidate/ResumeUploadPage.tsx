import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumesApi } from '../../services/api';
import { ResumeData } from '../../types';
import { ErrorAlert } from '../../components/ErrorAlert';
import { motion, AnimatePresence } from 'motion/react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  FileCode,
} from 'lucide-react';

export const ResumeUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedResume, setUploadedResume] = useState<ResumeData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMessage(`Unsupported file format '.${ext}'. Please upload a PDF, DOCX, or TXT file.`);
      return false;
    }
    if (file.size > MAX_SIZE) {
      setErrorMessage('File size exceeds the 10MB limit. Please upload a smaller file.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(20);
    setErrorMessage('');

    try {
      // Progress simulation
      const interval = setInterval(() => {
        setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 200);

      const resume = await resumesApi.upload(selectedFile);
      clearInterval(interval);
      setUploadProgress(100);
      setUploadedResume(resume);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse resume. Please verify the file and retry.');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSample = async () => {
    // Create realistic sample text resume file
    const sampleText = `
Alex Rivera
Software Engineer | Full Stack & Cloud Developer
Email: alex.rivera@example.com | Phone: (555) 234-5678 | Austin, TX
LinkedIn: https://linkedin.com/in/alexrivera-dev | GitHub: https://github.com/alexrivera-dev

PROFESSIONAL SUMMARY
Results-driven Software Engineer with 3+ years of experience designing scalable REST APIs, microservices, and reactive web applications using Python, React, PostgreSQL, and FastAPI.

TECHNICAL SKILLS
Programming Languages: Python, JavaScript, TypeScript, SQL, HTML, CSS
Frameworks & Libraries: React, FastAPI, Next.js, Tailwind CSS, Express
Databases: PostgreSQL, MySQL, Redis, MongoDB
DevOps & Tools: Docker, Git, CI/CD, Linux, AWS

EXPERIENCE
Software Engineer | TechPulse Labs (2023 - Present)
- Engineered high-throughput backend services in Python and FastAPI, increasing API throughput by 35%.
- Built responsive client dashboards using React, TypeScript, and Tailwind CSS.
- Optimized database query indexes in PostgreSQL, reducing average query latency by 45%.

Full Stack Developer Intern | NexGen Innovations (2022 - 2023)
- Developed customer-facing web components and automated test suites.
- Integrated REST APIs and managed version control workflows using Git.

EDUCATION
Bachelor of Science in Computer Science | University of Texas at Austin (2019 - 2023)
GPA: 3.85 / 4.0

KEY PROJECTS
HireSense AI Recruitment Engine: Full stack recruitment platform featuring automated skill extraction and explainable ATS analysis using Python, React, and PostgreSQL.
Distributed Task Scheduler: Asynchronous job queue built with Redis and Docker containers.

CERTIFICATIONS
AWS Certified Solutions Architect Associate (2024)
    `;

    const blob = new Blob([sampleText], { type: 'text/plain' });
    const file = new File([blob], 'Alex_Rivera_Software_Engineer_Resume.txt', { type: 'text/plain' });
    setSelectedFile(file);
    setErrorMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Upload Resume</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload your latest resume for AI skill extraction, structured profile parsing, and ATS score generation.
        </p>
      </div>

      {errorMessage && (
        <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage('')} />
      )}

      {/* Main Upload Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        {!uploadedResume ? (
          <div>
            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-indigo-600 bg-indigo-50/50'
                  : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h2 className="text-base font-bold text-slate-900 mb-1">
                Drag and drop your resume file here
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Supported formats: <span className="font-semibold text-slate-700">PDF, DOCX, TXT</span> (Max 10MB)
              </p>

              <button
                type="button"
                className="px-4 py-2 bg-white text-indigo-600 border border-slate-200 hover:border-indigo-300 text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Browse File
              </button>
            </div>

            {/* Selected File Details */}
            {selectedFile && (
              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB · Ready to parse
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {uploading ? 'Processing AI Parser...' : 'Upload & Parse Resume'}
                </button>
              </div>
            )}

            {/* Upload Progress Bar & Interactive Scanning HUD */}
            {uploading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-4 p-5 rounded-2xl bg-slate-900 text-white border border-indigo-500/30 shadow-xl relative overflow-hidden"
              >
                {/* Animated Laser Scanning Beam */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] pointer-events-none animate-scan-beam" />

                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                    </span>
                    <span className="text-cyan-300 font-mono tracking-wider uppercase text-[11px]">
                      AI Resume Scanner Active
                    </span>
                  </div>
                  <span className="font-mono font-bold text-cyan-400 text-sm">{uploadProgress}%</span>
                </div>

                {/* Animated Progress Track with Shimmer */}
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-400 rounded-full relative"
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <div className="absolute inset-0 animate-shimmer" />
                  </motion.div>
                </div>

                {/* Live Scanning Step Milestones */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1 font-mono">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${uploadProgress >= 20 ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className={uploadProgress >= 20 ? 'text-slate-100 font-medium' : 'text-slate-500'}>
                      1. Extract text & metadata
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${uploadProgress >= 40 ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className={uploadProgress >= 40 ? 'text-slate-100 font-medium' : 'text-slate-500'}>
                      2. Segment experience & education
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${uploadProgress >= 65 ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className={uploadProgress >= 65 ? 'text-slate-100 font-medium' : 'text-slate-500'}>
                      3. Extract programming skills & tools
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${uploadProgress >= 85 ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className={uploadProgress >= 85 ? 'text-slate-100 font-medium' : 'text-slate-500'}>
                      4. Formulate multi-factor ATS score
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Demo Sample Helper */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Don't have a resume file on hand?</span>
              <button
                type="button"
                onClick={handleLoadSample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Senior Full Stack Resume</span>
              </button>
            </div>
          </div>
        ) : (
          /* Success State */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="text-center py-6 space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', damping: 12 }}
              className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center shadow-xs"
            >
              <CheckCircle2 className="w-8 h-8" />
            </motion.div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold mb-2 shadow-2xs">
                Parsing Complete
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Resume Uploaded Successfully!
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Extracted personal contact information, {uploadedResume.skills.length} skills, education records, and computed an ATS compatibility rating of {Math.round(uploadedResume.ats_score)}%.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/candidate/resume-analysis')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Analyze Resume in AI Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadedResume(null);
                  setSelectedFile(null);
                }}
                className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Upload Another Resume
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
