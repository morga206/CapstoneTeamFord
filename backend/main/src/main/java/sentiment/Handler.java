package sentiment;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;

import org.springframework.cloud.function.adapter.aws.SpringBootApiGatewayRequestHandler;

import sentiment.apps.AppsRequest;
import sentiment.settings.SettingsRequest;
import sentiment.stats.StatsRequest;

/**
 * Main handler to connect API Gatway -> Lambda -> Spring Cloud Function.
 */
public class Handler extends SpringBootApiGatewayRequestHandler {

  private String path;

  @Override
  protected Class<?> getInputType() {
    System.out.println("The path is: " + this.path);
    switch (this.path) {
      case "/stats":
        return StatsRequest.class;
      case "/apps":
        return AppsRequest.class;
      case "/settings":
        return SettingsRequest.class;
      default:
        return StatsRequest.class;
    }
  }
  
  @Override
  protected Object convertEvent(APIGatewayProxyRequestEvent event) {
    this.path = event.getPath();

    if (event.getBody() == null) {
      event.setBody("{}");
    }

    return super.convertEvent(event);
  }
}
