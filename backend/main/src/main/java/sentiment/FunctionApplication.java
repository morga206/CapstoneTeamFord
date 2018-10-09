package sentiment;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.dynamodbv2.model.QueryRequest;
import com.amazonaws.services.dynamodbv2.model.QueryResult;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.boot.SpringApplication;
import org.springframework.cloud.function.context.config.ContextFunctionCatalogAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * Main Spring application.
 */
@Configuration
@Import({ ContextFunctionCatalogAutoConfiguration.class, ObjectMapper.class })
public class FunctionApplication {

  private static final String REGION = System.getenv("DEPLOY_REGION");
  private static final String TABLE = System.getenv("TABLE_NAME");

  public static void main(final String[] args) {
    SpringApplication.run(FunctionApplication.class, args);
  }

  /**
   * Lambda function to process sentiment stats.
   * @return Response to pass to API Gateway handler
   */
  @Bean
  public Function<Message<Request>, Message<Response>> stats() {
    return messageRequest -> {
      Request request = messageRequest.getPayload();

      AmazonDynamoDB client = AmazonDynamoDBClientBuilder.standard().withRegion(REGION).build();
      List<Map<String, AttributeValue>> items = 
          getDynamoReviews(client, 
                           request.getAppIdStore(), 
                           request.getVersion(), 
                           request.getStartDate(), 
                           request.getEndDate());
      OutgoingStat<?>[] stats = calculateStats(items, request.getStats());

      Response response = new Response(stats);
      // Put stats in response

      Message<Response> messageResponse = MessageBuilder
          .withPayload(response)
          .setHeader("Access-Control-Allow-Origin", "*")
          .build();
        
      return messageResponse;
    };
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
  protected OutgoingStat<?>[] calculateStats(List<Map<String, AttributeValue>> items, 
      IncomingStat[] stats) {
    OutgoingStat<?>[] results = new OutgoingStat<?>[stats.length];
    int nextIndex = 0;
    for (IncomingStat stat : stats) {
      switch (stat.getName()) {
        case "rawReviews":
          results[nextIndex] = processRawReviews(items);
          nextIndex++;
          break;
        default:
          System.out.println("No method found to processs statistic " + stat.getName());
      }
    }
    return results;
  }

  protected OutgoingStat<String> processRawReviews(List<Map<String, AttributeValue>> items) {
    String[] result = new String[items.size()];
    int nextIndex = 0;

    for (Map<String, AttributeValue> item : items) {
      Map<String, String> review = new HashMap<String, String>();
      item.forEach((key, val) -> {
        review.put(key, val.getS());
      });

      try {
        String json = new ObjectMapper().writeValueAsString(review);
        result[nextIndex] = json;
        nextIndex++;
      } catch (JsonProcessingException exp) {
        System.out.println("Error converting rawReviews to JSON");
        System.out.println(exp.getMessage());
      }
    }

    return new OutgoingStat<String>("rawReviews", result);
  }
}
