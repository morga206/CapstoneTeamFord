package sentiment;

import org.junit.Test;

import org.springframework.cloud.function.adapter.aws.SpringBootRequestHandler;

import static org.assertj.core.api.Assertions.assertThat;

public class MapTests {

	@Test
	public void test() {
		HelloResponse result = (new FunctionApplication()).hello().apply(new HelloRequest("Alice"));
		assertThat(result.getMessage()).isEqualTo("Hello, Alice");
	}

	@Test
	public void start() throws Exception {
		SpringBootRequestHandler<Object, Object> handler = new SpringBootRequestHandler<>(FunctionApplication.class);
		handler.handleRequest(new HelloRequest("Bob"), null);
		handler.close();
	}

}
