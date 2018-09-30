package sentiment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;

import java.util.function.Function;

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
  public Function<Message<HelloRequest>, Message<HelloResponse>> hello() {
    return messageRequest -> {
      HelloRequest request = messageRequest.getPayload();

      HelloResponse response = new HelloResponse();
      response.setMessage("Hello, " + request.getName());

      Message<HelloResponse> messageResponse = MessageBuilder
          .withPayload(response)
          .setHeader("Access-Control-Allow-Origin", "*")
          .build();
        
      return messageResponse;
    };
  }

}
