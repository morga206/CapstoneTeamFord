package sentiment.stats;

import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagement;
import com.amazonaws.services.simplesystemsmanagement.model.GetParameterRequest;
import com.amazonaws.services.simplesystemsmanagement.model.GetParameterResult;
import com.amazonaws.services.simplesystemsmanagement.model.ParameterNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Handles calculation of top N keywords from a list of DynamoDB reviews.
 */
public class KeywordsCalculation extends StatCalculation {
  private static final String STAGE = System.getenv("STAGE");

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

  /**
   * The total number of positive reviews.
   */
  private int positiveReviews = 0;

  /**
   * The total number of negative reviews.
   */
  private int negativeReviews = 0;

  /**
   * The SSM client to use.
   */
  private AWSSimpleSystemsManagement client;

  public KeywordsCalculation(
      List<Map<String, AttributeValue>> items, 
      AWSSimpleSystemsManagement client) {
    super(items);
    this.client = client;
  }

  /**
   * Runs the Keywords calculation.
   * @return An OutgoingStat containing the calculation results.
   */
  public OutgoingStat<?, ?> calculate() {
    // Mapping step: DB Item -> Keyword Lists
    separateKeywordsByReviewSentiment();

    // Get ignore list from SSM
    List<String> ignoreList = getIgnoreList();

    // Reducing step: Keyword Values -> Counts
    Map<String, Integer> positiveKeywordCounts = countKeywords(positiveKeywords, ignoreList);
    Map<String, Integer> negativeKeywordCounts = countKeywords(negativeKeywords, ignoreList);
    System.out.println("Positive Keyword Counts: ");

    // Get top N keywords and map them to percentages
    Keyword[] positiveResults = 
      calculateKeywordPercentages(positiveKeywordCounts, positiveReviews);
    Keyword[] negativeResults = 
      calculateKeywordPercentages(negativeKeywordCounts, negativeReviews);


    // Wrap result in a Map for Jackson to serialize
    Map<String, Keyword[]> result = new HashMap<String, Keyword[]>();
    result.put("positive", positiveResults);
    result.put("negative", negativeResults);

    return new OutgoingStat<String, Keyword[]>("keywords", result);
  }

  private List<String> getIgnoreList() {
    GetParameterResult result = null;
    String value = null;
    try {
      result = client.getParameter(new GetParameterRequest().withName("ignoreList-" + STAGE));
      value = result.getParameter().getValue();
    } catch (ParameterNotFoundException exp) {
      value = "[]";
    }

    try {
      String[] ignoreArray = new ObjectMapper().readValue(value, String[].class);
      return Arrays.asList(ignoreArray);
    } catch (Exception exp) {
      return new ArrayList<String>();
    }
  }

  /**
   * Processes a list of DynamoDB reviews into two two sets of keywords.
   * One set includes keywords from positive reviews, the other from negative.
   */
  private void separateKeywordsByReviewSentiment() {
    for (Map<String, AttributeValue> item : items) {
      if (item.get("sentiment").getS().equals("POSITIVE")) {
        positiveReviews++;
        List<AttributeValue> keywordValues = item.get("keywords").getL();
        List<String> keywords = dynamoKeywordsToList(keywordValues);
        
        positiveKeywords.addAll(keywords);
      } else if (item.get("sentiment").getS().equals("NEGATIVE")) {
        negativeReviews++;
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
   * @param ignoreList The list of words to ignore when counting.
   * @return A mapping from keyword to number of occurrences.
   */
  private Map<String, Integer> countKeywords(List<String> keywordList, List<String> ignoreList) {
    Map<String, Integer> counts = new HashMap<String, Integer>();
    for (String rawKeyword : keywordList) {
      String keyword = rawKeyword.toLowerCase();
      if (ignoreList.stream()
          // Check for partial matches in ignoreList
          .filter((String word) -> keyword.contains(word)) 
          // If match is found...
          .findAny().isPresent()) { 
        // Don't count words in the ignore list
        continue;
      }

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