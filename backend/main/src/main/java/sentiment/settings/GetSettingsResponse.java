package sentiment.settings;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import sentiment.Response;

import java.util.HashMap;
import java.util.Map;

/**
 * A response to a query to get admin portal setting.
 */
public class GetSettingsResponse extends Response {

  private Setting[] settings;

  /**
   * Create a respone containing the requested settings values.
   * @param settings The name-value pairs for each requested setting.
   */
  public GetSettingsResponse(Setting[] settings) {
    this.settings = settings;
  }

  /**
   * Return an error in response to a get settings request.
   * @param message The error message to send.
   */
  public GetSettingsResponse(String message) {
    super(message);
  }

  /**
   * Return a map of JSON keys and values for this object.
   */
  @JsonAnyGetter
  public Map<String, Object> getData() {
    Map<String, Object> data = super.getData();

    if (this.getStatus() == Status.SUCCESS) {
      data.put("settings", this.settings);
    }

    return data;
  }
  
}