package sentiment;

/**
 * Response format for sentiment statistics.
 */
public class Response {
  /**
   * The array of stats to return.
   */
  private OutgoingStat<?>[] stats;

  public Response(OutgoingStat<?>[] stats) {
    this.stats = stats;
  }

  public OutgoingStat<?>[] getStats() {
    return this.stats;
  }

  public void setStats(OutgoingStat<?>[] stats) {
    this.stats = stats;
  }
}
