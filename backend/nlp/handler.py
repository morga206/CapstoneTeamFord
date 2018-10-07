""" Handler for nlp code, takes in text and analyzes
"""
import json
import imp
import sys

sys.modules["sqlite"] = imp.new_module("sqlite")
sys.modules["sqlite3.dbapi2"] = imp.new_module("sqlite.dbapi2")

#pylint: disable=wrong-import-position,unused-import
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
#from nltk.sentiment.sentiment_analyzer import SentimentAnalyzer
from nltk.tokenize import sent_tokenize
#from nltk.corpus import stopwords



def main(event, _):
    """ Lambda Handler main function

    Keyword arguments:
    event -- POST event that triggers this lambda
    _context -- unused variable
    """

    reviews_list = json.loads(event["body"])
    processed_reviews = analyze_reviews(reviews_list)

    body = {
        "message": "AWS Lambda Success",
        "input": processed_reviews
    }

    response = {
        "statusCode": 200,
        "body": json.dumps(body)
    }

    return response




def analyze_text(text, analyzer):
    """ analyze the text

    Keyword arguments:
    text -- text to analyze
    analyzer -- the analyzer object
    """

    sentiment = analyzer.polarity_scores(text)

    # Goal is to take in a whole review for the text
    # and do the majority of the review manipulation
    # and analyzing in ths function here

    return sentiment    # Return the sentiment score




def analyze_reviews(reviews_list):
    """ Analyze a list of reviews

    Keyword arguments:
    reviews_list -- list of review json formatted objects
    """

    sent_analyzer = SentimentIntensityAnalyzer()    # Initialize the analyzer object
    list_processed_reviews = []           # Initialize the return list

    # For each review in the list
    for review in reviews_list:
        good = 0.0
        bad = 0.0
        compound = 0.0

        processed_review = review

        # Currently analyzing by sentence, but goal is to analyze by review
        if review["text"].strip() != "":
            # Tokenize reviews into sentences
            sentences = sent_tokenize(review["text"])

            #try:
                # Analyze each sentence
            for sentence in sentences:
                sentiment_scores = analyze_text(sentence, sent_analyzer)

                if sentiment_scores['pos'] > good:
                    good = sentiment_scores['pos']

                if sentiment_scores['neg'] > bad:
                    bad = sentiment_scores['neg']

                #if abs(sentiment_scores['compound']) > abs(compound):
                compound += sentiment_scores['compound']

            processed_review['neg'] = bad
            processed_review['pos'] = good
            processed_review['compound'] = compound

            list_processed_reviews.append(processed_review)

            #except:
             #   print("An error has analyzing the text")

    return list_processed_reviews
