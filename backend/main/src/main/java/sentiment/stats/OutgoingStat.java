package sentiment.stats;

import com.fasterxml.jackson.annotation.JsonAnyGetter;

import java.util.HashMap;
import java.util.Map;

/**
 * Class to send statistic values back to the frontend.
 */
public class OutgoingStat<T> {

  private String name;

  private T[] values;

  public OutgoingStat(String name, T[] values) {
    this.name = name;
    this.values = values;
  }

  /**
   * Map stat name to values so Jackson serializes to JSON correctly.
   * @return Map from stat name to values
   */
  @JsonAnyGetter
  public Map<String, T[]> getData() {
    Map<String, T[]> statDetails = new HashMap<String, T[]>();
    statDetails.put(name, values);
    return statDetails;
  }

  public String getName() {
    return this.name;
  }

  public T[] getValues() {
    return this.values;
  }
}