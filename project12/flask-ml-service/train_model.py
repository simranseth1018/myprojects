"""
train_model.py - Train and save the Spam Email Classifier

NLP Concepts Used:
-----------------
1. Tokenization: Breaking text into individual words/tokens
2. Vectorization: Converting text tokens into numerical features using TF-IDF
   - TF (Term Frequency): How often a word appears in a document
   - IDF (Inverse Document Frequency): Penalizes words that appear in many documents
3. Naive Bayes: Probabilistic classifier based on Bayes theorem
   - "Naive" because it assumes feature independence
   - MultinomialNB works well with word count/frequency features
4. Spam Classification: Binary classification (spam vs ham/not-spam)
"""

import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# ---------------------------------------------------------------------------
# Sample dataset: real-world-like spam and ham (legitimate) messages
# In production, use the UCI SMS Spam Collection dataset or similar
# ---------------------------------------------------------------------------

SPAM_MESSAGES = [
    "Congratulations! You've won a $1000 gift card. Click here to claim now!",
    "FREE entry in 2 a weekly competition to win FA Cup final tickets 21st May 2005!",
    "WINNER!! As a valued network customer you have been selected to receive a £900 prize reward!",
    "You have been selected for a cash prize of $5000. Call now to claim!",
    "Urgent! Your account has been compromised. Verify now at http://fake-bank.com",
    "Get rich quick! Make $500 per day working from home!",
    "LIMITED TIME OFFER: Buy 1 Get 2 Free! Click here for instant discount!",
    "You are a winner of the weekly lottery! Claim your prize now!",
    "Cheap medications online! No prescription needed! 90% off!",
    "Hot singles in your area! Click here to meet them now!",
    "Your loan has been approved! Get $10,000 instantly. Call 1-800-LOAN-NOW",
    "Earn $$$$ from home! No experience needed! Start today!",
    "CONGRATULATIONS! Click the link to claim your free iPhone 14!",
    "Special offer just for you! 99% discount on all products today only!",
    "Act now! This limited offer expires in 24 hours. Don't miss out!",
    "You've been pre-approved for a credit card with 0% interest. Apply now!",
    "Make money fast! Join our network and earn $2000 weekly!",
    "Your PayPal account is suspended. Verify your identity immediately!",
    "Free vacation! You've been selected for an all-expenses paid trip!",
    "Investment opportunity! Double your money in 30 days guaranteed!",
    "URGENT: IRS notice. You owe back taxes. Call immediately to avoid arrest.",
    "Nigerian prince needs your help. $10 million dollar reward awaits you!",
    "Miracle weight loss pill! Lose 30 pounds in 30 days! No diet needed!",
    "Your computer is infected with virus! Call Microsoft support now: 1-800-xxx",
    "Win a brand new car! Enter our sweepstakes for free! No purchase necessary!",
    "Hot deals on Rolex watches! 80% off authentic timepieces! Limited stock!",
    "Make $3000 per week from home! No experience required. Start immediately!",
    "You have 1 new message from an admirer. Click to see who likes you!",
    "Final notice: Your subscription expires today. Renew now to avoid charges!",
    "Exclusive member benefits! Claim your free gift card worth $500 today!",
    "CASH PRIZE! You have won our monthly draw. Reply with your bank details.",
    "Buy Viagra online! Cheapest prices guaranteed. No prescription required!",
    "Lose weight fast! Our secret formula melts fat overnight! Order now!",
    "You owe us money. Pay now or face legal action. Click to settle debt.",
    "Free ringtones! Text WIN to 80488. Standard rates apply.",
    "Your account will be closed. Confirm details at secure-login.fake.com",
    "Amazing business opportunity! Passive income of $5000 a month!",
    "Claim your FREE Netflix subscription! Limited time offer today!",
    "Congratulations you have been chosen! Reply YES to claim your prize.",
    "ALERT: Your bank account has suspicious activity. Verify now!",
]

HAM_MESSAGES = [
    "Hey, are you free to grab coffee tomorrow morning?",
    "The meeting has been rescheduled to 3 PM on Thursday.",
    "Can you please send me the report when you get a chance?",
    "Happy birthday! Hope you have a wonderful day!",
    "I'll be home late tonight, don't wait up for dinner.",
    "The project deadline has been extended to next Friday.",
    "Did you see the game last night? It was incredible!",
    "Please review the attached document and provide feedback.",
    "I'm running 10 minutes late for our meeting. Sorry!",
    "Can we reschedule our call to tomorrow at 2 PM?",
    "The groceries you asked for are in the fridge.",
    "Don't forget about mom's birthday party on Sunday.",
    "The quarterly results look promising. Let's discuss next week.",
    "I've booked a table for dinner at 7 PM tonight.",
    "Your package has been delivered to the front door.",
    "Great work on the presentation! Everyone loved it.",
    "Reminder: Doctor appointment tomorrow at 10 AM.",
    "The kids' school play is on Friday at 6 PM.",
    "Can you pick up the dry cleaning on your way home?",
    "Meeting notes from today's session are attached.",
    "The internet was down this morning but it's working now.",
    "Looking forward to seeing you at the conference next week.",
    "I finished reading that book you recommended. Loved it!",
    "The car needs an oil change. Can you schedule it?",
    "Thanks for helping me with the project yesterday!",
    "Lunch tomorrow at our usual spot? Noon works for me.",
    "Please find attached the invoice for last month's services.",
    "The weather looks nice this weekend, let's go hiking!",
    "I'll send you the draft proposal by end of day.",
    "Just checking in to see how you're doing. Hope all is well!",
    "Your subscription renewal is confirmed. Thanks for staying with us.",
    "Hi, I wanted to follow up on our conversation from last week.",
    "Could you please review the PR I submitted this morning?",
    "The team is going out for lunch on Wednesday. Want to join?",
    "Your order #12345 has been shipped. Expected delivery: Friday.",
    "Please complete the survey about your recent customer experience.",
    "We've updated our privacy policy. Please review the changes.",
    "The office will be closed on Monday for the public holiday.",
    "Reminder: your library books are due back by this Friday.",
    "Thank you for attending our webinar. Here are the slides.",
]


def train_and_save():
    """
    Train the spam classifier using TF-IDF + Naive Bayes and persist to disk.

    Pipeline:
        raw text -> TF-IDF vectorization -> MultinomialNB classifier -> pickle files
    """
    print("=" * 55)
    print("  Spam Email Classifier - Model Training")
    print("=" * 55)

    # Combine spam and ham into one dataset
    messages = SPAM_MESSAGES + HAM_MESSAGES
    labels = ["spam"] * len(SPAM_MESSAGES) + ["ham"] * len(HAM_MESSAGES)

    print(f"\nDataset: {len(SPAM_MESSAGES)} spam + {len(HAM_MESSAGES)} ham = {len(messages)} total")

    # Stratified split ensures equal class representation in train/test sets
    X_train, X_test, y_train, y_test = train_test_split(
        messages, labels, test_size=0.2, random_state=42, stratify=labels
    )
    print(f"Training samples: {len(X_train)} | Test samples: {len(X_test)}")

    # ------------------------------------------------------------------
    # TF-IDF Vectorization
    # ------------------------------------------------------------------
    # Converts raw text into a matrix of TF-IDF features:
    #   - lowercase=True        : normalizes case (Hello == hello)
    #   - stop_words='english'  : removes low-signal words (the, is, a, ...)
    #   - max_features=5000     : keeps only the top 5000 terms
    #   - ngram_range=(1, 2)    : includes single words AND word pairs
    #                             e.g., "win prize" as one feature
    # ------------------------------------------------------------------
    print("\nVectorizing text with TF-IDF...")
    vectorizer = TfidfVectorizer(
        lowercase=True,
        stop_words="english",
        max_features=5000,
        ngram_range=(1, 2),
    )

    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # ------------------------------------------------------------------
    # Naive Bayes Training
    # ------------------------------------------------------------------
    # MultinomialNB is ideal for text classification with TF-IDF/count features.
    # It models the probability P(label | features) using Bayes theorem:
    #   P(spam | email) ∝ P(spam) * P(word1|spam) * P(word2|spam) * ...
    # alpha=0.1 applies Laplace smoothing to handle unseen words.
    # ------------------------------------------------------------------
    print("Training Multinomial Naive Bayes classifier...")
    model = MultinomialNB(alpha=0.1)
    model.fit(X_train_vec, y_train)

    # Evaluate on the test set
    y_pred = model.predict(X_test_vec)
    accuracy = accuracy_score(y_test, y_pred)

    print(f"\nModel Accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["ham", "spam"]))

    # Persist trained artifacts so app.py can load them without re-training
    print("Saving model artifacts...")
    with open("spam_classifier.pkl", "wb") as f:
        pickle.dump(model, f)
    with open("vectorizer.pkl", "wb") as f:
        pickle.dump(vectorizer, f)

    print("Model saved: spam_classifier.pkl, vectorizer.pkl")
    print("=" * 55)
    return model, vectorizer


if __name__ == "__main__":
    train_and_save()
