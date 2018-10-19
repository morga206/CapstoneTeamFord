package sentiment.settings;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import sentiment.Response;

import java.util.HashMap;
import java.util.Map;

/**
 * A response to a query to set admin portal setting.
 */
public class SetSettingsResponse extends Response {
  protected enum Status {
    SUCCESS,
    ERROR;
  }

  private Status status;
  private String message;

  public SetSettingsResponse(Status status, String message) {
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