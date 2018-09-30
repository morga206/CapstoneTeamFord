package sentiment;

import org.junit.Test;

import org.springframework.cloud.function.adapter.aws.SpringBootRequestHandler;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;

import static org.assertj.core.api.Assertions.assertThat;

public class MapTests {

	@Test
	public void test() {
		Message<HelloResponse> result = (new FunctionApplication()).hello().apply(MessageBuilder.withPayload(new HelloRequest("Alice")).build());
		assertThat(result.getPayload().getMessage()).isEqualTo("Hello, Alice");
	}

	@Test
	public void start() throws Exception {
		SpringBootRequestHandler<Object, Object> handler = new SpringBootRequestHandler<>(FunctionApplication.class);
		handler.handleRequest(MessageBuilder.withPayload(new HelloRequest("Bob")).build(), null);
		handler.close();
	}

}
