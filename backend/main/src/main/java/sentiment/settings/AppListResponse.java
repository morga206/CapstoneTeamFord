package sentiment.settings;


import com.fasterxml.jackson.annotation.JsonAnyGetter;

import sentiment.Response;

import java.util.Map;

/**
 * A response to a request to get or update the app scraping list.
 */
public class AppListResponse extends Response {
  private App[] appList;

  /**
   * Create an AppListResponse (success condition).
   * @param appList The updated list of apps to scrape.
   */
  public AppListResponse(App[] appList) {
    this.appList = appList;
  }

  /**
   * Create an AppListResponse (error condition).
   * @param message The error message.
   */
  public AppListResponse(String message) {
    super(message);
  }

  /**
   * Return a map of JSON keys and values for this object.
   */
  @JsonAnyGetter
  public Map<String, Object> getData() {
    Map<String, Object> data = super.getData();

    if (this.getStatus() == Status.SUCCESS) {
      data.put("appList", this.appList);
    }

    return data;
  }
}