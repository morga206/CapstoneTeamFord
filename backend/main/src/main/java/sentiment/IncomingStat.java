package sentiment;

/**
 * Defines the parameters for a single statistic
 */
public class IncomingStat {

  /**
   * The stat's name
   */
  private String name;

  /**
   * The parameters for this statistic (if any)
   */
  private String[] params;

  public IncomingStat(String name, String[] params) {
    this.name = name;
    this.params = params;
  }
}