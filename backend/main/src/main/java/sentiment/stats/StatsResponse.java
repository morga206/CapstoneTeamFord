package sentiment.stats;

import sentiment.Response;

import java.util.HashMap;
import java.util.Map;

/**
 * A response to a query for sentiment statistics.
 */
public class StatsResponse extends Response {

  private OutgoingStat<?>[] stats;

  public StatsResponse(OutgoingStat<?>[] stats) {
    this.stats = stats;
  }

  /**
   * Return a map of the JSON keys and values for this object.
   */
  public Map<String, Object> getData() {
    Map<String, Object> data = new HashMap<String, Object>();
    data.put("stats", stats);
    return data;
  }
}