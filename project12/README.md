# Spam Email Classifier — Full-Stack AI Project

An end-to-end AI-powered web application that classifies email text as **Spam** or **Not Spam** using a Naive Bayes NLP model. Built with a modern three-tier architecture: React frontend → Spring Boot backend → Flask ML service.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                           │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │             React.js Frontend  (port 3000)              │   │
│   │  • Textarea for email input                             │   │
│   │  • Axios HTTP client                                    │   │
│   │  • Confidence bar visualization                         │   │
│   └───────────────────────┬─────────────────────────────────┘   │
└───────────────────────────│─────────────────────────────────────┘
                            │  POST /api/predict
                            │  { "message": "..." }
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Spring Boot Backend  (port 8080)                   │
│                                                                 │
│  SpamController  ──►  SpamService  ──►  RestTemplate           │
│       │                                      │                  │
│   SpamRequest DTO                      SpamResponse DTO         │
└──────────────────────────────────────────────┬──────────────────┘
                                               │  POST /predict
                                               │  { "message": "..." }
                                               ▼
┌─────────────────────────────────────────────────────────────────┐
│               Flask ML Service  (port 5000)                     │
│                                                                 │
│  TF-IDF Vectorizer  ──►  Multinomial Naive Bayes               │
│                                                                 │
│  Returns: { prediction, confidence, raw_prediction }           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
spam-email-classifier/
│
├── frontend-react/                    # React.js SPA
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── EmailClassifier.js     # Main form + logic
│   │   │   ├── EmailClassifier.css
│   │   │   ├── ResultCard.js          # Prediction result display
│   │   │   ├── ResultCard.css
│   │   │   ├── ConfidenceBar.js       # Animated confidence meter
│   │   │   └── ConfidenceBar.css
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
│
├── springboot-backend/                # Java Spring Boot REST API
│   ├── build.gradle
│   ├── settings.gradle
│   ├── gradle/wrapper/
│   │   └── gradle-wrapper.properties
│   └── src/main/
│       ├── java/com/spamclassifier/
│       │   ├── SpamClassifierApplication.java   # Entry point + RestTemplate bean
│       │   ├── controller/
│       │   │   └── SpamController.java          # POST /api/predict, GET /api/health
│       │   ├── service/
│       │   │   └── SpamService.java             # Calls Flask ML via RestTemplate
│       │   ├── dto/
│       │   │   ├── SpamRequest.java             # Incoming request DTO
│       │   │   └── SpamResponse.java            # Outgoing response DTO
│       │   └── config/
│       │       └── CorsConfig.java              # Global CORS configuration
│       └── resources/
│           └── application.properties
│
├── flask-ml-service/                  # Python Flask ML microservice
│   ├── app.py                         # Flask server + /predict endpoint
│   ├── train_model.py                 # TF-IDF + Naive Bayes training script
│   ├── spam_classifier.pkl            # Trained model (generated on first run)
│   ├── vectorizer.pkl                 # Fitted TF-IDF vectorizer (generated)
│   └── requirements.txt
│
└── README.md
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| Java JDK | 17+ | https://adoptium.net |
| Gradle | 8+ | https://gradle.org/install |
| Python | 3.9+ | https://python.org |

---

## Setup & Running

### 1. Flask ML Service (Start this first)

```bash
cd flask-ml-service

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Pre-train the model — app.py auto-trains on first run
python train_model.py

# Start the Flask server
python app.py
# Running on http://localhost:5000
```

### 2. Spring Boot Backend

```bash
cd springboot-backend

# Run with Gradle (downloads dependencies automatically)
gradle bootRun

# Alternative: build the JAR first
gradle build
java -jar build/libs/spam-classifier-backend-1.0.0.jar

# Running on http://localhost:8080
```

### 3. React Frontend

```bash
cd frontend-react

# Install Node dependencies
npm install

# Start the development server
npm start
# Opens http://localhost:3000
```

---

## API Reference

### Spring Boot Backend

#### `POST /api/predict`
Classify an email message.

**Request body:**
```json
{
  "message": "Congratulations! You've won a $1000 prize. Click here!"
}
```

**Success response (200):**
```json
{
  "prediction": "Spam",
  "confidence": 97.43,
  "rawPrediction": "spam"
}
```

**Error response (503):**
```json
{
  "error": "ML service is unavailable. Please ensure the Flask service is running on port 5000."
}
```

#### `GET /api/health`
```json
{
  "status": "UP",
  "service": "Spam Classifier Backend",
  "version": "1.0.0"
}
```

### Flask ML Service

#### `POST /predict`
**Request:**
```json
{ "message": "sample email text" }
```
**Response:**
```json
{
  "prediction": "Spam",
  "confidence": 97.43,
  "raw_prediction": "spam"
}
```

#### `GET /health`
```json
{
  "status": "OK",
  "service": "Flask ML Service",
  "model_loaded": true
}
```

---

## NLP Concepts Explained

### 1. Tokenization
Breaking raw text into individual words (tokens). "Win a free prize!" becomes `["Win", "a", "free", "prize"]`. Enables treating each word as a feature.

### 2. TF-IDF Vectorization
Converts tokens into numerical features:
- **TF (Term Frequency):** How often a word appears in the current email.
- **IDF (Inverse Document Frequency):** Penalizes words common across all emails (e.g., "the", "is").
- Words unique to spam emails (e.g., "prize", "free", "click") get high TF-IDF scores.

```
TF-IDF(word, email) = TF(word, email) × log(N / df(word))
```

### 3. N-grams
The vectorizer uses `ngram_range=(1, 2)`, capturing:
- **Unigrams:** "free", "money"
- **Bigrams:** "free money", "click here"

Bigrams capture context that single words miss.

### 4. Multinomial Naive Bayes
A probabilistic classifier based on Bayes' theorem:

```
P(spam | email) ∝ P(spam) × ∏ P(word_i | spam)
```

- "Naive" = assumes all words are independent (not true in practice, but works well for text).
- `alpha=0.1` applies Laplace smoothing so unseen words don't result in zero probability.
- Extremely fast and effective for text classification despite its simplicity.

### 5. Spam Classification
A binary classification task where:
- **Spam (positive class):** Unsolicited/commercial email
- **Ham (negative class):** Legitimate email

The model outputs a probability for each class. The class with the higher probability wins, and its probability becomes the confidence score.

---

## Screenshots

> After running all three services, open `http://localhost:3000`.

| State | Description |
|-------|-------------|
| Initial | Empty textarea with example buttons |
| Loading | Spinner shown while awaiting ML response |
| Spam detected | Red card with ⚠ icon and confidence bar |
| Ham detected | Green card with ✓ icon and confidence bar |
| Error | Red banner with actionable error message |

---

## Future Improvements

- [ ] **Larger dataset** — Replace sample data with the UCI SMS Spam Collection (~5,500 messages)
- [ ] **Model persistence** — Store model to a database instead of local `.pkl` files
- [ ] **JWT authentication** — Secure API endpoints
- [ ] **Batch classification** — Upload a CSV of emails and classify all at once
- [ ] **Feedback loop** — Let users correct wrong predictions to retrain the model
- [ ] **Docker Compose** — Single command to start all three services
- [ ] **Model comparison** — A/B test Naive Bayes vs. Logistic Regression vs. SVM
- [ ] **Explainability** — Show which words contributed most to the spam score
- [ ] **Dark/light theme toggle** — Frontend UI enhancement

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Axios, CSS3 |
| Backend | Java 17, Spring Boot 3, Gradle |
| ML Service | Python 3, Flask 3, scikit-learn |
| ML Model | Multinomial Naive Bayes + TF-IDF |
| Communication | HTTP REST (JSON) |

---

## Troubleshooting

**Flask not starting?**
```bash
pip install -r requirements.txt
python app.py
```

**Spring Boot can't reach Flask?**
Verify Flask is on port 5000: `curl http://localhost:5000/health`

**React can't reach Spring Boot?**
Verify Spring Boot is on port 8080: `curl http://localhost:8080/api/health`

**CORS errors in browser?**
`CorsConfig.java` allows `http://localhost:3000`. If your React runs on a different port, update `allowedOrigins` in `CorsConfig.java` and `@CrossOrigin` in `SpamController.java`.
