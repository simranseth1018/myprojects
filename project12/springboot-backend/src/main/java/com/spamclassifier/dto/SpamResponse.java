package com.spamclassifier.dto;

/**
 * DTO returned to the React frontend after classification.
 *
 * Fields:
 *   prediction    - human-readable label: "Spam" or "Not Spam"
 *   confidence    - probability percentage (0–100) for the predicted class
 *   rawPrediction - internal label from the ML model: "spam" or "ham"
 */
public class SpamResponse {

    private String prediction;
    private double confidence;
    private String rawPrediction;

    // Default constructor required for Jackson serialization
    public SpamResponse() {}

    public SpamResponse(String prediction, double confidence, String rawPrediction) {
        this.prediction = prediction;
        this.confidence = confidence;
        this.rawPrediction = rawPrediction;
    }

    public String getPrediction() { return prediction; }
    public void setPrediction(String prediction) { this.prediction = prediction; }

    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }

    public String getRawPrediction() { return rawPrediction; }
    public void setRawPrediction(String rawPrediction) { this.rawPrediction = rawPrediction; }
}
