package sentiment;

/**
 * Request format for Hello, World lambda.
 */
public class HelloRequest {
  /**
  * The name to say hello to.
  */
  private String name;

  public HelloRequest() {
    this.name = "";
  }

  public HelloRequest(String name) {
    this.name = name;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }
}
