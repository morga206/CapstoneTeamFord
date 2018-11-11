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

  public AppsResponse(String message) {
    super(message);
  }

  /**
   * Return a map of JSON keys and values for this object.
   */
  @JsonAnyGetter
  public Map<String, Object> getData() {
    Map<String, Object> data = super.getData();

    if (this.getStatus() == Status.SUCCESS) {
      Map<String, AppInfo> appList = new HashMap<String, AppInfo>();
      for (AppInfo app : apps) {
        appList.put(app.getAppIdStore(), app);
      }
      data.put("apps", appList);
    }

    return data;
  }
}