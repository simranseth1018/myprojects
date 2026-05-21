import React from 'react';
import EmailClassifier from './components/EmailClassifier';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-logo">
            <span className="logo-icon">&#128274;</span>
            <div>
              <h1 className="header-title">Spam Email Classifier</h1>
              <p className="header-subtitle">Powered by Naive Bayes NLP</p>
            </div>
          </div>
          <div className="header-badges">
            <span className="badge badge-blue">AI Powered</span>
            <span className="badge badge-green">Real-time</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <EmailClassifier />
      </main>

      <footer className="app-footer">
        <p>
          React &rarr; Spring Boot &rarr; Flask ML &bull; TF-IDF + Multinomial Naive Bayes
        </p>
      </footer>
    </div>
  );
}

export default App;
