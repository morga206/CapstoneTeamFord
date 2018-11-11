package sentiment;

import com.fasterxml.jackson.annotation.JsonAnyGetter;

import java.util.HashMap;
import java.util.Map;

/**
 * Response format for sentiment API.
 */
public class Response {
  protected enum Status {
    SUCCESS,
    ERROR;
  }

  private Status status = Status.SUCCESS;
  private String message = "";
  
  /**
   * Return a map of the JSON keys and values for this object.
   */
  @JsonAnyGetter
  public Map<String, Object> getData() {
    Map<String, Object> data = new HashMap<String, Object>();
    data.put("status", this.status);

    if (this.status == Status.ERROR) {
      data.put("message", this.message);
    }

    return data;
  }

  public Response() { }

  public Response(String message) {
    this.status = Status.ERROR;
    this.message = message;
  }

  public Status getStatus() {
    return status;
  }

  public String getMessage() {
    return message;
  }
}
