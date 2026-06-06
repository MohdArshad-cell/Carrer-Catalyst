import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx"; // Our JS homepage
import AiToolsPage from "./pages/AiToolsPage.jsx";
import ResumeFromScratchPage from "./pages/ResumeFromScratchPage";
import AiTailorPage from './pages/AiTailorPage';
import ResumeEvaluator from './pages/ResumeEvaluator';
import CoverLetterGeneratorPage from './pages/CoverLetterGeneratorPage';
import MockInterviewPage from './pages/MockInterviewPage';
import "./App.css";

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Rule 1: When the URL is "/", show the HomePage */}
        <Route path="/" element={<HomePage />} />

        {/* Rule 2: When the URL is "/resume-builder", show the ResumeBuilderPage */}
        <Route path="/ai-tools" element={<AiToolsPage />} />
        <Route path="/ResumeFromScratchPage" element={<ResumeFromScratchPage />} />
        <Route path="/ai-tailor" element={<AiTailorPage />} />  {/* <-- ADD THIS ROUTE */}
        <Route path="/ats-evaluator" element={<ResumeEvaluator />} />
        <Route path="/cover-letter" element={<CoverLetterGeneratorPage />} />
        <Route path="/mock-interview" element={<MockInterviewPage />} />
      </Routes>
    </div>
  );
}

export default App;