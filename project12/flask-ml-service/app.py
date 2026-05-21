"""
app.py - Flask ML Service for Spam Email Classification

Exposes:
    GET  /health   -> service health check
    POST /predict  -> classify email as spam or not spam

The model is trained once (via train_model.py) and loaded at startup.
"""

import os
import pickle

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
# Allow cross-origin requests from the Spring Boot backend and React dev server
CORS(app)

MODEL_PATH = "spam_classifier.pkl"
VECTORIZER_PATH = "vectorizer.pkl"

# Global model and vectorizer objects (loaded once at startup)
model = None
vectorizer = None


def load_model():
    """Load the pre-trained model and vectorizer from disk. Train if missing."""
    global model, vectorizer

    if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        with open(VECTORIZER_PATH, "rb") as f:
            vectorizer = pickle.load(f)
        print("Model loaded successfully.")
    else:
        print("Trained model not found. Training now — this may take a moment...")
        from train_model import train_and_save
        model, vectorizer = train_and_save()
        print("Training complete. Model is ready.")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint used by Spring Boot to verify service availability."""
    return jsonify({
        "status": "OK",
        "service": "Flask ML Service",
        "model_loaded": model is not None,
    })


@app.route("/predict", methods=["POST"])
def predict():
    """
    Classify an email message as Spam or Not Spam.

    Request body (JSON):
        { "message": "<email text>" }

    Response (JSON):
        {
            "prediction":     "Spam" | "Not Spam",
            "confidence":     <float 0-100>,
            "raw_prediction": "spam" | "ham"
        }
    """
    data = request.get_json(silent=True)

    # --- Input validation ---
    if not data or "message" not in data:
        return jsonify({"error": "Request body must contain a 'message' field."}), 400

    message = data["message"].strip()
    if not message:
        return jsonify({"error": "Message field cannot be empty."}), 400

    try:
        # Step 1: Vectorize the raw text using the same TF-IDF settings used during training
        message_vectorized = vectorizer.transform([message])

        # Step 2: Run inference
        raw_prediction = model.predict(message_vectorized)[0]          # "spam" or "ham"
        probabilities = model.predict_proba(message_vectorized)[0]     # [P(ham), P(spam)]

        # Step 3: Extract confidence for the predicted class
        class_list = list(model.classes_)                              # e.g. ["ham", "spam"]
        predicted_idx = class_list.index(raw_prediction)
        confidence = round(float(probabilities[predicted_idx]) * 100, 2)

        human_label = "Spam" if raw_prediction == "spam" else "Not Spam"

        return jsonify({
            "prediction": human_label,
            "confidence": confidence,
            "raw_prediction": raw_prediction,
        })

    except Exception as exc:
        app.logger.error("Prediction error: %s", exc)
        return jsonify({"error": f"Prediction failed: {str(exc)}"}), 500


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    load_model()
    app.run(debug=True, host="0.0.0.0", port=5000)
