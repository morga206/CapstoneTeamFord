package sentiment.stats;

import com.amazonaws.services.dynamodbv2.model.AttributeValue;

import java.util.List;
import java.util.Map;

/**
 * Represents the calculation process for a single stat.
 */
public abstract class StatCalculation {
  protected List<Map<String, AttributeValue>> items;

  public StatCalculation(List<Map<String, AttributeValue>> items) {
    this.items = items;
  }

  /**
   * Defines the calculation for this stat.
   * @return An OutgoingStat containing the calculation results.
   */
  public abstract OutgoingStat<?, ?> calculate();
}