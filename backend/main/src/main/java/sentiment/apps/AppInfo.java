package sentiment.apps;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;

/**
 * The necessary frontend form entries for a given app.
 */
@JsonIgnoreProperties({"appIdStore"})
public class AppInfo {
  private String appIdStore;
  private LocalDate startDate;
  private LocalDate endDate;
  private String[] versions;

  /**
   * Primary constructor.
   * @param appIdStore The appId and store for this particular app.
   * @param startDate The earliest possible review date for this app.
   * @param endDate The latest possible review date for this app.
   * @param versions The possible versions for this app.
   */
  public AppInfo(String appIdStore, LocalDate startDate, LocalDate endDate, String[] versions) {
    this.appIdStore = appIdStore;
    this.startDate = startDate;
    this.endDate = endDate;
    this.versions = versions;
  }

  public String getAppIdStore() {
    return this.appIdStore;
  }

  public LocalDate getStartDate() {
    return this.startDate;
  }

  public LocalDate getEndDate() {
    return this.endDate;
  }

  public String[] getVersions() {
    return this.versions;
  }


}