package sentiment.settings;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Arrays;
import java.util.regex.Pattern;

/**
 * Represents a single app in the app scraping list.
 */
public class App {
  private static final String[] validStores = new String[]{"App Store", "Google Play"};

  private String name;
  private String store;
  private String appId;

  /**
   * Create an App to represent an entry in the app scraping list.
   * @param name The human-readable app name.
   * @param store The store to scrape for this app.
   * @param appId The app's unique id.
   */
  @JsonCreator
  public App(
      @JsonProperty("name") String name, 
      @JsonProperty("store") String store, 
      @JsonProperty("appId") String appId) {
    this.name = name;
    this.store = store;
    this.appId = appId;
  }

  public String getName() {
    return this.name;
  }

  public String getStore() {
    return this.store;
  }

  public String getAppId() {
    return this.appId;
  }

  /**
   * Check that this app's metadata is valid.
   */
  public String checkValidity() {
    if (!Arrays.asList(validStores).contains(this.store)) {
      return "Invalid store " + this.store + ".";
    }

    if (!Pattern.matches("[0-9a-zA-Z._]+", this.appId)) {
      return "Invalid appId " + this.appId + ".";
    }

    return "";
  }
}