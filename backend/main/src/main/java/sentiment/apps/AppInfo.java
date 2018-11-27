package sentiment.apps;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * The necessary frontend form entries for a given app.
 */
@JsonIgnoreProperties({"appIdStore"})
public class AppInfo {
  private String appIdStore;
  private String name;
  private boolean slackReport;
  private String minDate;
  private String maxDate;
  private String[] versions;

  /**
   * Primary constructor.
   * @param appIdStore The appId and store for this particular app.
   * @param name The human-readable app name.
   * @param slackReport Whether to include this app in Slack messages.
   * @param minDate The earliest possible review date for this app (as an ISO string).
   * @param maxDate The latest possible review date for this app (as an ISO string).
   * @param versions The possible versions for this app.
   */
  public AppInfo(
      String appIdStore, 
      String name, 
      boolean slackReport, 
      String minDate, 
      String maxDate, 
      String[] versions) {
    this.appIdStore = appIdStore;
    this.name = name;
    this.slackReport = slackReport;
    this.minDate = minDate;
    this.maxDate = maxDate;
    this.versions = versions;
  }

  public String getAppIdStore() {
    return this.appIdStore;
  }

  public String getName() {
    return this.name;
  }

  public boolean getSlackReport() {
    return this.slackReport;
  }

  public String getMinDate() {
    return this.minDate;
  }

  public String getMaxDate() {
    return this.maxDate;
  }

  public String[] getVersions() {
    return this.versions;
  }


}