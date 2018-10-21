package sentiment.settings;

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
public class AppListRequest extends Request {

  private enum Command {
    ADD,
    DELETE,
    GET;
  }

  private Command command;
  private App app;
  private App[] appList;

  /**
   * Creatse a new AppListRequest.
   * @param command The command to perform - get, add, or delete apps
   * @param app The app to add or delete, if appropriate
   */
  @JsonCreator
  public AppListRequest(@JsonProperty("command") String command, @JsonProperty("app") App app) {
    try {
      this.command = Command.valueOf(command);
    } catch (Exception exp) {
      this.command = null; // We'll return an error during processing
    }
    this.app = app;
  }

  /**
   * Process the data for this request and return a response.
   */
  public Response process() {
    AWSSimpleSystemsManagement client = AWSSimpleSystemsManagementClientBuilder.defaultClient();
    String message = getList(client);

    if (!message.isEmpty()) {
      return new AppListResponse(message);
    }

    switch (this.command) {
      case ADD:
        return addApp(client, this.appList);
      case DELETE:
        return deleteApp(client, this.appList);
      case GET:
        return new AppListResponse(this.appList);
      default:
        return new AppListResponse("Invalid command " + this.command);
    }
  }

  /**
   * Query SSM to get the existing JSON list and deserialize it.
   * @param client The SSM client.
   * @return An error message, if any.
   */
  private String getList(AWSSimpleSystemsManagement client) {
    GetParameterResult result = null;
    String value = null;
    try {
      result = client.getParameter(new GetParameterRequest().withName(Constants.APPLIST_SSM_PARAM));
      value = result.getParameter().getValue();
    } catch (ParameterNotFoundException exp) {
      value = "[]";
    }

    try {
      this.appList = new ObjectMapper().readValue(value, App[].class);
    } catch (Exception exp) {
      return "Unable to parse app list from JSON.";
    }

    return "";
  }

  /**
   * Add an app to the SSM list.
   * @param client The SSM client to use.
   * @param appList The existing app list.
   * @return An AppListResponse with either an error message or the updated list.
   */
  protected AppListResponse addApp(AWSSimpleSystemsManagement client, App[] appList) {
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
   * @return An AppListResponse with either an error message or the updated list.
   */
  protected AppListResponse deleteApp(AWSSimpleSystemsManagement client, App[] appList) {
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
   * Write the updated list to SSM.
   * @param client The SSM client to use.
   * @param newList The updated list to write.
   * @return An error message, if any.
   */
  private String writeList(AWSSimpleSystemsManagement client, App[] newList) {
    String json;
    try {
      json = new ObjectMapper().writeValueAsString(newList);
    } catch (Exception exp) {
      return "Unable to serialize updated list to JSON.";
    }

    try {
      client.putParameter(new PutParameterRequest()
          .withName(Constants.APPLIST_SSM_PARAM)
          .withValue(json)
          .withType(ParameterType.String)
          .withOverwrite(true));
    } catch (Exception exp) {
      return exp.getMessage();
    }

    return "";
  }
}