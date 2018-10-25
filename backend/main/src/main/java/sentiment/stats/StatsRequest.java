package sentiment.stats;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.dynamodbv2.model.QueryRequest;
import com.amazonaws.services.dynamodbv2.model.QueryResult;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import sentiment.Request;
import sentiment.Response;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.stream.Stream;


/**
 * Request format for the sentiment stats function.
 */
public class StatsRequest extends Request {

  private static final String REGION = System.getenv("DEPLOY_REGION");
  private static final String TABLE = System.getenv("TABLE_NAME");

  private static final int NUM_KEYWORDS = 4;

  /**
  * The id and store for the app to compile stats for.
  */
  private String appIdStore;

  /**
   * The app version to query.
   */
  private String version;

  /**
   * The beginning of the date range to query.
   */
  private LocalDate startDate;

  /**
   * The end of the date range to query.
   */
  private LocalDate endDate;

  /**
   * The specific stats to compile.
   */
  private IncomingStat[] stats;

  /**
   * Primary constructor.
   * @param appIdStore The appId and store to query
   * @param version The app version to query
   * @param startDate The start of the date window
   * @param endDate The end of the date window
   * @param stats The list of stats to calculate, plus any parameters
   */
  @JsonCreator
  public StatsRequest(
      @JsonProperty("appIdStore") String appIdStore, 
      @JsonProperty("version") String version, 
      @JsonProperty("startDate") String startDate, 
      @JsonProperty("endDate") String endDate, 
      @JsonProperty("stats") IncomingStat[] stats) {
    this.appIdStore = appIdStore;
    this.version = version;

    DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
    this.startDate = LocalDate.parse(startDate, formatter);
    this.endDate = LocalDate.parse(endDate, formatter);
    this.stats = stats;
  }

  /**
   * Process the data for this request and return a response to send back.
   */
  public Response process() {
    AmazonDynamoDB client = AmazonDynamoDBClientBuilder.standard().withRegion(REGION).build();
    List<Map<String, AttributeValue>> items = 
        getDynamoReviews(client, 
                         appIdStore, 
                         version, 
                         startDate, 
                         endDate);
    OutgoingStat<?, ?>[] stats = calculateStats(items, this.stats);

    return new StatsResponse(stats);
  }

  /**
   * Query DynamoDB for reviews that match the given critera and return a list.
   * @param db The DyanmoDB object to use
   * @param appIdStore The App ID and Store for the app we're analyzing
   * @param version The app version to analyze
   * @param startDate The start of the date range
   * @param endDate The end of the date range
   * @return A list of DynamoDB entries
   */
  private List<Map<String, AttributeValue>> getDynamoReviews(AmazonDynamoDB db, 
      String appIdStore, String version, LocalDate startDate, LocalDate endDate) {

    HashMap<String, String> nameMap = new HashMap<String, String>();
    nameMap.put("#dte", "date"); // Date is a reserved word in DynamoDB

    LocalDate dayAfterEnd = endDate.plusDays(1);

    HashMap<String, AttributeValue> valueMap = new HashMap<String, AttributeValue>();
    valueMap.put(":id", new AttributeValue().withS(appIdStore));
    // Start is a reserved word
    valueMap.put(":strt", new AttributeValue().withS(startDate.toString())); 
    // End is a reserved word
    valueMap.put(":en", new AttributeValue().withS(dayAfterEnd.toString()));
    valueMap.put(":version", new AttributeValue().withS(version));

    QueryRequest queryRequest = new QueryRequest()
        .withTableName(TABLE).withIndexName("date")
        .withKeyConditionExpression("appIdStore = :id and #dte between :strt and :en")
        .withFilterExpression("version = :version")
        .withExpressionAttributeNames(nameMap)
        .withExpressionAttributeValues(valueMap);
    
    QueryResult queryResult = null;
    List<Map<String, AttributeValue>> items = null;

    try {
      queryResult = db.query(queryRequest);
      items = queryResult.getItems();
    } catch (Exception exp) {
      System.err.println("Unable to query reviews from DyanmoDB");
      System.err.println(exp.getMessage());
    }

    return items;
  }

  /**
   * Call the appropriate functions to calculate all the stats from the request.
   * @param items The list of items from the db
   * @param stats The array of stats to calculate
   * @return An array of OutgoingStats to be place in the response
   */
  protected OutgoingStat<?, ?>[] calculateStats(List<Map<String, AttributeValue>> items, 
      IncomingStat[] stats) {
    OutgoingStat<?, ?>[] results = new OutgoingStat<?, ?>[stats.length];
    int nextIndex = 0;
    for (IncomingStat stat : stats) {
      switch (stat.getName()) {
        case "rawReviews":
          results[nextIndex] = processRawReviews(items);
          nextIndex++;
          break;
        case "overallSentiment":
          results[nextIndex] = processOverallSentiment(items);
          nextIndex++;
          break;
        case "keywords":
          results[nextIndex] = processKeywords(items);
          nextIndex++;
          break;
        case "sentimentOverTime":
          results[nextIndex] = processSentimentOverTime(items);
          nextIndex++;
          break;
        default:
          System.err.println("No method found to processs statistic " + stat.getName());
      }
    }
    return results;
  }

  protected OutgoingStat<String, String> processRawReviews(
      List<Map<String, AttributeValue>> items) {
    Map<String, String> result = new HashMap<String, String>();

    for (Map<String, AttributeValue> item : items) {
      Map<String, String> review = new HashMap<String, String>();
      item.forEach((key, val) -> {
        if (val.getS() != null) {
          review.put(key, val.getS());
        } else if (val.getN() != null) {
          review.put(key, val.getN());
        }
      });

      try {
        String json = new ObjectMapper().writeValueAsString(review);
        result.put(review.get("reviewHash"), json);
      } catch (JsonProcessingException exp) {
        System.err.println("Error converting rawReviews to JSON");
        System.err.println(exp.getMessage());
      }
    }


    return new OutgoingStat<String, String>("rawReviews", result);
  }

  protected OutgoingStat<String, Double> processOverallSentiment(
      List<Map<String, AttributeValue>> items) {
    // Mapping step: DB Item -> Sentiment Value
    List<String> sentimentValues = new ArrayList<String>();
    for (Map<String, AttributeValue> item : items) {
      sentimentValues.add(item.get("sentiment").getS());
    }

    // Reducing step: Sentiment Values -> Count
    Map<String, Integer> counts = new HashMap<String, Integer>();
    counts.put("POSITIVE", 0);
    counts.put("NEGATIVE", 0);
    counts.put("NEUTRAL", 0);
    counts.put("MIXED", 0);

    for (String sentiment : sentimentValues) {
      counts.put(sentiment, counts.get(sentiment) + 1);
    }

    // Convert counts to percentages
    Map<String, Double> results = new HashMap<String, Double>();
    for (Map.Entry<String, Integer> count : counts.entrySet()) {
      double percentage = items.size() == 0 ? 0 : (double)count.getValue() / items.size() * 100;
      results.put(count.getKey(), percentage);
    }

    return new OutgoingStat<String, Double>("overallSentiment", results);
  }

  protected OutgoingStat<String, Keyword[]> processKeywords(
      List<Map<String, AttributeValue>> items) {
    // Mapping step: DB Item -> Keyword Lists
    List<String> positiveReviews = new ArrayList<String>();
    List<String> negativeReviews = new ArrayList<String>();
    for (Map<String, AttributeValue> item : items) {
      if (item.get("sentiment").getS().equals("POSITIVE")) {
        List<AttributeValue> keywordValues = item.get("keywords").getL();
        List<String> keywords = dynamoKeywordsToList(keywordValues);
        positiveReviews.addAll(keywords);
      } else if (item.get("sentiment").getS().equals("NEGATIVE")) {
        List<AttributeValue> keywordValues = item.get("keywords").getL();
        List<String> keywords = dynamoKeywordsToList(keywordValues);
        negativeReviews.addAll(keywords);
      }
    }

    // Reducing step: Sentiment Values -> Counts
    Map<String, Integer> positiveKeywordCounts = 
        new HashMap<String, Integer>();
    for (String keyword : positiveReviews) {
      if (positiveKeywordCounts.containsKey(keyword)) {
        positiveKeywordCounts.put(keyword, positiveKeywordCounts.get(keyword) + 1);
      } else {
        positiveKeywordCounts.put(keyword, 1);
      }
    }

    Map<String, Integer> negativeKeywordCounts = 
        new HashMap<String, Integer>();
    for (String keyword : negativeReviews) {
      if (negativeKeywordCounts.containsKey(keyword)) {
        negativeKeywordCounts.put(keyword, negativeKeywordCounts.get(keyword) + 1);
      } else {
        negativeKeywordCounts.put(keyword, 1);
      }
    }


    // Get top N keywords and map them to percentages
    Keyword[] positiveResults = positiveKeywordCounts.entrySet().stream()
    .sorted(Map.Entry.comparingByValue(Collections.reverseOrder())) // Sort by count, decreasing
    .limit(NUM_KEYWORDS) // Get only top N results
    .map(keyword -> {
      double percentage = 
          keyword.getValue() == 0 ? 0 : (double)keyword.getValue() / positiveReviews.size() * 100;
      return new Keyword(keyword.getKey(), percentage);
    }) // Convert count to percentage, create keyword object
    .toArray(Keyword[]::new); // Collect in array

    Keyword[] negativeResults = negativeKeywordCounts.entrySet().stream()
    .sorted(Map.Entry.comparingByValue(Collections.reverseOrder())) // Sort by count, decreasing
    .limit(NUM_KEYWORDS) // Get only top N results
    .map(keyword -> {
      double percentage = 
          keyword.getValue() == 0 ? 0 : (double)keyword.getValue() / negativeReviews.size() * 100;
      return new Keyword(keyword.getKey(), percentage);
    }) // Convert count to percentage, create keyword object
    .toArray(Keyword[]::new); // Collect in array


    Map<String, Keyword[]> result = new HashMap<String, Keyword[]>();
    result.put("positive", positiveResults);
    result.put("negative", negativeResults);

    return new OutgoingStat<String, Keyword[]>("keywords", result);
  }

  private List<String> dynamoKeywordsToList(List<AttributeValue> keywordValues) {
    List<String> keywords = new ArrayList<String>();
    for (AttributeValue keyword : keywordValues) {
      keywords.add(keyword.getS());
    }
    return keywords;
  }

  protected OutgoingStat<String, double[]> processSentimentOverTime(
      List<Map<String, AttributeValue>> items) {
    return null;
  }
}
