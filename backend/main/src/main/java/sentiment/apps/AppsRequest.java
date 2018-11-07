package sentiment.apps;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.dynamodbv2.model.QueryRequest;
import com.amazonaws.services.dynamodbv2.model.QueryResult;
import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagement;
import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagementClientBuilder;
import com.amazonaws.services.simplesystemsmanagement.model.GetParameterRequest;
import com.amazonaws.services.simplesystemsmanagement.model.GetParameterResult;
import com.amazonaws.services.simplesystemsmanagement.model.ParameterNotFoundException;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.databind.ObjectMapper;

import sentiment.Request;
import sentiment.Response;
import sentiment.settings.App;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
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
  private static final String STAGE = System.getenv("STAGE");
  private static final String TABLE = System.getenv("TABLE_NAME");

  @JsonCreator
  public AppsRequest() { }

  /**
   * Process the data for this request and return a response.
   */
  public Response process() {
    // Get app list from SSM
    AWSSimpleSystemsManagement ssmClient = AWSSimpleSystemsManagementClientBuilder.defaultClient();

    GetParameterResult result = null;
    String value = null;
    try {
      result = ssmClient.getParameter(new GetParameterRequest().withName("appList-" + STAGE));
      value = result.getParameter().getValue();
    } catch (ParameterNotFoundException exp) {
      return new AppsResponse("Unable to get app list from SSM.");
    }

    App[] appList;
    try {
      appList = new ObjectMapper().readValue(value, App[].class);
    } catch (Exception exp) {
      return new AppsResponse("Unable to parse app list from JSON.");
    }

    List<AppInfo> apps = new ArrayList<AppInfo>();

    AmazonDynamoDB dynamoDbClient = AmazonDynamoDBClientBuilder.standard().withRegion(REGION).build();

    for (int i = 0; i < appList.length; i++) {
      String appIdStore = appList[i].getAppId() + "*" + appList[i].getStore();
      String appName = appList[i].getName() + " (" + appList[i].getStore() + ")";
      AppInfo info = getAppInfoFromDb(dynamoDbClient, appIdStore, appName);
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
    Arrays.sort(versions);

    // Create an AppInfo object
    return new AppInfo(appIdStore, name, minDate.toString(), maxDate.toString(), versions);
  }
}