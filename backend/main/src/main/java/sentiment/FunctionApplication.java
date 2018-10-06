package sentiment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;

import java.util.Date;
import java.util.function.Function;

import com.amazonaws.services.dynamodbv2.document.ItemCollection;
import com.amazonaws.services.dynamodbv2.document.QueryOutcome;

/**
 * Main Spring application.
 */
@SpringBootApplication
public class FunctionApplication {

  public static void main(final String[] args) {
    SpringApplication.run(FunctionApplication.class, args);
  }

  /**
   * Hello, World lambda function.
   * @return HelloResponse to pass to API Gateway handler
   */
  @Bean
  public Function<Message<Request>, Message<Response>> stats() {
    return messageRequest -> {
      Request request = messageRequest.getPayload();

      ItemCollection<QueryOutcome> items = getDynamoReviews(request.getAppId(), request.getVersion(), request.getStartDate(), request.getEndDate());
      OutgoingStat<?>[] stats = calculateStats(items, request.getStats());

      Response response = new Response(stats);
      // Put stats in response

      Message<Response> messageResponse = MessageBuilder
          .withPayload(response)
          .setHeader("Access-Control-Allow-Origin", "*")
          .build();
        
      return messageResponse;
    };
  }

  private ItemCollection<QueryOutcome> getDynamoReviews(String appId, String version, Date startDate, Date endDate) {

  }

  private OutgoingStat<?>[] calculateStats(ItemCollection<QueryOutcome> items, IncomingStat[] stats) {
    
  }

}
