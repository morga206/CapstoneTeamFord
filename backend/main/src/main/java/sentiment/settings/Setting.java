package sentiment.settings;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Represents an SSM setting as a name-value pair.
 */
public class Setting {
  private String name;
  private String value;

  @JsonCreator
  public Setting(
      @JsonProperty("name") String name, 
      @JsonProperty("value") String value) {
    this.name = name;
    this.value = value;
  }

  public String getName() {
    return this.name;
  }

  public String getValue() {
    return this.value;
  }
}