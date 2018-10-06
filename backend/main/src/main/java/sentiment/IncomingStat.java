package sentiment;

import com.fasterxml.jackson.annotation.JsonAnySetter;

/**
 * Defines the parameters for a single statistic.
 */
public class IncomingStat {

  /**
   * The stat's name.
   */
  private String name;

  /**
   * The parameters for this statistic (if any).
   */
  private String[] params;

  
  public IncomingStat() {
    this.name = "";
    this.params = null;
  }

  public String getName() {
    return this.name;
  }

  public String[] getParams() {
    return this.params;
  }

  @JsonAnySetter
  public void setData(String key, String[] value) {
    this.name = key;
    this.params = value;
  }
}