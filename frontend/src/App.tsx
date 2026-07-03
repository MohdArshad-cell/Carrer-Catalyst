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