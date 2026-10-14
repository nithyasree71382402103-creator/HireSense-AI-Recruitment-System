import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resumesApi } from '../../services/api';
import { ResumeData } from '../../types';
import { ScoreMeter } from '../../components/ScoreMeter';
import { SkillBadge } from '../../components/SkillBadge';
import { LoadingState } from '../../components/LoadingState';
import { ErrorAlert } from '../../components/ErrorAlert';
import { motion } from 'motion/react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  UploadCloud,
  Crosshair,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Award,
  Sparkles,
} from 'lucide-react';

export const ResumeAnalysisPage: React.FC = () => {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchResume = async () => {
    try {
      const data = await resumesApi.getLatest();
      setResume(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to load resume analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResume();
  }, []);

  const handleReanalyze = async () => {
    if (!resume) return;
    setReanalyzing(true);
    setErrorMessage('');
    try {
      const updated = await resumesApi.reanalyze(resume.id);
      setResume(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to re-analyze resume.');
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) {
    return <LoadingState message="Extracting structured intelligence from resume..." />;
  }

  if (!resume) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Resume Analyzed Yet</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Upload your resume to get instant ATS scoring, explainable feedback, and skill classification.
        </p>
        <Link
          to="/candidate/resume"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Resume Now</span>
        </Link>
      </div>
    );
  }

  const breakdown = resume.score_breakdown || {
    skill_match: 0,
    keyword_relevance: 0,
    education: 0,
    experience: 0,
    projects: 0,
    certifications: 0,
    completeness: 0,
  };

  const explanation = resume.score_explanation || {
    positives: [],
    areas_to_improve: [],
    summary: '',
  };

  // Group skills by category
  const skillsByCategory: Record<string, typeof resume.skills> = {};
  resume.skills.forEach((skill) => {
    const cat = skill.category || 'Technical Skills';
    if (!skillsByCategory[cat]) skillsByCategory[cat] = [];
    skillsByCategory[cat].push(skill);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            AI Resume Parser & Scorer
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            ATS Evaluation Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Source: <span className="font-semibold text-slate-700">{resume.file_name}</span> · Last evaluated:{' '}
            {resume.created_at ? new Date(resume.created_at).toLocaleDateString() : 'Recent'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
            <span>{reanalyzing ? 'Re-evaluating...' : 'Re-Analyze Resume'}</span>
          </motion.button>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/candidate/skill-gap"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Compare with Jobs</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {errorMessage && (
        <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage('')} />
      )}

      {/* Top ATS & Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Overall Circular ATS Gauge */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Overall ATS Compatibility
          </span>
          <ScoreMeter score={resume.ats_score} size={200} strokeWidth={16} label="ATS Score" />
          <p className="mt-4 text-xs text-slate-600 max-w-xs leading-relaxed">
            {explanation.summary || 'Computed dynamically across skill keywords, action-oriented experience, education credentials, and project depth.'}
          </p>
        </div>

        {/* Right: Score Breakdown Progress Bars */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Score Breakdown by Category</h2>
            <p className="text-xs text-slate-500 mb-5">Weighted performance across essential resume dimensions</p>

            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-700">Skill Match & Keyword Density</span>
                  <span className="text-slate-900">{breakdown.skill_match}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${breakdown.skill_match}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-700">Keyword Relevance</span>
                  <span className="text-slate-900">{breakdown.keyword_relevance}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${breakdown.keyword_relevance}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-700">Work Experience & Quantified Impact</span>
                  <span className="text-slate-900">{breakdown.experience}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${breakdown.experience}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-700">Education & Academic Credential</span>
                  <span className="text-slate-900">{breakdown.education}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${breakdown.education}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-700">Practical Projects</span>
                  <span className="text-slate-900">{breakdown.projects}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${breakdown.projects}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-700">Certifications</span>
                  <span className="text-slate-900">{breakdown.certifications}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${breakdown.certifications}%` }} />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between font-bold text-slate-900 mb-1">
                  <span>Resume Section Completeness</span>
                  <span>{breakdown.completeness}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-800 rounded-full" style={{ width: `${breakdown.completeness}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explainable ATS Score: Why did the score receive this rating? */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Explainable ATS Evaluation Rationale</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Positives */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Key Strengths & Identified Positives</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              {explanation.positives && explanation.positives.length > 0 ? (
                explanation.positives.map((pos, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{pos}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">Standard formatting identified.</li>
              )}
            </ul>
          </div>

          {/* Areas to improve */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Areas for Targeted Optimization</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              {explanation.areas_to_improve && explanation.areas_to_improve.length > 0 ? (
                explanation.areas_to_improve.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">⚠</span>
                    <span>{imp}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">No major technical deficiencies identified.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Categorized Skills Extraction */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Extracted Skills Taxonomy</h2>
            <p className="text-xs text-slate-500">
              Identified {resume.skills.length} technical skills categorized by industry standards
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(skillsByCategory).map(([category, skills]) => (
            <div key={category}>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                {category} ({skills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((s, idx) => (
                  <SkillBadge key={idx} name={s.name} category={category} variant="default" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experience, Education & Projects Review Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Experience */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <Briefcase className="w-4 h-4 text-indigo-600" />
            <span>Work Experience ({resume.experience.length})</span>
          </div>
          <div className="space-y-3">
            {resume.experience.map((exp, idx) => (
              <div key={idx} className="text-xs border-b border-slate-100 pb-2.5 last:border-0">
                <p className="font-bold text-slate-900">{exp.role}</p>
                <p className="text-slate-600 font-medium">{exp.company} · {exp.duration}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>Education ({resume.education.length})</span>
          </div>
          <div className="space-y-3">
            {resume.education.map((edu, idx) => (
              <div key={idx} className="text-xs border-b border-slate-100 pb-2.5 last:border-0">
                <p className="font-bold text-slate-900">{edu.degree}</p>
                <p className="text-slate-600">{edu.university} · {edu.graduation_year}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <FolderGit2 className="w-4 h-4 text-purple-600" />
            <span>Projects ({resume.projects.length})</span>
          </div>
          <div className="space-y-3">
            {resume.projects.map((proj, idx) => (
              <div key={idx} className="text-xs border-b border-slate-100 pb-2.5 last:border-0">
                <p className="font-bold text-slate-900">{proj.name}</p>
                <p className="text-slate-500 text-[11px] truncate">{proj.technologies}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
