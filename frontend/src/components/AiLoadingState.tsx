import React, { useState, useEffect } from 'react';

interface AiLoadingStateProps {
    steps: string[];
    currentStep: number;
    accentColor?: string;
}

const AiLoadingState: React.FC<AiLoadingStateProps> = ({ 
    steps, 
    currentStep, 
    accentColor = '#00e5ff' // Default to cyan
}) => {
    // Ensure currentStep is within bounds
    const safeStep = Math.min(Math.max(0, currentStep), steps.length - 1);
    
    // Calculate progress percentage
    const progressPercent = ((safeStep + 1) / steps.length) * 100;

    return (
        <div className="loading-state glass-card-premium text-center" style={{ padding: '4rem', maxWidth: '600px', margin: '0 auto' }}>
            <div className="spinner-premium" style={{ borderTopColor: accentColor }}></div>
            <h3 className="step-text animate-fade-up" style={{ color: accentColor, margin: '1.5rem 0', minHeight: '1.5em', transition: 'all 0.3s ease' }}>
                {steps[safeStep]}
            </h3>
            <div className="progress-bar-container" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', height: '6px', overflow: 'hidden' }}>
                <div 
                    className="progress-bar-fill" 
                    style={{ 
                        width: `${progressPercent}%`, 
                        background: `linear-gradient(90deg, ${accentColor}, ${accentColor}dd)`,
                        height: '100%',
                        transition: 'width 0.5s ease-in-out'
                    }}
                ></div>
            </div>
            <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Step {safeStep + 1} of {steps.length}
            </div>
        </div>
    );
};

export default AiLoadingState;
