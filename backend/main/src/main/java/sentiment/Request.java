package sentiment;

/**
 * Request superclass for the sentiment dashboard API.
 */
public abstract class Request {

  public Request() {}

  public abstract Response process();
  
}
