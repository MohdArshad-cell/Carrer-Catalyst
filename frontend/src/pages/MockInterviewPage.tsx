import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Loader, MessageSquare, PlayCircle, Mic, ChevronDown, ChevronUp } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import './MockInterviewPage.css';

interface InterviewItem {
  question: string;
  answer: string;
}

// 1. FIXED: Using Environment Variable for dynamic routing in production
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const MockInterviewPage: React.FC = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [questions, setQuestions] = useState<InterviewItem[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [visibleAnswers, setVisibleAnswers] = useState<{ [key: number]: boolean }>({});

  const toggleAnswer = (index: number) => {
    setVisibleAnswers(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
        setError('Please provide a job description first.');
        return;
    }
    
    setIsLoading(true);
    setError('');
    setQuestions([]);
    setVisibleAnswers({}); 

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/interview/generate`, jobDescription, {
        headers: { 'Content-Type': 'text/plain' }
      });
      
      // 2. FIXED: Safe Check for Response
      if (!response.data || !response.data.content) {
          throw new Error("Invalid response format received from server.");
      }

      // 3. FIXED: Sanitize AI output before parsing
      // AI models often wrap JSON in Markdown blocks (e.g., ```json ... ```). This strips it safely.
      let rawContent = response.data.content;
      rawContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const parsedQuestions = JSON.parse(rawContent);
      
      if (!Array.isArray(parsedQuestions)) {
          throw new Error("AI did not return a valid array array format.");
      }

      setQuestions(parsedQuestions);
    } catch (err: any) {
      console.error("Error generating interview:", err);
      // Differentiate between JSON parsing errors and Network/Server errors
      if (err instanceof SyntaxError) {
          setError('AI generated an invalid format. Please try again.');
      } else {
          setError('Failed to generate interview questions. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mock-container">
      <Navbar />
      <ParticleBackground />

      <div className="mock-header">
        <h1>AI Mock Interview Simulator</h1>
        <p>Paste the Job Description below. Our AI will act as an HR Manager and generate 10 targeted questions with model answers.</p>
      </div>

      <div className="mock-grid">
        {/* Left Column: Input */}
        <div className="glass-card input-section">
          <h2><FileText className="icon" /> Job Description</h2>
          <textarea
            className="styled-textarea"
            placeholder="Paste the full job description here (e.g., 'Senior Java Developer at Google...')"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            disabled={isLoading}
          />
          
          <button 
            className="generate-btn"
            onClick={handleGenerate}
            disabled={isLoading || !jobDescription.trim()}
          >
            {isLoading ? (
              <><Loader className="spin" /> Interviewing...</>
            ) : (
              <><PlayCircle /> Start Interview</>
            )}
          </button>
          
          {error && <div style={{color: '#ff4d4f', marginTop: '1rem', textAlign: 'center', fontWeight: 'bold'}}>{error}</div>}
        </div>

        {/* Right Column: Output */}
        <div className="glass-card output-section">
          <h2><Mic className="icon" style={{color: '#a855f7'}}/> Interview Session</h2>
          
          <div className="questions-container">
            {!questions.length && !isLoading && (
              <div className="loading-state">
                <MessageSquare size={48} style={{opacity: 0.3, marginBottom: '1rem'}}/>
                <p>Waiting for job description...</p>
              </div>
            )}

            {isLoading && (
              <div className="loading-state">
                <Loader size={48} className="spin" style={{color: '#d946ef'}}/>
                <p>HR is reviewing the JD...</p>
              </div>
            )}

            {questions.map((item, index) => (
              <div key={index} className="question-item">
                <h3>Question {index + 1}</h3>
                <p className="q-text">{item.question}</p>
                
                {/* Reveal Answer Button */}
                <button 
                  className="reveal-btn" 
                  onClick={() => toggleAnswer(index)}
                >
                  {visibleAnswers[index] ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                  {visibleAnswers[index] ? 'Hide Answer' : 'Show Ideal Answer'}
                </button>

                {/* 4. FIXED: Added whiteSpace: 'pre-wrap' to maintain AI paragraph breaks */}
                {visibleAnswers[index] && (
                  <div className="answer-box">
                    <strong>💡 Model Answer:</strong>
                    <div style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem', lineHeight: '1.5' }}>
                        {item.answer}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ width: '100%' }}>
          <Footer />
      </div>
    </div>
  );
};

export default MockInterviewPage;