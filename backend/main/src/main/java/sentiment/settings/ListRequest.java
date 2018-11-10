package sentiment.settings;

import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagement;
import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagementClientBuilder;
import com.amazonaws.services.simplesystemsmanagement.model.GetParameterRequest;
import com.amazonaws.services.simplesystemsmanagement.model.GetParameterResult;
import com.amazonaws.services.simplesystemsmanagement.model.ParameterNotFoundException;
import com.amazonaws.services.simplesystemsmanagement.model.ParameterType;
import com.amazonaws.services.simplesystemsmanagement.model.PutParameterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;

import sentiment.Request;
import sentiment.Response;


/**
 * A query to get or update a list-based setting.
 */
public abstract class ListRequest<T> extends Request {

  protected enum Command {
    ADD,
    DELETE,
    GET;
  }

  private Command command;
  private String paramName;
  private T item;
  private T[] list;

  /**
   * Creatse a new ListRequest.
   * @param command The command to perform - get, add, or delete
   * @param paramName The name of the SSM value to set.
   * @param item The item to add or delete, if appropriate
   */
  public ListRequest(String command, String paramName, T item) {
    try {
      this.command = Command.valueOf(command);
    } catch (Exception exp) {
      this.command = null; // We'll return an error during processing
    }
    this.paramName = paramName;
    this.item = item;
  }

  /**
   * Process the data for this request and return a response.
   */
  public Response process() {
    AWSSimpleSystemsManagement client = AWSSimpleSystemsManagementClientBuilder.defaultClient();
    String message = getList(client);

    if (!message.isEmpty()) {
      return new Response(message);
    }

    switch (this.command) {
      case ADD:
        return add(client, this.list, this.item);
      case DELETE:
        return delete(client, this.list, this.item);
      case GET:
        return get(this.list);
      default:
        return new Response("Invalid command " + this.command);
    }
  }

  /**
   * Convert SSM's JSON representation to a POJO representation
   * @param json The JSON list.
   * @return The list as an array of Java objects
   */
  protected abstract T[] deserializeList(String json) throws Exception;

  /**
   * Add an item to the SSM list.
   * @param client The SSM client to use.
   * @param list The existing list.
   * @param item The item to add
   * @return A Response with either an error message or the updated list.
   */
  protected abstract Response add(AWSSimpleSystemsManagement client, T[] list, T item);

  /**
   * Delete an item from the SSM list.
   * @param client The SSM client to use.
   * @param list The existing list.
   * @param item The item to delete.
   * @return A Response with either an error message or the updated list.
   */
  protected abstract Response delete(AWSSimpleSystemsManagement client, T[] list, T item);

  /**
   * Format the current list in a Response object.
   * @param list The list to format
   * @return A Response with the list.
   */
  protected abstract Response get(T[] list);


  /**
   * Query SSM to get the existing JSON list and deserialize it.
   * @param client The SSM client.
   * @return An error message, if any.
   */
  private String getList(AWSSimpleSystemsManagement client) {
    GetParameterResult result = null;
    String value = null;
    try {
      result = client.getParameter(new GetParameterRequest().withName(paramName));
      value = result.getParameter().getValue();
    } catch (ParameterNotFoundException exp) {
      value = "[]";
    }

    try {
      this.list = deserializeList(value);
    } catch (Exception exp) {
      return "Unable to parse app list from JSON.";
    }

    return "";
  }

  /**
   * Write the updated list to SSM.
   * @param client The SSM client to use.
   * @param newList The updated list to write.
   * @return An error message, if any.
   */
  protected String writeList(AWSSimpleSystemsManagement client, T[] newList) {
    String json;
    try {
      json = new ObjectMapper().writeValueAsString(newList);
    } catch (Exception exp) {
      return "Unable to serialize updated list to JSON.";
    }

    try {
      client.putParameter(new PutParameterRequest()
          .withName(paramName)
          .withValue(json)
          .withType(ParameterType.String)
          .withOverwrite(true));
    } catch (Exception exp) {
      return exp.getMessage();
    }

    return "";
  }

  public Command getCommand() {
    return this.command;
  }
}