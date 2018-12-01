package sentiment.settings;


import com.fasterxml.jackson.annotation.JsonAnyGetter;

import sentiment.Response;

import java.util.Map;

/**
 * A response to a request to get or update the keyword ignore list.
 */
public class IgnoreListResponse extends Response {
  private String[] ignoreList;

  /**
   * Create an IgnoreListResponse (success condition).
   * @param ignoreList The updated list of keywords to ignore.
   */
  public IgnoreListResponse(String[] ignoreList) {
    this.ignoreList = ignoreList;
  }

  /**
   * Create an IgnoreListResponse (error condition).
   * @param message The error message.
   */
  public IgnoreListResponse(String message) {
    super(message);
  }

  /**
   * Return a map of JSON keys and values for this object.
   */
  @JsonAnyGetter
  public Map<String, Object> getData() {
    Map<String, Object> data = super.getData();

    if (this.getStatus() == Status.SUCCESS) {
      data.put("ignoreList", this.ignoreList);
    }

    return data;
  }
}