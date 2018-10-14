package sentiment.apps;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.dynamodbv2.model.QueryRequest;
import com.amazonaws.services.dynamodbv2.model.QueryResult;
import com.fasterxml.jackson.annotation.JsonCreator;
import sentiment.Request;
import sentiment.Response;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * A query for the apps list to populate the frontend forms.
 */
public class AppsRequest extends Request {
  private static final String REGION = System.getenv("DEPLOY_REGION");
  private static final String TABLE = System.getenv("TABLE_NAME");

  @JsonCreator
  public AppsRequest() { }

  /**
   * Process the data for this request and return a response.
   */
  public Response process() {
    // TODO get these from the settings DB
    final String[] appIds = 
      new String[] { "com.ford.fordpass*App Store", "com.ford.fordpass*Google Play" };
    final String[] appNames = 
      new String[] { "Fordpass (App Store)", "FordPass (Google Play)"};

    List<AppInfo> apps = new ArrayList<AppInfo>();

    AmazonDynamoDB client = AmazonDynamoDBClientBuilder.standard().withRegion(REGION).build();

    for (int i = 0; i < appIds.length; i++) {
      AppInfo info = getAppInfoFromDb(client, appIds[i], appNames[i]);
      if (info != null) {
        // We have reviews for this app
        apps.add(info);
      }
    }

    return new AppsResponse(apps.toArray(new AppInfo[0]));
  }

  private AppInfo getAppInfoFromDb(AmazonDynamoDB db, String appIdStore, String name) {
    HashMap<String, AttributeValue> valueMap = new HashMap<String, AttributeValue>();
    valueMap.put(":id", new AttributeValue().withS(appIdStore));

    // Run two DynamoDB queries - one for max date value and one for min date value
    // Each query sorts reviews for this app by date and takes the first result
    QueryRequest minDateQuery = new QueryRequest()
        .withTableName(TABLE).withIndexName("date")
        .withKeyConditionExpression("appIdStore = :id")
        .withExpressionAttributeValues(valueMap)
        .withLimit(1);

    QueryRequest maxDateQuery = new QueryRequest()
        .withTableName(TABLE).withIndexName("date")
        .withKeyConditionExpression("appIdStore = :id")
        .withExpressionAttributeValues(valueMap)
        .withLimit(1)
        .withScanIndexForward(false);
    
    QueryResult queryResult = null;
    String date = null;

    DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
    LocalDate minDate = null;
    LocalDate maxDate = null;

    try {
      queryResult = db.query(minDateQuery);
      if (queryResult.getCount() == 0) {
        // No reviews for this app yet
        return null;
      }

      date = queryResult.getItems().get(0).get("date").getS();
      minDate = LocalDate.parse(date, formatter);

      queryResult = db.query(maxDateQuery);
      if (queryResult.getCount() == 0) {
        // No reviews for this app yet
        return null;
      }

      date = queryResult.getItems().get(0).get("date").getS();
      maxDate = LocalDate.parse(date, formatter);
      
    } catch (Exception exp) {
      System.err.println("Unable to get date range from DyanmoDB for app " + appIdStore);
      System.err.println(exp.getMessage());
    }

    // Run one DynamoDB query to get a list of the version numbers for this app's reviews
    // The resulting list is then inserted into a HashSet to remove duplicates
    QueryRequest versionsQuery = new QueryRequest()
        .withTableName(TABLE).withIndexName("date")
        .withKeyConditionExpression("appIdStore = :id")
        .withExpressionAttributeValues(valueMap)
        .withProjectionExpression("version");
    
    queryResult = null;
    List<Map<String, AttributeValue>> items = null;
    Set<String> versionsSet = new HashSet<String>();

    try {
      queryResult = db.query(versionsQuery);
      items = queryResult.getItems();

      for (Map<String, AttributeValue> item : items) {
        versionsSet.add(item.get("version").getS());
      }
    } catch (Exception exp) {
      System.err.println("Unable to get version values from DyanmoDB for app " + appIdStore);
      System.err.println(exp.getMessage());
    }

    String[] versions = versionsSet.toArray(new String[0]);

    // Create an AppInfo object
    return new AppInfo(appIdStore, name, minDate.toString(), maxDate.toString(), versions);
  }
}