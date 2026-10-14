import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { resumesApi } from '../../services/api';
import { ResumeData } from '../../types';
import { LoadingState } from '../../components/LoadingState';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Github,
  Linkedin,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Award,
} from 'lucide-react';

export const CandidateProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await resumesApi.getLatest();
        setResume(data);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <LoadingState message="Loading profile..." />;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Candidate Account</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
          Profile & Portfolio Summary
        </h1>
        <p className="text-xs text-slate-500">
          Your personal data extracted from your verified resume profile.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl uppercase">
            {user?.full_name?.charAt(0) || 'C'}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">{user?.full_name}</h2>
            <p className="text-xs font-medium text-indigo-600">Full Stack & Software Engineer</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user?.email}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>San Francisco, CA</span>
              </span>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="pt-6 flex flex-wrap gap-4 text-xs">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            <Linkedin className="w-4 h-4 text-blue-600" />
            <span>LinkedIn Profile Connected</span>
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            <Github className="w-4 h-4 text-slate-900" />
            <span>GitHub Profile Verified</span>
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>Personal Portfolio Indexed</span>
          </span>
        </div>
      </div>

      {/* Sections breakdown */}
      {resume && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Work Experience */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider mb-4">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>Experience ({resume.experience.length})</span>
            </div>
            <div className="space-y-4">
              {resume.experience.map((exp, idx) => (
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
              <span>Education ({resume.education.length})</span>
            </div>
            <div className="space-y-4">
              {resume.education.map((edu, idx) => (
                <div key={idx} className="border-l-2 border-emerald-200 pl-3 py-0.5 text-xs">
                  <p className="font-bold text-slate-900">{edu.degree}</p>
                  <p className="text-slate-600 font-medium">{edu.university}</p>
                  <p className="text-slate-500 mt-0.5">Graduated: {edu.graduation_year} {edu.gpa ? `· GPA: ${edu.gpa}` : ''}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
