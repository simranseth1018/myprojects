import React from 'react';
import ConfidenceBar from './ConfidenceBar';
import './ResultCard.css';

/**
 * ResultCard - Displays the classification result from the ML pipeline.
 *
 * Props:
 *   result  {object}  - { prediction: string, confidence: number, rawPrediction: string }
 */
function ResultCard({ result }) {
  const isSpam = result.rawPrediction === 'spam';

  return (
    <div className={`result-card ${isSpam ? 'result-spam' : 'result-ham'}`}>
      {/* Icon + label */}
      <div className="result-header">
        <div className={`result-icon ${isSpam ? 'icon-spam' : 'icon-ham'}`}>
          {isSpam ? '⚠' : '✓'}
        </div>
        <div>
          <p className="result-label">Classification Result</p>
          <h2 className={`result-prediction ${isSpam ? 'text-spam' : 'text-ham'}`}>
            {result.prediction}
          </h2>
        </div>
      </div>

      {/* Divider */}
      <div className="result-divider" />

      {/* Confidence bar */}
      <ConfidenceBar confidence={result.confidence} isSpam={isSpam} />

      {/* Info pill */}
      <div className="result-info">
        <span className="info-icon">&#128161;</span>
        {isSpam
          ? 'This email exhibits strong spam signals. Exercise caution.'
          : 'This email appears to be legitimate. No spam indicators found.'}
      </div>
    </div>
  );
}

export default ResultCard;
