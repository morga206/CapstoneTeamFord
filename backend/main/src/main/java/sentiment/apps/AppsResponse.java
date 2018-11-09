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

  private Status status;
  private String message;

  public AppsResponse(AppInfo[] apps) {
    this.status = Status.SUCCESS;
    this.apps = apps;
  }

  public AppsResponse(String message) {
    this.status = Status.ERROR;
    this.message = message;
  }

  /**
   * Return a map of JSON keys and values for this object.
   */
  @JsonAnyGetter
  public Map<String, Object> getData() {
    Map<String, Object> data = new HashMap<String, Object>();

    data.put("status", status);
    if (status == Status.SUCCESS) {
      Map<String, AppInfo> appList = new HashMap<String, AppInfo>();
      for (AppInfo app : apps) {
        appList.put(app.getAppIdStore(), app);
      }
      data.put("apps", appList);
    } else {
      data.put("message", message);
    }

    System.out.println(data.toString());

    return data;
  }
}