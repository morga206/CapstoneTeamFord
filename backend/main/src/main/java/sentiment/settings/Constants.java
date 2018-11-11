package sentiment.settings;

public final class Constants {

  public static final String STAGE = System.getenv("STAGE");
  public static final String REGION = System.getenv("DEPLOY_REGION");

  public static final String APPLIST_SSM_PARAM = "appList-" + STAGE;
  public static final String IGNORELIST_SSM_PARAM = "ignoreList-" + STAGE;

  /**
   * Add the current stage to the requested parameter name.
   * @param paramName The original parameter name.
   */
  public static String concatStage(String paramName) {
    return paramName + "-" + STAGE;
  }

  /**
   * Add the current stage to a list of parameter names.
   * @param paramNames The original parameter names.
   */
  public static String[] concatStages(String[] paramNames) {
    String[] results = new String[paramNames.length];
    for (int i = 0; i < paramNames.length; i++) {
      results[i] = concatStage(paramNames[i]);
    }
    return results;
  }

}