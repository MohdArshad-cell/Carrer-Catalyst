import React, { useRef, useState } from 'react';
import axios from 'axios';
import { useToast } from './Toast';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

interface PdfUploadButtonProps {
    onTextExtracted: (text: string) => void;
    disabled?: boolean;
}

/**
 * PdfUploadButton — Reusable component that uploads a PDF to the backend,
 * extracts text via PyMuPDF, and returns it to the parent via callback.
 * 
 * Usage: <PdfUploadButton onTextExtracted={(text) => setResumeText(text)} />
 */
const PdfUploadButton: React.FC<PdfUploadButtonProps> = ({ onTextExtracted, disabled = false }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { showToast } = useToast();

    const handleClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            showToast('Please select a PDF file.', 'warning');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('File is too large. Maximum size is 5MB.', 'warning');
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(`${API_BASE_URL}/api/upload-pdf`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 15000, // 15 second timeout
            });

            if (response.data?.extracted_text) {
                onTextExtracted(response.data.extracted_text);
                showToast(`PDF processed successfully! Text extracted from your resume.`, 'success');
            } else {
                throw new Error('No text returned from server.');
            }
        } catch (err: any) {
            console.error('PDF Upload Error:', err);
            const detail = err.response?.data?.detail || err.message || 'Failed to extract text from PDF.';
            showToast(String(detail), 'error');
        } finally {
            setIsUploading(false);
            // Reset input so the same file can be re-selected
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
            <button
                className="btn-outline pdf-upload-btn"
                onClick={handleClick}
                disabled={disabled || isUploading}
                title="Upload a PDF resume to extract text automatically"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0.5rem 1rem',
                    borderRadius: '10px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    borderColor: isUploading ? '#f59e0b' : '#8b5cf6',
                    color: isUploading ? '#f59e0b' : '#8b5cf6',
                    cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                }}
            >
                {isUploading ? (
                    <>
                        <span className="spinner-small" style={{
                            width: '14px', height: '14px',
                            border: '2px solid rgba(245, 158, 11, 0.3)',
                            borderTop: '2px solid #f59e0b',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                            display: 'inline-block',
                        }} />
                        Extracting...
                    </>
                ) : (
                    <>📄 Upload PDF</>
                )}
            </button>
        </>
    );
};

export default PdfUploadButton;
