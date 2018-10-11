package sentiment.apps;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import sentiment.Response;

import java.util.HashMap;
import java.util.Map;

/**
 * A response to a query for the apps list.
 */
public class AppsResponse extends Response {
  private AppInfo[] apps;

  public AppsResponse(AppInfo[] apps) {
    this.apps = apps;
  }

  /**
   * Return a map of JSON keys and values for this object.
   */
  @JsonAnyGetter
  public Map<String, Object> getData() {
    Map<String, Object> data = new HashMap<String, Object>();

    for (AppInfo app : apps) {
      data.put(app.getAppIdStore(), app);
    }

    return data;
  }
}