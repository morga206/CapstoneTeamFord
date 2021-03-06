package sentiment;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.boot.SpringApplication;
import org.springframework.cloud.function.context.config.ContextFunctionCatalogAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;

import java.util.function.Function;

/**
 * Main Spring application.
 */
@Configuration
@Import({ ContextFunctionCatalogAutoConfiguration.class, ObjectMapper.class })
public class FunctionApplication {

  public static void main(final String[] args) {
    SpringApplication.run(FunctionApplication.class, args);
  }

  /**
   * Lambda function to process sentiment stats.
   * @return Response to pass to API Gateway handler
   */
  @Bean
  public Function<Message<Request>, Message<Response>> stats() {
    return messageRequest -> {
      Request request = messageRequest.getPayload();
      Response response = request.process();

      Message<Response> messageResponse = MessageBuilder
          .withPayload(response)
          .setHeader("Access-Control-Allow-Origin", "*")
          .build();
        
      return messageResponse;
    };
  }

 
}
