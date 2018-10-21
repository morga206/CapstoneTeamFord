package sentiment.settings;


import com.fasterxml.jackson.annotation.JsonAnyGetter;

import sentiment.Response;

import java.util.HashMap;
import java.util.Map;

/**
 * A response to a request to get or update the app scraping list.
 */
public class AppListResponse extends Response {
  private App[] appList;
  private Status status;
  private String message;

  /**
   * Create an AppListResponse (success condition).
   * @param appList The updated list of apps to scrape.
   */
  public AppListResponse(App[] appList) {
    this.appList = appList;
    this.status = Status.SUCCESS;
    this.message = "";
  }

  /**
   * Create an AppListResponse (error condition).
   * @param message The error message.
   */
  public AppListResponse(String message) {
    this.appList = null;
    this.status = Status.ERROR;
    this.message = message;
  }

  /**
   * Return a map of JSON keys and values for this object.
   */
  @JsonAnyGetter
  public Map<String, Object> getData() {
    Map<String, Object> data = new HashMap<String, Object>();

    data.put("status", this.status);
    if (this.appList != null) {
      data.put("appList", this.appList);
    } else {
      data.put("message", this.message);
    }

    return data;
  }
}