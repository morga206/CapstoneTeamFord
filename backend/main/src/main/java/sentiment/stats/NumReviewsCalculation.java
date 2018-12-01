package sentiment.stats;

import com.amazonaws.services.dynamodbv2.model.AttributeValue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Returns the number of reviews in the current sample.
 */
public class NumReviewsCalculation extends StatCalculation {
  public NumReviewsCalculation(List<Map<String, AttributeValue>> items) {
    super(items);
  }

  /**
   * Runs the NumReviews calculation.
   * @return An OutgoingStat containing the calculation results.
   */
  public OutgoingStat<?, ?> calculate() {
    Map<String, Integer> result = new HashMap<String, Integer>();
    result.put("total", items.size());

    return new OutgoingStat<String, Integer>("numReviews", result);
  }
}