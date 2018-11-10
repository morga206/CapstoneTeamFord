package sentiment.stats;

import sentiment.Response;

import java.util.HashMap;
import java.util.Map;

/**
 * A response to a query for sentiment statistics.
 */
public class StatsResponse extends Response {
 
  private String appIdStore;
  private String version;
  private OutgoingStat<?, ?>[] stats;

  /**
   *
   * @param appIdStore the Id of app and it's app store.
   * @param version the version number for this stats.
   * @param stats the stats we are using to send.
   */
  public StatsResponse(String appIdStore, String version, OutgoingStat<?, ?>[] stats) {
    this.appIdStore = appIdStore;
    this.version = version;
    this.stats = stats;
  }

  public StatsResponse(String message) {
    super(message);
  }

  /**
   * Return a map of the JSON keys and values for this object.
   */
  public Map<String, Object> getData() {
    Map<String, Object> data = super.getData();

    if (this.getStatus() == Status.SUCCESS) {
      data.put("appIdStore", appIdStore);
      data.put("version", version);
      for (OutgoingStat<?, ?> stat : stats) {
        data.put(stat.getName(), stat.getValues());
      }
    }
    return data;
  }
}