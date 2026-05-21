import React, { useState } from 'react';
import axios from 'axios';
import ResultCard from './ResultCard';
import './EmailClassifier.css';

// Spring Boot backend URL
const API_URL = 'http://localhost:8080/api/predict';

// Example emails to help users test quickly
const EXAMPLE_EMAILS = [
  {
    label: 'Spam example',
    text: "CONGRATULATIONS! You've been selected to receive a $1000 gift card. Click here NOW to claim your prize before it expires! Limited time offer!",
  },
  {
    label: 'Ham example',
    text: "Hi Sarah, just wanted to follow up on the meeting notes from Thursday. I've attached the summary document. Let me know if you have any questions. Thanks!",
  },
];

function EmailClassifier() {
  const [emailText, setEmailText]   = useState('');
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [charCount, setCharCount]   = useState(0);

  const MAX_CHARS = 10000;

  // Handle textarea change
  const handleTextChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setEmailText(value);
      setCharCount(value.length);
      if (error) setError('');
    }
  };

  // Load a sample email into the textarea
  const loadExample = (example) => {
    setEmailText(example.text);
    setCharCount(example.text.length);
    setResult(null);
    setError('');
  };

  // Submit email to the Spring Boot API
  const handlePredict = async () => {
    const trimmed = emailText.trim();

    // Client-side validation
    if (!trimmed) {
      setError('Please enter an email message before analyzing.');
      return;
    }
    if (trimmed.length < 5) {
      setError('The message is too short. Enter at least a few words.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post(API_URL, { message: trimmed });
      setResult(response.data);
    } catch (err) {
      if (err.response) {
        // Server returned an error response
        const serverMsg = err.response.data?.error || 'Server error occurred.';
        setError(`Error ${err.response.status}: ${serverMsg}`);
      } else if (err.request) {
        // Request made but no response received (backend down)
        setError(
          'Cannot connect to the backend. Make sure the Spring Boot server is running on port 8080.'
        );
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Clear everything
  const handleClear = () => {
    setEmailText('');
    setCharCount(0);
    setResult(null);
    setError('');
  };

  // Allow Ctrl+Enter to submit
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handlePredict();
    }
  };

  return (
    <div className="classifier-container">

      {/* ---- Input Card ---- */}
      <div className="card input-card">
        <div className="card-header">
          <h2 className="card-title">Analyze Email</h2>
          <div className="example-buttons">
            {EXAMPLE_EMAILS.map((ex) => (
              <button
                key={ex.label}
                className="btn-example"
                onClick={() => loadExample(ex)}
                title={`Load a ${ex.label}`}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div className="textarea-wrapper">
          <textarea
            className="email-textarea"
            value={emailText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Paste or type an email message here...&#10;&#10;Tip: Press Ctrl+Enter to analyze."
            rows={8}
            disabled={loading}
            aria-label="Email content to classify"
          />
          <div className="textarea-footer">
            <span className="hint-text">Ctrl+Enter to submit</span>
            <span className={`char-counter ${charCount > MAX_CHARS * 0.9 ? 'near-limit' : ''}`}>
              {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="action-row">
          <button
            className="btn-secondary"
            onClick={handleClear}
            disabled={loading || (!emailText && !result)}
          >
            Clear
          </button>
          <button
            className="btn-primary"
            onClick={handlePredict}
            disabled={loading || !emailText.trim()}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" aria-hidden="true" />
                Analyzing...
              </span>
            ) : (
              'Analyze Email'
            )}
          </button>
        </div>
      </div>

      {/* ---- Error Banner ---- */}
      {error && (
        <div className="error-banner" role="alert">
          <span className="error-icon">&#9888;</span>
          <span>{error}</span>
        </div>
      )}

      {/* ---- Result Card ---- */}
      {result && !loading && (
        <div className="card result-wrapper">
          <ResultCard result={result} />
        </div>
      )}

      {/* ---- How it works ---- */}
      <div className="card info-card">
        <h3 className="info-title">How it works</h3>
        <div className="pipeline-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div>
              <p className="step-label">React Frontend</p>
              <p className="step-desc">Sends email text via HTTP POST</p>
            </div>
          </div>
          <div className="step-arrow">&#8594;</div>
          <div className="step">
            <div className="step-number">2</div>
            <div>
              <p className="step-label">Spring Boot</p>
              <p className="step-desc">Routes request to the ML service</p>
            </div>
          </div>
          <div className="step-arrow">&#8594;</div>
          <div className="step">
            <div className="step-number">3</div>
            <div>
              <p className="step-label">Flask ML</p>
              <p className="step-desc">TF-IDF + Naive Bayes classification</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default EmailClassifier;
