package sentiment.stats;

import com.amazonaws.services.dynamodbv2.model.AttributeValue;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Handles calculation of top N keywords from a list of DynamoDB reviews.
 */
public class KeywordsCalculation extends StatCalculation {
  /**
   * The number of keywords to return for each review category.
   */
  private static final int NUM_KEYWORDS = 4;

  /**
   * The list of keywords present in at least one positive review.
   */
  private List<String> positiveKeywords = new ArrayList<String>();

  /**
   * The list of keywords present in at least one negative review.
   */
  private List<String> negativeKeywords = new ArrayList<String>();

  public KeywordsCalculation(List<Map<String, AttributeValue>> items) {
    super(items);
  }

  /**
   * Runs the Keywords calculation.
   * @return An OutgoingStat containing the calculation results.
   */
  public OutgoingStat<?, ?> calculate() {
    // Mapping step: DB Item -> Keyword Lists
    separateKeywordsByReviewSentiment();

    // Reducing step: Keyword Values -> Counts
    Map<String, Integer> positiveKeywordCounts = countKeywords(positiveKeywords);
    Map<String, Integer> negativeKeywordCounts = countKeywords(negativeKeywords);

    // Get top N keywords and map them to percentages
    Keyword[] positiveResults = 
      calculateKeywordPercentages(positiveKeywordCounts, positiveKeywords.size());
    Keyword[] negativeResults = 
      calculateKeywordPercentages(negativeKeywordCounts, negativeKeywords.size());


    // Wrap result in a Map for Jackson to serialize
    Map<String, Keyword[]> result = new HashMap<String, Keyword[]>();
    result.put("positive", positiveResults);
    result.put("negative", negativeResults);

    return new OutgoingStat<String, Keyword[]>("keywords", result);
  }

  /**
   * Processes a list of DynamoDB reviews into two two sets of keywords.
   * One set includes keywords from positive reviews, the other from negative.
   */
  private void separateKeywordsByReviewSentiment() {
    for (Map<String, AttributeValue> item : items) {
      if (item.get("sentiment").getS().equals("POSITIVE")) {
        List<AttributeValue> keywordValues = item.get("keywords").getL();
        List<String> keywords = dynamoKeywordsToList(keywordValues);
        
        positiveKeywords.addAll(keywords);
      } else if (item.get("sentiment").getS().equals("NEGATIVE")) {
        List<AttributeValue> keywordValues = item.get("keywords").getL();
        List<String> keywords = dynamoKeywordsToList(keywordValues);
        
        negativeKeywords.addAll(keywords);
      }
    }
  }

  /**
   * Converts a list of DynamoDB AttributeValues to a list of String keywords.
   * @param keywordValues The DynamoDB values to process.
   * @return A list of String keywords.
   */
  private List<String> dynamoKeywordsToList(List<AttributeValue> keywordValues) {
    List<String> keywords = new ArrayList<String>();
    for (AttributeValue keyword : keywordValues) {
      keywords.add(keyword.getS());
    }
    return keywords;
  }

  /**
   * Given a list of keywords, counts the number of occurrences of each keyword.
   * @param keywordList The list of keywords to process.
   * @return A mapping from keyword to number of occurrences.
   */
  private Map<String, Integer> countKeywords(List<String> keywordList) {
    Map<String, Integer> counts = new HashMap<String, Integer>();
    for (String keyword : keywordList) {
      if (counts.containsKey(keyword)) {
        counts.put(keyword, counts.get(keyword) + 1);
      } else {
        counts.put(keyword, 1);
      }
    }
    return counts;
  }

  /**
   * Calculates the percentage of reviews each keyword occurs in and return a Keyword object.
   * @param keywordCounts A mapping from keyword to number of occurrences.
   * @param totalReviews The total number of reviews in this sample.
   * @return An array of Keyword objects
   */
  private Keyword[] calculateKeywordPercentages(
      Map<String, Integer> keywordCounts, int totalReviews) {
    return keywordCounts.entrySet().stream()
    .sorted(Map.Entry.comparingByValue(Collections.reverseOrder())) // Sort by count, decreasing
    .limit(NUM_KEYWORDS) // Get only top N results
    .map(keyword -> { // Convert count to percentage, create keyword object
      double percentage = 
          keyword.getValue() == 0 ? 0 : (double)keyword.getValue() / totalReviews * 100;
      return new Keyword(keyword.getKey(), percentage);
    })
    .toArray(Keyword[]::new); // Collect in array
  }
}