package sentiment;

import java.util.Date;

/**
 * Request format for the sentiment stats lambda.
 */
public class Request {
  /**
  * The id for the app to compile stats for
  */
  private String appId;

  /**
   * The app version to query
   */
  private String version;

  /**
   * The beginning of the date range to query
   */
  private Date startDate;

    /**
   * The end of the date range to query
   */
  private Date endDate;

  /**
   * The specific stats to compile
   */
  private IncomingStat[] stats;

  public Request(String appId, String version, Date startDate, Date endDate, IncomingStat[] stats) {
    this.appId = appId;
    this.version = version;
    this.startDate = startDate;
    this.endDate = endDate;
    this.stats = stats;
  }

  public String getAppId() {
    return this.appId;
  }

  public String getVersion() {
    return this.version;
  }

  public Date getStartDate() {
    return this.startDate;
  }

  public Date getEndDate() {
    return this.endDate;
  }

  public IncomingStat[] getStats() {
    return this.stats;
  }
}
