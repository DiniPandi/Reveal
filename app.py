from flask import Flask, request, jsonify, render_template
import pickle
import numpy as np
from flask_cors import CORS
from selenium import webdriver
from bs4 import BeautifulSoup
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from collections import Counter
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)


with open('model.pkl', 'rb') as f:
    model = pickle.load(f)

with open('vector.pkl', 'rb') as f:
    vectorizer = pickle.load(f)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    reviewText = data.get('textReview')
    url = data.get('url')

    summarizedReview = summary(url, reviewText)
    comparisonSummary, similarityPercentage = comparison(reviewText,summarizedReview)

    if reviewText is not None:
        text_transformed = vectorizer.transform([reviewText])

        prediction = model.predict(text_transformed)[0]

        return jsonify({'prediction': int(prediction), 'summarizedReview': summarizedReview, 'comparison': comparisonSummary, 'percentage': similarityPercentage})
    else:
        return jsonify({'error': 'Input text not provided.'})
    
def summary(url, reviewText):
    driver = webdriver.Chrome()
    driver.get(url)
    page_source = driver.page_source
    soup = BeautifulSoup(page_source, 'html.parser')
    reviews = soup.find_all('span', class_='wiI7pd')
    driver.quit()
    allReviews = []
    for i in range (0,len(reviews)): allReviews.append(reviews[i].get_text())
    print(url)

    sentences = [sent_tokenize(review) for review in allReviews]
    words = [word_tokenize(review) for review in allReviews]

    sentences = [sentence for sublist in sentences for sentence in sublist]
    words = [word for sublist in words for word in sublist]

    stop_words = set(stopwords.words('english'))
    filtered_words = [word.lower() for word in words if word.isalnum() and word.lower() not in stop_words]

    word_freq = Counter(filtered_words)
    most_common_words = word_freq.most_common(5)

    positive_words = ['good', 'great', 'amazing', 'excellent', 'wonderful', 'delicious', 'remarkable', 'outstanding']
    negative_words = ['bad', 'poor', 'terrible', 'awful']

    positive_sentences = [sentence for sentence in sentences if any(word in sentence.lower() for word in positive_words)]
    negative_sentences = [sentence for sentence in sentences if any(word in sentence.lower() for word in negative_words)]

    summary = f"This place is known for its {', '.join([word for word, _ in most_common_words])}. " \
        f"Visitors have described it as {', '.join(positive_sentences)}."\
        f"as Positive feedbacks and {', '.join(negative_sentences)}."
    return summary
    
def comparison(reviewText,summarizedReview):
    customer_review_processed = preprocess(reviewText)
    summarized_review_processed = preprocess(summarizedReview)

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([customer_review_processed, summarized_review_processed])

    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)[0, 1]
    similarity_percentage = int(cosine_sim * 100) 


    if cosine_sim < 0.7:
        # Calculate word frequency for each review
        word_freq_customer = Counter(word_tokenize(customer_review_processed))
        word_freq_summarized = Counter(word_tokenize(summarized_review_processed))
        
        # Find words that are unique to each review
        unique_to_customer = set(word_freq_customer.keys()) - set(word_freq_summarized.keys())
        unique_to_summarized = set(word_freq_summarized.keys()) - set(word_freq_customer.keys())
        
        insights = f"The customer review and the summarized review are quite different. " \
                f"Unique words in customer review: {', '.join(unique_to_customer)}. " \
                f"Unique words in summarized review: {', '.join(unique_to_summarized)}."
    else:
        insights = "The customer review and the summarized review are similar."\
    
    return insights, similarity_percentage


def preprocess(review):
    lemmatizer = WordNetLemmatizer()
    stop_words_compare = set(stopwords.words('english'))

    tokens = word_tokenize(review.lower())
    filtered_tokens = [lemmatizer.lemmatize(token) for token in tokens if token.isalnum() and token.lower() not in stop_words_compare]
    return " ".join(filtered_tokens)


if __name__ == '__main__':
    app.run(debug=True)