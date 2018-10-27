package sentiment.stats;

import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Returns a list of DynamoDB reviews, serialized to JSON.
 */
public class RawReviewsCalculation extends StatCalculation {
  public RawReviewsCalculation(List<Map<String, AttributeValue>> items) {
    super(items);
  }

  /**
   * Runs the RawReviews calculation.
   * @return An OutgoingStat containing the calculation results.
   */
  public OutgoingStat<?, ?> calculate() {
    Map<String, String> result = new HashMap<String, String>();

    // Convert DyanmoDB representation to Map<String, String>
    for (Map<String, AttributeValue> item : items) {
      Map<String, String> review = new HashMap<String, String>();
      item.forEach((key, val) -> {
        if (val.getS() != null) {
          review.put(key, val.getS());
        } else if (val.getN() != null) {
          review.put(key, val.getN());
        }
      });


      // Use Jackson to serialize each review to JSON
      try {
        String json = new ObjectMapper().writeValueAsString(review);
        result.put(review.get("reviewHash"), json);
      } catch (JsonProcessingException exp) {
        System.err.println("Error converting rawReviews to JSON");
        System.err.println(exp.getMessage());
      }
    }

    return new OutgoingStat<String, String>("rawReviews", result);
  }
}