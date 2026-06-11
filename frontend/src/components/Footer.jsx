import React from 'react';
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer id="footer" className="footer-long">
            <div className="container footer-grid">
                
                <div className="footer-col">
                    {/* Logo styled exactly like the Navbar */}
                    <Link to="/" className="footer-logo">
                        Career<span>Catalyst</span>
                    </Link>
                    <p>Our mission is to empower job seekers with the AI tools they need to stand out and succeed.</p>
                </div>
                
                <div className="footer-col">
                    <h3>Features</h3>
                    <ul>
                        <li><a href="/#full-bento-grid">Resume Builder</a></li>
                        <li><a href="/#full-bento-grid">AI Resume Tailor</a></li>
                        <li><a href="/#full-bento-grid">ATS Evaluator</a></li>
                        <li><a href="/#full-bento-grid">Cover Letter Generator</a></li>
                    </ul>
                </div>
                
                <div className="footer-col">
                    <h3>Resources</h3>
                    <ul>
                        <li><a href="#">Blog</a></li>
                        <li><a href="#">Contact Us</a></li>
                        <li><a href="#">Help Center</a></li>
                    </ul>
                </div>
                
                <div className="footer-col">
                    <h3>Social</h3>
                    <div className="social-icons">
                        <a href="#" aria-label="GitHub"><FaGithub /></a>
                        <a href="#" aria-label="LinkedIn"><FaLinkedin /></a>
                    </div>
                </div>
                
            </div>
            
            <div className="footer-copyright">
                <p>&copy; {new Date().getFullYear()} Career Catalyst. All Rights Reserved. Built with passion in Lucknow, India.</p>
            </div>
        </footer>
    );
};

export default Footer;