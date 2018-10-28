package sentiment.stats;

import sentiment.Response;

import java.util.HashMap;
import java.util.Map;

/**
 * A response to a query for sentiment statistics.
 */
public class StatsResponse extends Response {

  private Status status;
  private String message;

  private OutgoingStat<?, ?>[] stats;

  public StatsResponse(OutgoingStat<?, ?>[] stats) {
    this.status = Status.SUCCESS;
    this.stats = stats;
  }

  public StatsResponse(String message) {
    this.status = Status.ERROR;
    this.message = message;
  }

  /**
   * Return a map of the JSON keys and values for this object.
   */
  public Map<String, Object> getData() {
    Map<String, Object> data = new HashMap<String, Object>();

    data.put("status", this.status);
    if (this.stats != null) {
      for (OutgoingStat<?, ?> stat : stats) {
        data.put(stat.getName(), stat.getValues());
      }
    } else {
      data.put("message", this.message);
    }
    return data;
  }
}