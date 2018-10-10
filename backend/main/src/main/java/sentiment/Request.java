package sentiment;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Request format for the sentiment stats lambda.
 */
public class Request {
  /**
  * The id and store for the app to compile stats for.
  */
  private String appIdStore;

  /**
   * The app version to query.
   */
  private String version;

  /**
   * The beginning of the date range to query.
   */
  private LocalDate startDate;

  /**
   * The end of the date range to query.
   */
  private LocalDate endDate;

  /**
   * The specific stats to compile.
   */
  private IncomingStat[] stats;

  /**
   * Primary constructor.
   * @param appIdStore The appId and store to query
   * @param version The app version to query
   * @param startDate The start of the date window
   * @param endDate The end of the date window
   * @param stats The list of stats to calculate, plus any parameters
   */
  @JsonCreator
  public Request(
      @JsonProperty("appIdStore") String appIdStore, 
      @JsonProperty("version") String version, 
      @JsonProperty("startDate") String startDate, 
      @JsonProperty("endDate") String endDate, 
      @JsonProperty("stats") IncomingStat[] stats) {
    this.appIdStore = appIdStore;
    this.version = version;

    DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
    this.startDate = LocalDate.parse(startDate, formatter);
    this.endDate = LocalDate.parse(endDate, formatter);
    this.stats = stats;
  }

  public String getAppIdStore() {
    return this.appIdStore;
  }

  public String getVersion() {
    return this.version;
  }

  public LocalDate getStartDate() {
    return this.startDate;
  }

  public LocalDate getEndDate() {
    return this.endDate;
  }

  public IncomingStat[] getStats() {
    return this.stats;
  }
}
