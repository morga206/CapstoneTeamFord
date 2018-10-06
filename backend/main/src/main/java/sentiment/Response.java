package sentiment;

/**
 * Response format for sentiment statistics
 */
public class Response {
  /**
   * The array of stats to return
   */
  private OutgoingStat<?>[] stats;

  public Response(OutgoingStat<?>[] stats) {
    this.stats = stats;
  }
}
