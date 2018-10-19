package sentiment.settings;

import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagement;
import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagementClientBuilder;
import com.amazonaws.services.simplesystemsmanagement.model.GetParameterRequest;
import com.amazonaws.services.simplesystemsmanagement.model.GetParameterResult;
import com.amazonaws.services.simplesystemsmanagement.model.ParameterNotFoundException;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import sentiment.Request;
import sentiment.Response;

/**
 * A query to get an admin portal setting.
 */
public class GetSettingsRequest extends Request {

  private String[] names;

  @JsonCreator
  public GetSettingsRequest(@JsonProperty("names") String[] names) {
    this.names = names;
  }

  /**
   * Process the data for this request and return a response.
   */
  public Response process() {
    Setting[] results = new Setting[this.names.length];
    for (int i = 0; i < this.names.length; i++) {
      String settingName = this.names[i];
      String settingValue = this.getSetting(this.names[i]);

      if (settingValue == null) {
        return new GetSettingsResponse( "Could not retrieve " + settingName + " from SSM.");
      }

      results[i] = new Setting(settingName, settingValue);
    }

    return new GetSettingsResponse(results);
  }

  private String getSetting(String name) {
    AWSSimpleSystemsManagement client = AWSSimpleSystemsManagementClientBuilder.defaultClient();

    GetParameterResult result = null;
    String value = null;
    try {
      result = client.getParameter(new GetParameterRequest().withName(name));
      value = result.getParameter().getValue();
    } catch (ParameterNotFoundException exp) {
      // No-op
    }

    return value;
  }

}