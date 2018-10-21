package sentiment.settings;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import com.amazonaws.services.simplesystemsmanagement.AbstractAWSSimpleSystemsManagement;
import com.amazonaws.services.simplesystemsmanagement.model.PutParameterRequest;
import com.amazonaws.services.simplesystemsmanagement.model.PutParameterResult;

import org.junit.Test;

public class AppListTests {

  private class MockSSM extends AbstractAWSSimpleSystemsManagement {
    @Override
    public PutParameterResult putParameter(PutParameterRequest request) {
      return new PutParameterResult(); // No-op
    }
  }

  @Test
  public void testCheckValidity() {
    // Store is invalid
    App app = new App("Test Name", "Made-up store", "Valid.ID");
    assertThat(app.checkValidity()).isNotEmpty();

    // ID is invalid
    app = new App("Test Name", "App Store", "&Valid.ID");
    assertThat(app.checkValidity()).isNotEmpty();

    // Both store and ID are invalid
    app = new App("Test Name", "Made-up store", "&Valid.ID");
    assertThat(app.checkValidity()).isNotEmpty();

    // Successful case
    app = new App("Test Name", "App store", "Valid.ID");
    assertThat(app.checkValidity()).isNotEmpty();
  }
  
  @Test
  public void testAddApp() {
    // Invalid app data should return error
    App app = new App("Valid Name", "Made-up Store", "Valid.ID");
    AppListRequest request = new AppListRequest("ADD", app);
    AppListResponse response = request.addApp(new MockSSM(), new App[1]);
    AppListResponse expectedResponse = new AppListResponse("Invalid store Made-up Store.");
    assertThat(response.getData()).isEqualTo(expectedResponse.getData());

    // Adding existing app should return error
    app = new App("Valid Name", "App Store", "Valid.ID");
    request = new AppListRequest("ADD", app);
    response = request.addApp(new MockSSM(), new App[]{ app });
    expectedResponse = new AppListResponse("App with id Valid.ID already exists in the list.");
    assertThat(response.getData()).isEqualTo(expectedResponse.getData());

    // Successful case
    App anotherApp = new App("Valid Name", "App Store", "Valid.ID2");
    request = new AppListRequest("ADD", anotherApp);
    response = request.addApp(new MockSSM(), new App[]{ app });

    expectedResponse = new AppListResponse(new App[]{ app, anotherApp });
    Map<String, Object> expectedData = expectedResponse.getData();
    for (Map.Entry<String, Object> entry : response.getData().entrySet()) {
      assertThat(entry.getValue()).isEqualTo(expectedData.get(entry.getKey()));
    }
  }

  @Test
  public void testDeleteApp() {
    // Invalid app data should return error
    App app = new App("Valid Name", "Made-up Store", "Valid.ID");
    AppListRequest request = new AppListRequest("ADD", app);
    AppListResponse response = request.deleteApp(new MockSSM(), new App[1]);
    AppListResponse expectedResponse = new AppListResponse("Invalid store Made-up Store.");
    assertThat(response.getData()).isEqualTo(expectedResponse.getData());

    // Deleting nonexisting app should return error
    app = new App("Valid Name", "App Store", "Valid.ID");
    App anotherApp = new App("Valid Name", "App Store", "Valid.ID2");
    request = new AppListRequest("ADD", app);
    response = request.deleteApp(new MockSSM(), new App[]{ anotherApp });
    expectedResponse = new AppListResponse("No app with id Valid.ID present in list.");
    assertThat(response.getData()).isEqualTo(expectedResponse.getData());

    // Successful case
    request = new AppListRequest("ADD", anotherApp);
    response = request.deleteApp(new MockSSM(), new App[]{ app, anotherApp });
    
    expectedResponse = new AppListResponse(new App[]{ app });
    Map<String, Object> expectedData = expectedResponse.getData();
    for (Map.Entry<String, Object> entry : response.getData().entrySet()) {
      assertThat(entry.getValue()).isEqualTo(expectedData.get(entry.getKey()));
    }
    
  }

}
