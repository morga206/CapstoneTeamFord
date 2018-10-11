package sentiment.apps;

import com.fasterxml.jackson.annotation.JsonCreator;
import sentiment.Request;
import sentiment.Response;

import java.time.LocalDate;

/**
 * A query for the apps list to populate the frontend forms.
 */
public class AppsRequest extends Request {
  @JsonCreator
  public AppsRequest() {

  }

  /**
   * Process the data for this request and return a response.
   */
  public Response process() {
    // Test Data
    return new AppsResponse(new AppInfo[]{ 
      new AppInfo("test*test", LocalDate.now(), LocalDate.now(), new String[]{"1.0.0"})});
  }
}