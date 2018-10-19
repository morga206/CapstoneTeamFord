package sentiment.settings;

import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagement;
import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagementClientBuilder;
import com.amazonaws.services.simplesystemsmanagement.model.ParameterType;
import com.amazonaws.services.simplesystemsmanagement.model.PutParameterRequest;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import sentiment.Request;
import sentiment.Response;

/**
 * A query to set an admin portal setting.
 */
public class SetSettingsRequest extends Request {

  private Setting[] settings;

  /**
   * Creates a set settings request.
   * @param settings The list of setting name-value pairs to set
   */
  @JsonCreator
  public SetSettingsRequest(@JsonProperty("settings") Setting[] settings) {
    this.settings = settings;
  }

  /**
   * Process the data for this request and return a response.
   */
  public Response process() {
    for (Setting setting: settings) {
      String response = this.setSetting(setting.getName(), setting.getValue());
      if (!response.isEmpty()) {
        return new SetSettingsResponse(response);
      }
    }
        
    return new SetSettingsResponse();
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