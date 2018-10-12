package sentiment;

import com.fasterxml.jackson.annotation.JsonAnyGetter;

import java.util.Map;

/**
 * Response format for sentiment API.
 */
public abstract class Response {
  @JsonAnyGetter
  public abstract Map<String, Object> getData();
}