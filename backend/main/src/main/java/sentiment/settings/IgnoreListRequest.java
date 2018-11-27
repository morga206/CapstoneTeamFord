package sentiment.settings;

import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagement;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Arrays;


/**
 * A query to get or update the list of keywords to ignore.
 */
public class IgnoreListRequest extends ListRequest<String> {

  /**
   * Creatse a new IgnoreListRequest.
   * @param command The command to perform - get, add, or delete words
   * @param keyword The keyword to add or delete, if appropriate
   */
  @JsonCreator
  public IgnoreListRequest(
      @JsonProperty("command") String command, 
      @JsonProperty("keyword") String keyword) {
    super(command, Constants.IGNORELIST_SSM_PARAM, keyword);
  }

  /**
   * Convert SSM's JSON representation to a POJO representation
   * @param json The JSON list.
   * @return The list as an array of Java objects
   */
  protected String[] deserializeList(String json) throws Exception {
    return new ObjectMapper().readValue(json, String[].class);
  }

  /**
   * Add an app to the SSM list.
   * @param client The SSM client to use.
   * @param ignoreList The existing word list.
   * @param keyword The word to add.
   * @return An IgnoreListResponse with an error message or the updated list.
   */
  protected IgnoreListResponse add(
      AWSSimpleSystemsManagement client, 
      String[] ignoreList, 
      String keyword) {
    for (String existingKeyword : ignoreList) {
      if (existingKeyword.equals(keyword)) {
        return new IgnoreListResponse(
          "Keyword " + keyword + " already exists in the list.");
      }
    }

    String[] newList = Arrays.copyOf(ignoreList, ignoreList.length + 1);
    newList[newList.length - 1] = keyword;

    String message = writeList(client, newList);

    if (!message.isEmpty()) {
      return new IgnoreListResponse(message);
    }

    return new IgnoreListResponse(newList);
  }

  /**
   * Update an existing item in the SSM list.
   * @param client The SSM client to use.
   * @param list The existing list.
   * @param item The item to update.
   * @return A Response with either an error message or the updated list.
   */
  protected IgnoreListResponse update(AWSSimpleSystemsManagement client, 
      String[] ignoreList, 
      String keyword) {
    return new IgnoreListResponse(
      "The UPDATE operation is not supported for the keyword list.");
  }

  /**
   * Delete a keyword from the SSM list.
   * @param client The SSM client to use.
   * @param ignoreList The existing keyword list.
   * @param keyword The keyword to delete.
   * @return An IgnoreListResponse with an error message or the updated list.
   */
  protected IgnoreListResponse delete(
      AWSSimpleSystemsManagement client, 
      String[] ignoreList, 
      String keyword) {
    String[] newList = new String[ignoreList.length - 1];
    int idx = 0;

    boolean present = false;
    for (String existingKeyword : ignoreList) {
      if (existingKeyword.equals(keyword)) {
        present = true;
      } else if (idx < ignoreList.length - 1) {
        newList[idx] = existingKeyword;
        idx++;
      }
    }

    if (!present) {
      return new IgnoreListResponse("No keyword " + keyword + " present in list.");
    }

    String message = writeList(client, newList);
    if (!message.isEmpty()) {
      return new IgnoreListResponse(message);
    }

    return new IgnoreListResponse(newList);
  }

  /**
   * Format the current list in a Response object.
   * @param list The list to format
   * @return A Response with the list.
   */
  protected IgnoreListResponse get(String[] list) {
    return new IgnoreListResponse(list);
  }


}