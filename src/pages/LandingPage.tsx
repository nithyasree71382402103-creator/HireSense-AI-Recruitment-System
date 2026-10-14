import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { ResumeFixLogo } from '../components/ResumeFixLogo';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Gauge,
  Code2,
  Target,
  Crosshair,
  GraduationCap,
  GitCompare,
  BarChart3,
  ShieldCheck,
  Check,
  UploadCloud,
  Eye,
  X,
  Maximize2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showImageModal, setShowImageModal] = useState(false);

  const handleQuickDemo = async (role: 'candidate' | 'recruiter') => {
    try {
      if (role === 'candidate') {
        await login('candidate@hiresense.ai', 'Candidate@123');
        navigate('/candidate/dashboard');
      } else {
        await login('recruiter@hiresense.ai', 'Recruiter@123');
        navigate('/recruiter/dashboard');
      }
    } catch (err) {
      navigate('/login');
    }
  };

  const features = [
    {
      title: 'AI Resume Analysis',
      desc: 'Parses PDF, DOCX, and TXT resumes to extract contact details, education, structured work experience, and tech projects.',
      icon: FileSearch,
    },
    {
      title: 'ATS Scoring & Explanations',
      desc: 'Computes deep multi-factor ATS compatibility ratings with explainable rationale, highlights, and targeted improvement suggestions.',
      icon: Gauge,
    },
    {
      title: 'Skill Extraction',
      desc: 'Automatically discovers and categorizes programming languages, modern frameworks, cloud systems, and database tools.',
      icon: Code2,
    },
    {
      title: 'Smart Job Matching',
      desc: 'Measures resume-job synergy, awarding full credit for exact skills and partial credit for transferable domain competencies.',
      icon: Target,
    },
    {
      title: 'Skill Gap Analysis',
      desc: 'Surfaces missing requirements, strong candidate competencies, and actionable development areas per targeted position.',
      icon: Crosshair,
    },
    {
      title: 'Course Recommendations',
      desc: 'Recommends tailored certifications and curated courses with difficulty, platform, priority, and structured learning order.',
      icon: GraduationCap,
    },
    {
      title: 'Candidate Comparison',
      desc: 'Enables recruiters to evaluate multiple candidates side-by-side with factual metrics without automated hiring bias.',
      icon: GitCompare,
    },
    {
      title: 'Recruitment Analytics',
      desc: 'Visualizes talent pipelines, application volume, candidate match distribution, and skill demand distributions with interactive charts.',
      icon: BarChart3,
    },
  ];

  const steps = [
    { title: 'Upload Resume', desc: 'Drag and drop PDF, DOCX, or TXT documents', num: '01' },
    { title: 'AI Analysis', desc: 'Structured text segmentation & format evaluation', num: '02' },
    { title: 'Skill Extraction', desc: 'Identify programming languages, tools & frameworks', num: '03' },
    { title: 'Job Matching', desc: 'Calculate semantic alignment & partial transferability', num: '04' },
    { title: 'Skill Gap', desc: 'Expose exact missing qualifications per role', num: '05' },
    { title: 'Recommendations', desc: 'Curated courses & certifications for upskilling', num: '06' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar />

      {/* Hero Section with merged image and light wording background */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 border-b border-slate-200/80 bg-gradient-to-b from-slate-50 via-sky-50/25 to-white">
        {/* Ambient Color Auras echoing the image's cyan HUD and warm amber desk tones */}
        <div className="absolute top-10 right-10 w-[500px] h-[500px] bg-cyan-400/15 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-amber-400/12 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-1/2 left-1/3 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Column: Wording in clean light-colored background card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="lg:col-span-6 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 sm:p-9 shadow-xl shadow-slate-200/60 space-y-5 text-left relative overflow-hidden ring-1 ring-slate-100"
            >
              {/* Luminous light accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-600" />

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold shadow-2xs hover:bg-indigo-100/70 transition-colors">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-600" style={{ animationDuration: '6s' }} />
                  <span>Next-Generation Hiring Intelligence</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.14]">
                AI-Powered Recruitment, <span className="text-indigo-600">Built Around Skills.</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Scan applicant resumes with explainable AI, identify exact technical capabilities, measure ATS alignment with transparent scoring, and empower hiring teams without bias.
              </p>

              {/* Light Feature Indicators */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>87%+ ATS Scoring Accuracy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Explainable AI Insights</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Zero Demographic Bias</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dynamic Skill Gap Matrix</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-98 transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Get Started Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#features"
                  className="px-6 py-3.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl transition-all shadow-2xs hover:shadow-xs"
                >
                  Explore Features
                </a>
              </div>

              {/* Quick Demo Selector */}
              <div className="pt-4 border-t border-slate-200/80">
                <p className="text-xs font-semibold text-slate-500 mb-2">Instant Project Demo (One-Click Access):</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleQuickDemo('candidate')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-2xs"
                  >
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Try Candidate Demo (Alex Rivera)</span>
                  </button>
                  <button
                    onClick={() => handleQuickDemo('recruiter')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-2xs"
                  >
                    <Check className="w-3 h-3 text-blue-600" />
                    <span>Try Recruiter Demo (Sarah Jenkins)</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Hero Image seamlessly merged with cyan HUD & warm ambient lighting */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-6 relative group"
            >
              {/* Cyan, Indigo & Warm Amber Glow Aura behind the image */}
              <div className="absolute -inset-3 bg-gradient-to-tr from-cyan-500/25 via-indigo-600/20 to-amber-500/20 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-700 -z-10 animate-pulse-glow" />

              {/* Main Image Frame */}
              <div
                onClick={() => setShowImageModal(true)}
                title="Click to expand full AI Recruitment holographic view"
                className="relative rounded-3xl overflow-hidden border border-cyan-400/40 shadow-2xl shadow-indigo-950/25 bg-slate-950 cursor-pointer transition-all duration-500 group-hover:border-cyan-300 group-hover:shadow-cyan-950/40"
              >
                <img
                  src="/hero-banner.jpg"
                  alt="AI Resume Recruitment System - Intelligent Holographic Screening"
                  className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-102"
                />

                {/* Soft Gradient Vignette for Seamless Edge Blending */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30 pointer-events-none" />

                {/* Floating Top-Right Holographic Badge */}
                <div className="absolute top-3.5 right-3.5 bg-slate-950/80 backdrop-blur-md border border-cyan-400/50 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2 animate-float">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-xs font-extrabold text-white">ATS Score 87/100</span>
                  <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">Live AI</span>
                </div>

                {/* Top-Left Expand Prompt */}
                <div className="absolute top-3.5 left-3.5 bg-slate-950/70 backdrop-blur-md border border-white/20 rounded-xl px-2.5 py-1 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity animate-float-slow">
                  <Maximize2 className="w-3 h-3 text-cyan-400" />
                  <span>Click to Expand</span>
                </div>

                {/* Bottom Holographic HUD Telemetry Card */}
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-3 sm:p-4 text-white shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
                      <span className="text-xs font-bold text-white tracking-wide">
                        AI Resume Recruitment System
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                      92% Match Complete
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 mb-2 leading-tight">
                    Holographic NLP engine analyzing skills, work impact, certifications & match synergy.
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-cyan-200">
                    <span className="text-slate-400 text-[10px]">Extracted:</span>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40">Python</span>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40">React</span>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40">JavaScript</span>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40">SQL</span>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40">Docker</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Interactive Lightbox Modal for Hero Image */}
      <AnimatePresence>
        {showImageModal && (
          <div
            onClick={() => setShowImageModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                  <h3 className="text-sm font-bold text-white">AI Resume Recruitment System — Full View</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-cyan-500/30">
                <img
                  src="/hero-banner.jpg"
                  alt="AI Resume Recruitment System - Full View"
                  className="w-full h-auto object-contain max-h-[75vh]"
                />
              </div>

              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <p>
                  High-fidelity representation of robotic intelligence evaluating candidate resumes with holographic ATS metrics.
                </p>
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Close Viewer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">System Features</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Comprehensive Intelligent Recruitment Platform
            </h3>
            <p className="mt-3 text-slate-600 text-sm md:text-base">
              Engineered with dedicated dual workflows for job seekers and recruitment teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col justify-between group cursor-default"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{f.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Process Architecture</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              From Raw Resume to Actionable Insights
            </h3>
            <p className="mt-3 text-slate-600 text-sm">
              Transparent, multi-step pipeline executing accurate NLP extraction and explainable matching.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {steps.map((st, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                whileHover={{ scale: 1.03, transition: { duration: 0.18 } }}
                className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-200 relative flex flex-col transition-all cursor-default"
              >
                <span className="text-2xl font-black text-indigo-100 mb-2">{st.num}</span>
                <h4 className="text-xs font-bold text-slate-900 mb-1">{st.title}</h4>
                <p className="text-[11px] text-slate-500 leading-normal">{st.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 text-xs py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <ResumeFixLogo className="w-8 h-8 rounded-lg" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white tracking-tight">HireSense AI</span>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Resume Fix</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Production-style full stack AI Resume Recruitment System built for college capstone demonstrations and recruitment platforms.
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-white mb-3">Platform</h5>
              <ul className="space-y-2">
                <li><Link to="/candidate/dashboard" className="hover:text-white transition-colors">For Candidates</Link></li>
                <li><Link to="/recruiter/dashboard" className="hover:text-white transition-colors">For Recruiters</Link></li>
                <li><Link to="/candidate/jobs" className="hover:text-white transition-colors">Job Portal</Link></li>
                <li><Link to="/backend" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-medium"><span>Backend Engine & API</span><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span></Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-white mb-3">Features</h5>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">ATS Scoring</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Skill Extraction</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Job Matching</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-white mb-3">Compliance & Ethics</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Adheres to ethical AI hiring practices. Candidate matching focuses strictly on job-relevant technical skills, experience, and educational qualifications without demographic bias.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} HireSense AI Recruitment System. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
              <span className="hover:text-slate-400 cursor-pointer">Security Safeguards</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
