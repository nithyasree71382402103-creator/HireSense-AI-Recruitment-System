import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './layouts/ProtectedRoute';
import { CandidateLayout } from './layouts/CandidateLayout';
import { RecruiterLayout } from './layouts/RecruiterLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Candidate Pages
import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { ResumeUploadPage } from './pages/candidate/ResumeUploadPage';
import { ResumeAnalysisPage } from './pages/candidate/ResumeAnalysisPage';
import { SkillGapPage } from './pages/candidate/SkillGapPage';
import { RecommendationsPage } from './pages/candidate/RecommendationsPage';
import { CandidateJobsPage } from './pages/candidate/CandidateJobsPage';
import { CandidateApplicationsPage } from './pages/candidate/CandidateApplicationsPage';
import { CandidateProfilePage } from './pages/candidate/CandidateProfilePage';

// Recruiter Pages
import { RecruiterDashboard } from './pages/recruiter/RecruiterDashboard';
import { RecruiterJobsPage } from './pages/recruiter/RecruiterJobsPage';
import { CreateJobPage } from './pages/recruiter/CreateJobPage';
import { CandidatePoolPage } from './pages/recruiter/CandidatePoolPage';
import { CandidateDetailsPage } from './pages/recruiter/CandidateDetailsPage';
import { CandidateComparisonPage } from './pages/recruiter/CandidateComparisonPage';
import { RecruiterPipelinePage } from './pages/recruiter/RecruiterPipelinePage';
import { RecruiterAnalyticsPage } from './pages/recruiter/RecruiterAnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { BackendStatusPage } from './pages/BackendStatusPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/backend" element={<BackendStatusPage />} />

          {/* Protected Candidate Routes */}
          <Route element={<ProtectedRoute requiredRole="candidate" />}>
            <Route element={<CandidateLayout />}>
              <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
              <Route path="/candidate/profile" element={<CandidateProfilePage />} />
              <Route path="/candidate/resume" element={<ResumeUploadPage />} />
              <Route path="/candidate/resume-analysis" element={<ResumeAnalysisPage />} />
              <Route path="/candidate/skill-gap" element={<SkillGapPage />} />
              <Route path="/candidate/recommendations" element={<RecommendationsPage />} />
              <Route path="/candidate/jobs" element={<CandidateJobsPage />} />
              <Route path="/candidate/applications" element={<CandidateApplicationsPage />} />
              <Route path="/candidate/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Protected Recruiter Routes */}
          <Route element={<ProtectedRoute requiredRole="recruiter" />}>
            <Route element={<RecruiterLayout />}>
              <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
              <Route path="/recruiter/jobs" element={<RecruiterJobsPage />} />
              <Route path="/recruiter/jobs/create" element={<CreateJobPage />} />
              <Route path="/recruiter/candidates" element={<CandidatePoolPage />} />
              <Route path="/recruiter/candidates/:id" element={<CandidateDetailsPage />} />
              <Route path="/recruiter/compare" element={<CandidateComparisonPage />} />
              <Route path="/recruiter/pipeline" element={<RecruiterPipelinePage />} />
              <Route path="/recruiter/analytics" element={<RecruiterAnalyticsPage />} />
              <Route path="/recruiter/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
