import json
import imp
import sys
import os
sys.modules["sqlite"] = imp.new_module("sqlite")
sys.modules["sqlite3.dbapi2"] = imp.new_module("sqlite.dbapi2")

import nltk

from nltk.sentiment.vader import SentimentIntensityAnalyzer
from nltk.sentiment.util import *
from nltk.sentiment.sentiment_analyzer import SentimentAnalyzer
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords



"""
The main handler function called by the lambda
"""
def main(event, context):

    reviews_list = json.loads(event["body"])
    processed_reviews = analyze_reviews(reviews_list)

    body = {
        "message": "Successfully called the nlp lambda!",
        "input": processed_reviews
    }

    response = {
        "statusCode": 200,
        "body": json.dumps(body)
    }

    return response



"""
Function that will do the actual sentiment analysis

Returns sentiment:
sentiment type: dictionary of 4 scores, pos, neg, com, neu
{pos: ,neg: ,com: , neu: }

Param text: text to analyze (goal is a whole review)
text type: string "Review string"

Param analyzer: the analyzer object that analyzes the text
analyzer type: SentimentIntensityAnalyzer() object from nltk
"""
def analyze_text(text, analyzer):
    sentiment = analyzer.polarity_scores(text)

    # Goal is to take in a whole review for the text
    # and do the majority of the review manipulation
    # and analyzing in ths function here


    return sentiment    # Return the sentiment score



"""
Function to take in a list of reviews and analyze them
param reviews_list: list of reviews where reviews are dictionaries
[{},{},{}]
"""
def analyze_reviews(reviews_list):

    s = SentimentIntensityAnalyzer()    # Initialize the analyzer object
    list_processed_reviews = []           # Initialize the return list

    # For each review in the list
    for index, review in enumerate(reviews_list):
        good = 0.0
        bad = 0.0
        comp = 0.0

        processed_review = review

        # Currently analyzing by sentence, but goal is to analyze by review
        if review["text"].strip() != "":
            try:
                # Tokenize reviews into sentences
                sentences = sent_tokenize(review["text"])

                # Analyze each sentence
                for sentence in sentences:
                    sentiment_scores = analyze_text(sentence, s)

                    if sentiment_scores['pos'] > good:
                        good = sentiment_scores['pos']

                    if sentiment_scores['neg'] > bad:
                        bad = sentiment_scores['neg']

                    if abs(sentiment_scores['compound']) > abs(compound):
                        compound = sentiment_scores['compound']

                processed_review['neg'] = bad
                processed_review['pos'] = good
                processed_review['compound'] = compound

                list_processed_reviews.append(processed_review)

            except:
                print("An error has occurred tokenizing or analyzing the text")

    return list_processed_reviews
