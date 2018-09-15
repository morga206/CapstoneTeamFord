package sentiment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

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
	public Function<HelloRequest, HelloResponse> hello() {
		return request -> {
			HelloResponse response = new HelloResponse();
			response.setMessage("Hello, " + request.getName());
		    return response;
        };
	}

}
