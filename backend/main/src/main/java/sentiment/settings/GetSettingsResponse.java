package sentiment.settings;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import sentiment.Response;

import java.util.HashMap;
import java.util.Map;

/**
 * A response to a query to get admin portal setting.
 */
public class GetSettingsResponse extends Response {
  protected enum Status {
    SUCCESS,
    ERROR;
  }

  private Status status;
  private String message;

  private Setting[] settings;

  /**
   * Create a respone containing the requested settings values.
   * @param settings The name-value pairs for each requested setting.
   */
  public GetSettingsResponse(Setting[] settings) {
    this.settings = settings;

    this.status = Status.SUCCESS;
    this.message = "";
  }

  /**
   * Return an error in response to a get settings request.
   * @param error The error message to send.
   */
  public GetSettingsResponse(String error) {
    this.settings = null;

    this.status = Status.ERROR;
    this.message = error;
  }

  /**
   * Return a map of JSON keys and values for this object.
   */
  @JsonAnyGetter
  public Map<String, Object> getData() {
    Map<String, Object> data = new HashMap<String, Object>();

    data.put("status", this.status);
    if (this.settings != null) {
      data.put("settings", this.settings);
    } else {
      data.put("message", this.message);
    }

    return data;
  }
  
}