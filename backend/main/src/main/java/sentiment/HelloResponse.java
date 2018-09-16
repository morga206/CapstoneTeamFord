package sentiment;

/**
 * Response format for Hello, World lambda.
 */
public class HelloResponse {
  /**
   * The message to retun from the API.
   */
  private String message;

  public HelloResponse() { }

  public HelloResponse(String message) {
    this.message = message;
  }

  public String getMessage() {
    return this.message;
  }

  public void setMessage(String message) {
    this.message = message;
  }
}
