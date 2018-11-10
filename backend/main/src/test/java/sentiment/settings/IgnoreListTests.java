package sentiment.settings;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import com.amazonaws.services.simplesystemsmanagement.AbstractAWSSimpleSystemsManagement;
import com.amazonaws.services.simplesystemsmanagement.model.PutParameterRequest;
import com.amazonaws.services.simplesystemsmanagement.model.PutParameterResult;

import org.junit.Test;

public class IgnoreListTests {

  private class MockSSM extends AbstractAWSSimpleSystemsManagement {
    @Override
    public PutParameterResult putParameter(PutParameterRequest request) {
      return new PutParameterResult(); // No-op
    }
  }
  
  @Test
  public void testAddKeyword() {
    // Adding existing keyword should return error
    IgnoreListRequest request = new IgnoreListRequest("ADD", "testKeyword");
    IgnoreListResponse response = request.add(new MockSSM(), new String[]{ "testKeyword" }, "testKeyword");
    IgnoreListResponse expectedResponse = new IgnoreListResponse("Keyword testKeyword already exists in the list.");
    assertThat(response.getData()).isEqualTo(expectedResponse.getData());

    // Successful case
    request = new IgnoreListRequest("ADD", "testKeyword2");
    response = request.add(new MockSSM(), new String[]{ "testKeyword" }, "testKeyword2");

    expectedResponse = new IgnoreListResponse(new String[]{ "testKeyword", "testKeyword2" });
    Map<String, Object> expectedData = expectedResponse.getData();
    for (Map.Entry<String, Object> entry : response.getData().entrySet()) {
      assertThat(entry.getValue()).isEqualTo(expectedData.get(entry.getKey()));
    }
  }

  @Test
  public void testDeleteKeyword() {
    // Deleting nonexisting keyword should return error
    IgnoreListRequest request = new IgnoreListRequest("ADD", "testKeyword2");
    IgnoreListResponse response = request.delete(new MockSSM(), new String[]{ "testKeyword2" }, "testKeyword");
    IgnoreListResponse expectedResponse = new IgnoreListResponse("No keyword testKeyword present in list.");
    assertThat(response.getData()).isEqualTo(expectedResponse.getData());

    // Successful case
    request = new IgnoreListRequest("ADD", "testKeyword2");
    response = request.delete(new MockSSM(), new String[]{ "testKeyword", "testKeyword2" }, "testKeyword2");
    
    expectedResponse = new IgnoreListResponse(new String[]{ "testKeyword" });
    Map<String, Object> expectedData = expectedResponse.getData();
    for (Map.Entry<String, Object> entry : response.getData().entrySet()) {
      assertThat(entry.getValue()).isEqualTo(expectedData.get(entry.getKey()));
    }
  }

}
