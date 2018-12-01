package sentiment.stats;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.dynamodbv2.model.QueryRequest;
import com.amazonaws.services.dynamodbv2.model.QueryResult;
import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagement;
import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagementClientBuilder;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import sentiment.Request;
import sentiment.Response;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


/**
 * Request format for the sentiment stats function.
 */
public class StatsRequest extends Request {

  private static final String REGION = System.getenv("DEPLOY_REGION");
  private static final String TABLE = System.getenv("TABLE_NAME");

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
    
    if (items != null) {
      OutgoingStat<?, ?>[] stats = calculateStats(items, this.stats);
      return new StatsResponse(appIdStore, version, stats);
    } else {
      return new StatsResponse("Error retrieving reviews from DynamoDB");
    }
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
          results[nextIndex] = new RawReviewsCalculation(items).calculate();
          nextIndex++;
          break;
        case "numReviews":
          results[nextIndex] = new NumReviewsCalculation(items).calculate();
          nextIndex++;
          break;
        case "overallSentiment":
          results[nextIndex] =  new OverallSentimentCalculation(items).calculate();
          nextIndex++;
          break;
        case "keywords":
          AWSSimpleSystemsManagement client = 
              AWSSimpleSystemsManagementClientBuilder.defaultClient();
          results[nextIndex] = new KeywordsCalculation(items, client).calculate();
          nextIndex++;
          break;
        case "sentimentOverTime":
          results[nextIndex] = 
            new SentimentOverTimeCalculation(items, startDate, endDate).calculate();
          nextIndex++;
          break;
        default:
          System.err.println("No method found to process statistic " + stat.getName());
      }
    }
    return results;
  }
}
