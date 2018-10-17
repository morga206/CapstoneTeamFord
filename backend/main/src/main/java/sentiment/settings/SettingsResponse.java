package sentiment.settings;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import sentiment.Response;

import java.util.HashMap;
import java.util.Map;

/**
 * A response to a query for an admin portal setting.
 */
public class SettingsResponse extends Response {
  protected enum Status {
    SUCCESS,
    VALUE,
    ERROR;
  }

  private Status status;
  private String message;

  public SettingsResponse(Status status, String message) {
    this.status = status;
    this.message = message;
  }

  /**
   * Return a map of JSON keys and values for this object.
   */
  @JsonAnyGetter
  public Map<String, Object> getData() {
    Map<String, Object> data = new HashMap<String, Object>();

    data.put("status", this.status);
    data.put("message", this.message);

    return data;
  }
  
}