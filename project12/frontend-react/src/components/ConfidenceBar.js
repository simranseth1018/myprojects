import React from 'react';
import './ConfidenceBar.css';

/**
 * ConfidenceBar - Visual representation of the ML model's confidence level.
 *
 * Props:
 *   confidence  {number}  - percentage value from 0 to 100
 *   isSpam      {boolean} - determines the colour theme (red vs green)
 */
function ConfidenceBar({ confidence, isSpam }) {
  const clampedValue = Math.min(100, Math.max(0, confidence));

  // Colour changes based on prediction type
  const barClass = isSpam ? 'confidence-fill spam' : 'confidence-fill ham';

  // Descriptive label for accessibility and UX
  const level =
    clampedValue >= 90 ? 'Very High' :
    clampedValue >= 75 ? 'High' :
    clampedValue >= 60 ? 'Moderate' :
    'Low';

  return (
    <div className="confidence-bar-wrapper">
      <div className="confidence-bar-header">
        <span className="confidence-label">Confidence</span>
        <span className={`confidence-level ${isSpam ? 'level-spam' : 'level-ham'}`}>
          {level}
        </span>
      </div>

      {/* Track */}
      <div className="confidence-track" role="progressbar" aria-valuenow={clampedValue} aria-valuemin={0} aria-valuemax={100}>
        {/* Animated fill */}
        <div
          className={barClass}
          style={{ width: `${clampedValue}%` }}
        />
      </div>

      {/* Scale markers */}
      <div className="confidence-scale">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>

      <p className="confidence-value">
        Model is <strong>{clampedValue}%</strong> confident this is{' '}
        <strong>{isSpam ? 'spam' : 'not spam'}</strong>.
      </p>
    </div>
  );
}

export default ConfidenceBar;
