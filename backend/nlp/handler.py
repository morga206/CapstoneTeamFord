""" Handler for nlp code, takes in text and analyzes
"""
import json
import imp
import sys
import os

sys.modules["sqlite"] = imp.new_module("sqlite")
sys.modules["sqlite3.dbapi2"] = imp.new_module("sqlite.dbapi2")

#pylint: disable=unused-import
#pylint: disable=import-error

import nltk
import boto3
from nltk.sentiment.vader import SentimentIntensityAnalyzer
#from nltk.sentiment.sentiment_analyzer import SentimentAnalyzer
from nltk.tokenize import sent_tokenize
#from nltk.corpus import stopwords

STAGE = os.environ.get('STAGE')
TABLE_NAME = os.environ.get('TABLE_NAME')
DEPLOY_REGION = os.environ.get('DEPLOY_REGION')


def main(event, _):
    """ Lambda Handler main function

    Keyword arguments:
    event -- POST event that triggers this lambda
    _context -- unused variable
    """

    processed_reviews = analyze_reviews(event)

    write_reviews_to_db(processed_reviews)

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

    # Initialize the analyzer object
    sent_analyzer = SentimentIntensityAnalyzer()

    # Initialize the return list
    list_processed_reviews = []
    remove_fields = []

    # For each review in the list
    for review in reviews_list:
        good = 0.0
        bad = 0.0
        compound = 0.0
        neutral = 0.0

        # Currently analyzing by sentence, but goal is to analyze by review
        if review["review"]["text"].strip() != "":
            # Tokenize reviews into sentences
            sentences = sent_tokenize(review["review"]["text"])

            # Analyze each sentence
            for sentence in sentences:
                sentiment_scores = analyze_text(sentence, sent_analyzer)

                # Gather the extreme sentiment scores from all sentences

                if sentiment_scores['pos'] > good:
                    good = sentiment_scores['pos']

                if sentiment_scores['neg'] > bad:
                    bad = sentiment_scores['neg']

                neutral += sentiment_scores['neu']
                compound += sentiment_scores['compound']

            compound /= len(sentences)
            neutral /= len(sentences)

            review['neuSentiment'] = int(neutral * 100)
            review['negSentiment'] = int(bad * 100)
            review['posSentiment'] = int(good * 100)
            review['compSentiment'] = int(compound * 100)

            remove_fields.clear()

            for field in review["review"]:
                print("examining field", field)
                if review["review"][field] == "":
                    print("adding field to remove list", field)
                    remove_fields.append(field)

            for field in remove_fields:
                print("attempting to remove field", field, "from", review)

                del review["review"][field]

            list_processed_reviews.append(review)

    return list_processed_reviews


def write_reviews_to_db(reviews_list):
    """ Given a list of reviews that are analyzed, update database

    Key arguments
    reviews_list -- list of reviews to put in database
    """

    dynamodb = boto3.resource('dynamodb')

    table = dynamodb.Table(TABLE_NAME)


    for review in reviews_list:

        table.put_item(Item=review)
