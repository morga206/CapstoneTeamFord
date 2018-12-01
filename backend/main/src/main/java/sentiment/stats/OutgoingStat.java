package sentiment.stats;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.Map;

/**
 * Class to send statistic values back to the frontend.
 */
public class OutgoingStat<K, V> {

  private String name;

  private Map<K, V> values;

  public OutgoingStat(String name, Map<K, V> values) {
    this.name = name;
    this.values = values;
  }

  @JsonIgnore
  public String getName() {
    return this.name;
  }

  @JsonIgnore
  public Map<K, V> getValues() {
    return this.values;
  }
}