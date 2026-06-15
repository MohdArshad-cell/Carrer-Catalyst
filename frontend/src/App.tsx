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
import ProtectedRoute from './components/ProtectedRoute'; // <-- IMPORT THIS
import "./App.css";

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public Routes - Anyone can see these */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/features" element={<FeaturesPage />} />

        {/* Protected Routes - Locked behind Auth */}
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
      </Routes>
    </div>
  );
}

export default App;