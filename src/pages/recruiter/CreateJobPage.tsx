import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jobsApi } from '../../services/api';
import { SkillBadge } from '../../components/SkillBadge';
import { ErrorAlert } from '../../components/ErrorAlert';
import {
  Briefcase,
  Sparkles,
  Plus,
  X,
  CheckCircle2,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  ArrowRight,
} from 'lucide-react';

export const CreateJobPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState(user?.company_name || 'Apex Global Technologies');
  const [location, setLocation] = useState('San Francisco, CA (Hybrid)');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [description, setDescription] = useState('');
  const [education, setEducation] = useState("Bachelor's Degree in Computer Science or related field");
  const [minExperience, setMinExperience] = useState(2);
  const [salaryRange, setSalaryRange] = useState('$120,000 - $160,000');

  // Dynamic Skills
  const [skills, setSkills] = useState<Array<{ name: string; is_required: boolean; category: string }>>([
    { name: 'Python', is_required: true, category: 'Programming Languages' },
    { name: 'React', is_required: true, category: 'Frameworks' },
    { name: 'PostgreSQL', is_required: true, category: 'Databases' },
  ]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillRequired, setNewSkillRequired] = useState(true);

  const [analyzingJD, setAnalyzingJD] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // AI JD Analysis
  const handleAnalyzeJD = async () => {
    if (!description.trim()) {
      setErrorMessage('Please enter a job description first to analyze.');
      return;
    }
    setAnalyzingJD(true);
    setErrorMessage('');
    try {
      const res = await jobsApi.analyzeText(description);
      setAiSuggestions(res);

      if (res.education) setEducation(res.education);
      if (res.min_experience_years) setMinExperience(res.min_experience_years);

      // Merge extracted skills
      const extracted: Array<{ name: string; is_required: boolean; category: string }> = [];
      res.required_skills.forEach((s) => extracted.push({ name: s, is_required: true, category: 'Technical Skills' }));
      res.preferred_skills.forEach((s) => extracted.push({ name: s, is_required: false, category: 'Technical Skills' }));

      if (extracted.length > 0) {
        setSkills(extracted);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to analyze job description.');
    } finally {
      setAnalyzingJD(false);
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    if (!skills.some((s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) {
      setSkills([...skills, { name: newSkillName.trim(), is_required: newSkillRequired, category: 'Technical Skills' }]);
    }
    setNewSkillName('');
  };

  const handleRemoveSkill = (name: string) => {
    setSkills(skills.filter((s) => s.name !== name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMessage('Job title and description are required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      await jobsApi.create({
        title,
        company,
        location,
        employment_type: employmentType,
        description,
        education,
        min_experience_years: minExperience,
        salary_range: salaryRange,
        skills,
      });
      navigate('/recruiter/jobs');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to post job requisition.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadSampleJD = () => {
    setTitle('Senior Cloud & Backend Engineer');
    setCompany(user?.company_name || 'Apex Global Technologies');
    setLocation('San Francisco, CA (Hybrid)');
    setEmploymentType('Full-time');
    setDescription(`
We are looking for a Senior Backend Engineer to join our core infrastructure team.
You will architect scalable microservices, manage PostgreSQL database schemas, and deploy containerized services on AWS using Docker and Kubernetes.

Responsibilities:
- Build low-latency REST APIs using Python and FastAPI.
- Optimize complex database queries and indices in PostgreSQL.
- Architect CI/CD deployment pipelines using GitHub Actions and Docker.
- Collaborate with frontend engineers to design clean OpenAPI endpoints.

Qualifications:
- Bachelor's or Master's degree in Computer Science or equivalent.
- 3+ years of professional backend engineering experience.
- Strong proficiency in Python, PostgreSQL, and Docker is required.
- Preferred experience with Kubernetes, AWS, Redis, and TypeScript.
    `.trim());
    setSalaryRange('$135,000 - $175,000');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Requisition Creator
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Post New Job Opening
          </h1>
          <p className="text-xs text-slate-500">
            Define requirements and leverage AI NLP to automatically extract skills from your description.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSampleJD}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fill Sample Tech JD</span>
        </button>
      </div>

      {errorMessage && (
        <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage('')} />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
            Position Fundamentals
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Apex Global Technologies"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="San Francisco, CA or Remote"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Compensation Range
              </label>
              <input
                type="text"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="e.g. $120,000 - $160,000"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
            </div>
          </div>

          {/* Description & AI Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Job Description *
              </label>
              <button
                type="button"
                onClick={handleAnalyzeJD}
                disabled={analyzingJD}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{analyzingJD ? 'Analyzing text...' : 'AI Analyze Job Description'}</span>
              </button>
            </div>
            <textarea
              rows={7}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste or write the full job description. Use the 'AI Analyze' button above to automatically extract required skills, preferred qualifications, and minimum experience."
              className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs font-mono leading-relaxed focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          {/* AI Extraction Preview Banner */}
          {aiSuggestions && (
            <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-indigo-900">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>AI Job Description Insights Extracted:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="font-semibold block mb-0.5">Identified Education:</span>
                  <p>{aiSuggestions.education}</p>
                </div>
                <div>
                  <span className="font-semibold block mb-0.5">Detected Experience:</span>
                  <p>{aiSuggestions.min_experience_years} years minimum</p>
                </div>
              </div>
              <div>
                <span className="font-semibold block mb-1">Extracted Domain Keywords:</span>
                <div className="flex flex-wrap gap-1">
                  {aiSuggestions.keywords?.map((k: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-white border border-indigo-200 text-indigo-800 rounded-md text-[10px] font-medium">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Skills Editor */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
                Candidate Skill Requirements
              </h2>
              <p className="text-xs text-slate-500">
                Classify skills into Required (70% matching weight) and Preferred (20% matching weight).
              </p>
            </div>

            {/* Current skill tags */}
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <div
                  key={s.name}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                    s.is_required
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <span>{s.name}</span>
                  <span className="text-[10px] opacity-70 font-normal">({s.is_required ? 'Required' : 'Preferred'})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s.name)}
                    className="p-0.5 hover:text-rose-600 rounded-md transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add skill row */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="Add custom skill (e.g. Docker, AWS)..."
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs w-56 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newSkillRequired}
                  onChange={(e) => setNewSkillRequired(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Required Skill</span>
              </label>
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Add Skill
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Experience (Years)
              </label>
              <input
                type="number"
                min={0}
                max={20}
                value={minExperience}
                onChange={(e) => setMinExperience(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Education Criterion
              </label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="Bachelor's Degree in Computer Science"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/recruiter/jobs')}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <span>{submitting ? 'Publishing...' : 'Publish Job Requisition'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
