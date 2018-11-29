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
    App app = new App("Test Name", "Made-up store", "Valid.ID", true);
    assertThat(app.checkValidity()).isNotEmpty();

    // ID is invalid
    app = new App("Test Name", "App Store", "&Valid.ID", true);
    assertThat(app.checkValidity()).isNotEmpty();

    // Both store and ID are invalid
    app = new App("Test Name", "Made-up store", "&Valid.ID", true);
    assertThat(app.checkValidity()).isNotEmpty();

    // Successful case
    app = new App("Test Name", "App store", "Valid.ID", true);
    assertThat(app.checkValidity()).isNotEmpty();
  }
  
  @Test
  public void testAddApp() {
    // Invalid app data should return error
    App app = new App("Valid Name", "Made-up Store", "Valid.ID", true);
    AppListRequest request = new AppListRequest("ADD", app);
    AppListResponse response = request.add(new MockSSM(), new App[1], app);
    AppListResponse expectedResponse = new AppListResponse("Invalid store Made-up Store.");
    assertThat(response.getData()).isEqualTo(expectedResponse.getData());

    // Adding existing app should return error
    app = new App("Valid Name", "App Store", "Valid.ID", true);
    request = new AppListRequest("ADD", app);
    response = request.add(new MockSSM(), new App[]{ app }, app);
    expectedResponse = new AppListResponse("App with id Valid.ID already exists in the list.");
    assertThat(response.getData()).isEqualTo(expectedResponse.getData());

    // Successful case (store values differ)
    App anotherApp = new App("Valid Name", "Google Play", "Valid.ID", false);
    request = new AppListRequest("ADD", anotherApp);
    response = request.add(new MockSSM(), new App[]{ app }, anotherApp);

    expectedResponse = new AppListResponse(new App[]{ app, anotherApp });
    Map<String, Object> expectedData = expectedResponse.getData();
    for (Map.Entry<String, Object> entry : response.getData().entrySet()) {
      assertThat(entry.getValue()).isEqualTo(expectedData.get(entry.getKey()));
    }

     // Successful case (id values differ)
     anotherApp = new App("Valid Name", "App Store", "Valid.ID2", true);
     request = new AppListRequest("ADD", anotherApp);
     response = request.add(new MockSSM(), new App[]{ app }, anotherApp);
 
     expectedResponse = new AppListResponse(new App[]{ app, anotherApp });
     expectedData = expectedResponse.getData();
     for (Map.Entry<String, Object> entry : response.getData().entrySet()) {
       assertThat(entry.getValue()).isEqualTo(expectedData.get(entry.getKey()));
    }
  }

  @Test
  public void testUpdateApp() {
    // Invalid app data should return error
    App app = new App("Valid Name", "Made-up Store", "Valid.ID", true);
    AppListRequest request = new AppListRequest("UDPATE", app);
    AppListResponse response = request.update(new MockSSM(), new App[1], app);
    AppListResponse expectedResponse = new AppListResponse("Invalid store Made-up Store.");
    assertThat(response.getData()).isEqualTo(expectedResponse.getData());

    // Updating nonexisting app should return error
    app = new App("Valid Name", "App Store", "Valid.ID", true);
    App anotherApp = new App("Valid Name", "App Store", "Valid.ID2", false);
    request = new AppListRequest("UPDATE", app);
    response = request.update(new MockSSM(), new App[]{ anotherApp }, app);
    expectedResponse = new AppListResponse("Could not locate app with id Valid.ID to update.");
    assertThat(response.getData()).isEqualTo(expectedResponse.getData());

    // Successful case
    App updatedApp = new App("New Valid Name", "App Store", "Valid.ID2", true);
    request = new AppListRequest("UPDATE", updatedApp);
    response = request.update(new MockSSM(), new App[]{ anotherApp, app }, updatedApp);
    
    expectedResponse = new AppListResponse(new App[]{ updatedApp, app });
    Map<String, Object> expectedData = expectedResponse.getData();
    for (Map.Entry<String, Object> entry : response.getData().entrySet()) {
      assertThat(entry.getValue()).isEqualTo(expectedData.get(entry.getKey()));
    }
  }

  @Test
  public void testDeleteApp() {
    // Invalid app data should return error
    App app = new App("Valid Name", "Made-up Store", "Valid.ID", true);
    AppListRequest request = new AppListRequest("DELETE", app);
    AppListResponse response = request.delete(new MockSSM(), new App[1], app);
    AppListResponse expectedResponse = new AppListResponse("Invalid store Made-up Store.");
    assertThat(response.getData()).isEqualTo(expectedResponse.getData());

    // Deleting nonexisting app should return error
    app = new App("Valid Name", "App Store", "Valid.ID", true);
    App anotherApp = new App("Valid Name", "App Store", "Valid.ID2", false);
    request = new AppListRequest("DELETE", app);
    response = request.delete(new MockSSM(), new App[]{ anotherApp }, app);
    expectedResponse = new AppListResponse("No app with id Valid.ID present in list.");
    assertThat(response.getData()).isEqualTo(expectedResponse.getData());

    // Successful case
    request = new AppListRequest("DELETE", anotherApp);
    response = request.delete(new MockSSM(), new App[]{ app, anotherApp }, anotherApp);
    
    expectedResponse = new AppListResponse(new App[]{ app });
    Map<String, Object> expectedData = expectedResponse.getData();
    for (Map.Entry<String, Object> entry : response.getData().entrySet()) {
      assertThat(entry.getValue()).isEqualTo(expectedData.get(entry.getKey()));
    }
    
  }

}
