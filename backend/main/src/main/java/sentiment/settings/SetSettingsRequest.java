package sentiment.settings;

import com.amazonaws.services.cloudwatchevents.AmazonCloudWatchEvents;
import com.amazonaws.services.cloudwatchevents.AmazonCloudWatchEventsClient;
import com.amazonaws.services.cloudwatchevents.model.PutRuleRequest;
import com.amazonaws.services.cloudwatchevents.model.PutRuleResult;
import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagement;
import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagementClientBuilder;
import com.amazonaws.services.simplesystemsmanagement.model.ParameterType;
import com.amazonaws.services.simplesystemsmanagement.model.PutParameterRequest;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import sentiment.Request;
import sentiment.Response;

/**
 * A query to set an admin portal setting.
 */
public class SetSettingsRequest extends Request {

  private Setting[] settings;

  /**
   * Creates a set settings request.
   * @param settings The list of setting name-value pairs to set
   */
  @JsonCreator
  public SetSettingsRequest(@JsonProperty("settings") Setting[] settings) {
    this.settings = settings;
  }

  /**
   * Process the data for this request and return a response.
   */
  public Response process() {
    for (Setting setting: settings) {
      // We add the stage to maintain parameter isolation between stages in SSM.
      String response = this.setSetting(
          Constants.concatStage(setting.getName()), setting.getValue());
      if (!response.isEmpty()) {
        return new SetSettingsResponse(response);
      }

      response = updateLambdaInterval(setting.getName(), setting.getValue());
      if (!response.isEmpty()) {
        return new SetSettingsResponse(response);
      }
    }
        
    return new SetSettingsResponse();
  }

  private String setSetting(String name, String value) {
    AWSSimpleSystemsManagement client = AWSSimpleSystemsManagementClientBuilder.defaultClient();

    try {
      client.putParameter(new PutParameterRequest()
          .withName(name)
          .withValue(value)
          .withType(ParameterType.String)
          .withOverwrite(true));
    } catch (Exception exp) {
      return exp.getMessage();
    }
    
    return "";

  }

  /**
   * Updates the Lambda invocation interval for the given setting, if necessary.
   * @param settingName The setting name
   * @param settingValue The setting value
   */
  private String updateLambdaInterval(String settingName, String settingValue) {
    // Query environment variables to check if this setting pertains to any Lambdas
    String envVarName = settingName.toUpperCase() + "_CLOUDWATCH_EVENT";
    String cloudWatchEventName = System.getenv(envVarName);

    if (cloudWatchEventName == null) {
      // No Cloud Watch rules to update for this setting
      return "";
    }

    // Update CloudWatch Event to set new Lambda interval, if necessary
    AmazonCloudWatchEvents cwe = AmazonCloudWatchEventsClient.builder().build();

    PutRuleRequest request = new PutRuleRequest()
        .withName(cloudWatchEventName)
        .withScheduleExpression("rate(" + settingValue + " minutes)");

    try {
      cwe.putRule(request);
    } catch (Exception exp) {
      System.err.println(
          "Error updating CloudWatch event "
          + cloudWatchEventName + ": " + exp.getMessage());
      return exp.getMessage();
    }

    return "";
  }
}