package sentiment;

/**
 * Class to send statistic values back to the frontend
 */
public class OutgoingStat<T> {

  private String name;

  private T[] values;

  public OutgoingStat(String name, T[] values) {
    this.name = name;
    this.values = values;
  }

}