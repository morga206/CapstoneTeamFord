package sentiment.settings;

import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagement;
import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagementClientBuilder;
import com.amazonaws.services.simplesystemsmanagement.model.GetParameterRequest;
import com.amazonaws.services.simplesystemsmanagement.model.GetParameterResult;
import com.amazonaws.services.simplesystemsmanagement.model.InvalidKeyIdException;
import com.amazonaws.services.simplesystemsmanagement.model.ParameterType;
import com.amazonaws.services.simplesystemsmanagement.model.PutParameterRequest;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import sentiment.Request;
import sentiment.Response;
import sentiment.settings.SettingsResponse.Status;

/**
 * A query for the apps list to populate the frontend forms.
 */
public class SettingsRequest extends Request {
  private enum Command {
    GET,
    SET,
    NONE;
  }

  private Command command;
  private String name;
  private String value;

  @JsonCreator
  public SettingsRequest(
    @JsonProperty("command") String command, 
    @JsonProperty("name") String name, 
    @JsonProperty("value") String value) {

    try {
      this.command = Command.valueOf(command.toUpperCase());
    } catch (IllegalArgumentException e) {
      this.command = Command.NONE; // We'll send an error to the client during processing
    }

    this.name = name;
    this.value = value;
  }

  /**
   * Process the data for this request and return a response.
   */
  public Response process() {
    switch (this.command) {
      case GET:
        String settingValue = this.getSetting(this.name);

        if (settingValue == null) {
          return new SettingsResponse(Status.ERROR, "Could not retrieve " + this.name + " from SSM");
        } else {
          return new SettingsResponse(Status.VALUE, settingValue);
        }
      case SET:
        String response = this.setSetting(this.name, this.value);
        return new SettingsResponse(response.isEmpty() ? Status.SUCCESS : Status.ERROR, response);
      case NONE:
      default:
        return new SettingsResponse(Status.ERROR, "Invalid Settings Request - No such command");
    }
  }

  private String getSetting(String name) {
    AWSSimpleSystemsManagement client = AWSSimpleSystemsManagementClientBuilder.defaultClient();

    GetParameterResult result = null;
    String value = null;
    try {
      result = client.getParameter(new GetParameterRequest().withName(name));
      value = result.getParameter().getValue();
    } catch (InvalidKeyIdException exp) {
      // No-op
    }

    return value;
  }

  private String setSetting(String name, String value) {
    AWSSimpleSystemsManagement client = AWSSimpleSystemsManagementClientBuilder.defaultClient();

    try {
      client.putParameter(new PutParameterRequest()
        .withName(name)
        .withValue(value)
        .withType(ParameterType.String)
        .withOverwrite(true));
    } catch (Exception exp) {
      return exp.getMessage();
    }
    
    return "";

  }
}