package sentiment.settings;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import sentiment.Response;

import java.util.HashMap;
import java.util.Map;

/**
 * A response to a query to set admin portal setting.
 */
public class SetSettingsResponse extends Response {

  public SetSettingsResponse(String message) {
    super(message);
  }

  public SetSettingsResponse() { }

  /**
   * Return a map of JSON keys and values for this object.
   */
  @JsonAnyGetter
  public Map<String, Object> getData() {
    return super.getData();
  }
  
}