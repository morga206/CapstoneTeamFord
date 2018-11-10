package sentiment.settings;

import com.amazonaws.services.lambda.AWSLambda;
import com.amazonaws.services.lambda.AWSLambdaClientBuilder;
import com.amazonaws.services.lambda.model.InvocationType;
import com.amazonaws.services.lambda.model.InvokeRequest;
import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagement;
import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagementClientBuilder;
import com.amazonaws.services.simplesystemsmanagement.model.GetParameterRequest;
import com.amazonaws.services.simplesystemsmanagement.model.GetParameterResult;
import com.amazonaws.services.simplesystemsmanagement.model.ParameterNotFoundException;
import com.amazonaws.services.simplesystemsmanagement.model.ParameterType;
import com.amazonaws.services.simplesystemsmanagement.model.PutParameterRequest;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import sentiment.Request;
import sentiment.Response;

import java.util.Arrays;


/**
 * A query to get or update the list of apps to scrape.
 */
public class AppListRequest extends ListRequest<App> {

  /**
   * Creatse a new AppListRequest.
   * @param command The command to perform - get, add, or delete apps
   * @param app The app to add or delete, if appropriate
   */
  @JsonCreator
  public AppListRequest(@JsonProperty("command") String command, @JsonProperty("app") App app) {
    super(command, Constants.APPLIST_SSM_PARAM, app);
  }

  /**
   * Process the data for this request and return a response.
   */
  @Override
  public Response process() {
    Response response = super.process();
    if (super.getCommand() == Command.ADD) {     
      runScraper();
    }
    return response;
  }

  /**
   * Runs the scraper Lambda.
   */
  private void runScraper() {
    AWSLambda client = AWSLambdaClientBuilder.standard()
        .withRegion(Constants.REGION)
        .build();
    
    String functionName = "sentiment-dashboard-" + Constants.STAGE + "-reviews";
    InvokeRequest req = new InvokeRequest()
        .withInvocationType(InvocationType.Event) // Asynchronous - don't wait for return
        .withFunctionName(functionName);

    try {
      client.invoke(req);
    } catch (Exception exp) {
      System.err.println("Error invoking Scraping Lambda: " + exp.getMessage());
    }
  }

  /**
   * Convert SSM's JSON representation to a POJO representation
   * @param json The JSON list.
   * @return The list as an array of Java objects
   */
  protected App[] deserializeList(String json) throws Exception {
    return new ObjectMapper().readValue(json, App[].class);
  }

  /**
   * Add an app to the SSM list.
   * @param client The SSM client to use.
   * @param appList The existing app list.
   * @param app The app to add.
   * @return An AppListResponse with either an error message or the updated list.
   */
  protected AppListResponse add(AWSSimpleSystemsManagement client, App[] appList, App app) {
    String message = app.checkValidity();

    if (!message.isEmpty()) {
      return new AppListResponse(message);
    }

    for (App existingApp : appList) {
      if (existingApp.getAppId().equals(app.getAppId())
          && existingApp.getStore().equals(app.getStore())) {
        return new AppListResponse(
          "App with id " + app.getAppId() + " already exists in the list.");
      }
    }

    App[] newList = Arrays.copyOf(appList, appList.length + 1);
    newList[newList.length - 1] = app;

    message = writeList(client, newList);

    if (!message.isEmpty()) {
      return new AppListResponse(message);
    }

    return new AppListResponse(newList);
  }

  /**
   * Delete an app from the SSM list.
   * @param client The SSM client to use.
   * @param appList The existing app list.
   * @param app The app to delete.
   * @return An AppListResponse with either an error message or the updated list.
   */
  protected AppListResponse delete(AWSSimpleSystemsManagement client, App[] appList, App app) {
    String message = app.checkValidity();

    if (!message.isEmpty()) {
      return new AppListResponse(message);
    }

    App[] newList = new App[appList.length - 1];
    int idx = 0;

    boolean present = false;
    for (App existingApp : appList) {
      if (existingApp.getAppId().equals(app.getAppId())
          && existingApp.getStore().equals(app.getStore())) {
        present = true;
      } else if (idx < appList.length - 1) {
        newList[idx] = existingApp;
        idx++;
      }
    }

    if (!present) {
      return new AppListResponse("No app with id " + app.getAppId() + " present in list.");
    }

    message = writeList(client, newList);
    if (!message.isEmpty()) {
      return new AppListResponse(message);
    }

    return new AppListResponse(newList);
  }

  /**
   * Format the current list in a Response object.
   * @param list The list to format
   * @return A Response with the list.
   */
  protected AppListResponse get(App[] list) {
    return new AppListResponse(list);
  }


}