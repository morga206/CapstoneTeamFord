package sentiment.stats;

import com.amazonaws.services.dynamodbv2.model.AttributeValue;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Handles calculation of sentiment value percentages from a list of DynamoDB reviews.
 */
public class OverallSentimentCalculation extends StatCalculation {
  public OverallSentimentCalculation(List<Map<String, AttributeValue>> items) {
    super(items);
  }

  /**
   * Runs the OverallSentiment calculation.
   * @return An OutgoingStat containing the calculation results.
   */
  public OutgoingStat<?, ?> calculate() {
    // Mapping step: DB Item -> Sentiment Value
    List<String> sentimentValues = new ArrayList<String>();
    for (Map<String, AttributeValue> item : items) {
      sentimentValues.add(item.get("sentiment").getS());
    }

    // Reducing step: Sentiment Values -> Count
    Map<String, Integer> counts = new HashMap<String, Integer>();
    counts.put("POSITIVE", 0);
    counts.put("NEGATIVE", 0);
    counts.put("NEUTRAL", 0);
    counts.put("MIXED", 0);

    for (String sentiment : sentimentValues) {
      counts.put(sentiment, counts.get(sentiment) + 1);
    }

    // Convert counts to percentages
    Map<String, Double> results = new HashMap<String, Double>();
    for (Map.Entry<String, Integer> count : counts.entrySet()) {
      double percentage = items.size() == 0 ? 0 : (double)count.getValue() / items.size() * 100;
      results.put(count.getKey(), percentage);
    }

    return new OutgoingStat<String, Double>("overallSentiment", results);
  }
}