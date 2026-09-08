import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import AiToolsPage from "./pages/AiToolsPage.jsx";
import ResumeFromScratchPage from "./pages/ResumeFromScratchPage";
import AiTailorPage from './pages/AiTailorPage';
import ResumeEvaluator from './pages/ResumeEvaluator';
import CoverLetterGeneratorPage from './pages/CoverLetterGeneratorPage';
import MockInterviewPage from './pages/MockInterviewPage';
import LoginPage from './pages/LoginPage';
import Pricing from './pages/Pricing';
import FeaturesPage from './pages/FeaturesPage'; 
import ProtectedRoute from './components/ProtectedRoute'; 
import AtsXrayPage from './pages/AtsXrayPage';
import AdminDashboardPage from './pages/AdminDashboardPage'; 
import LinkedInOptimizerPage from './pages/LinkedInOptimizerPage';
import ColdOutreachPage from './pages/ColdOutreachPage';
import CareerRoadmapPage from './pages/CareerRoadmapPage';
import BulletRewriterPage from './pages/BulletRewriterPage';
import JobFitScorePage from './pages/JobFitScorePage';
import ResignationLetterPage from './pages/ResignationLetterPage';
import ResumeDiffPage from './pages/ResumeDiffPage';
import ReferralPage from './pages/ReferralPage';
import UsageHistoryPage from './pages/UsageHistoryPage';
import "./App.css";

function App() {
  return (
    <div className="App">
      
      {/* ✅ THIS IS THE FIX: The global aurora background now sits permanently behind EVERY page */}
      <div className="background-aurora"></div>

      <Routes>
        {/* =========================================
            Public Routes - Free Tools & Landing Pages
            ========================================= */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/ats-xray" element={<AtsXrayPage />} />
        <Route path="/bullet-rewriter" element={<BulletRewriterPage />} />
        <Route path="/job-fit" element={<JobFitScorePage />} />
        <Route path="/resignation-letter" element={<ResignationLetterPage />} />
        <Route path="/resume-diff" element={<ResumeDiffPage />} />

        {/* =========================================
            Protected Routes - Premium SaaS Tools
            ========================================= */}
        <Route path="/ai-tools" element={
            <ProtectedRoute>
                <AiToolsPage />
            </ProtectedRoute>
        } />
        <Route path="/ResumeFromScratchPage" element={
            <ProtectedRoute>
                <ResumeFromScratchPage />
            </ProtectedRoute>
        } />
        <Route path="/ai-tailor" element={
            <ProtectedRoute>
                <AiTailorPage />
            </ProtectedRoute>
        } />
        <Route path="/ats-evaluator" element={
            <ProtectedRoute>
                <ResumeEvaluator />
            </ProtectedRoute>
        } />
        <Route path="/cover-letter" element={
            <ProtectedRoute>
                <CoverLetterGeneratorPage />
            </ProtectedRoute>
        } />
        <Route path="/mock-interview" element={
            <ProtectedRoute>
                <MockInterviewPage />
            </ProtectedRoute>
        } />
        <Route path="/linkedin-optimizer" element={
            <ProtectedRoute>
                <LinkedInOptimizerPage />
            </ProtectedRoute>
        } />
        <Route path="/cold-outreach" element={
            <ProtectedRoute>
                <ColdOutreachPage />
            </ProtectedRoute>
        } />
        <Route path="/career-roadmap" element={
            <ProtectedRoute>
                <CareerRoadmapPage />
            </ProtectedRoute>
        } />
        <Route path="/referrals" element={
            <ProtectedRoute>
                <ReferralPage />
            </ProtectedRoute>
        } />
        <Route path="/history" element={
            <ProtectedRoute>
                <UsageHistoryPage />
            </ProtectedRoute>
        } />
        
        {/* =========================================
            Admin Routes (Restricted)
            ========================================= */}
        <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
                <AdminDashboardPage />
            </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;