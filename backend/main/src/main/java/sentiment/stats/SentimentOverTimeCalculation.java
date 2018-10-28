package sentiment.stats;

import com.amazonaws.services.dynamodbv2.model.AttributeValue;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

/**
 * Handles calculation of sentiment per date from a list of DynamoDB reviews.
 */
public class SentimentOverTimeCalculation extends StatCalculation {

  /**
   * The starting date for the calculation time interval.
   */
  private LocalDate startDate;

  /**
   * The ending date for the calculation time interval.
   */
  private LocalDate endDate;

  /**
   * The number of positive reviews per day (Using LinkedHashMap to maintain order).
   */
  private Map<LocalDate, Integer> positiveCountsByDate = new LinkedHashMap<LocalDate, Integer>();

  /**
   * The number of total reviews per day (Using LinkedHashMap to maintain order).
   */
  private Map<LocalDate, Integer> totalCountsByDate = new LinkedHashMap<LocalDate, Integer>();

  /**
   *  Chart labels to send to frontend.
   */ 
  List<String> chartLabels = new ArrayList<String>();

  /**
   * Constructs a SentimentOverTimeCalculation.
   * @param items The DynamoDB items to process.
   * @param startDate The start of the time interval to process.
   * @param endDate The end of the time interval to process.
   */
  public SentimentOverTimeCalculation(
      List<Map<String, AttributeValue>> items, LocalDate startDate, LocalDate endDate) {
    super(items);
    
    this.startDate = startDate;
    this.endDate = endDate;
  }

  /**
   * Runs the SentimentOverTime calculation.
   * @return An OutgoingStat containing the calculation results.
   */
  public OutgoingStat<?, ?> calculate() {
    // Mapping Step: DB Items -> Sentiment Counts (per Date)
    initializeLabelsAndCounts();
    countPositiveReviewsByDate();


    // Reduce Step: Lists of Sentiment Values -> Sentiment Percentages
    List<Double> positivePercentagesByDate = calculatePositiveReviewPercentages();

    Map<String, Object[]> result = new HashMap<String, Object[]>();
    result.put("labels", chartLabels.toArray());
    result.put("data", positivePercentagesByDate.toArray());

    return new OutgoingStat<String, Object[]>("sentimentOverTime", result);
  }

  /**
   * Initializes the review count for each day to 0 and generates a chart label for each day.
   */
  private void initializeLabelsAndCounts() {
    // https://stackoverflow.com/questions/40671689/how-to-build-a-list-of-localdate-from-a-given-range
    final int days = (int) startDate.until(endDate, ChronoUnit.DAYS) + 1;

    // Chart uses Month + Day format
    DateTimeFormatter labelFormatter = DateTimeFormatter.ofPattern("MMMM dd");

    Stream.iterate(startDate, date -> date.plusDays(1))
        .limit(days)
        .forEach((date) -> {
          // Create chart label for this date (displayed on dashboard)
          chartLabels.add(date.format(labelFormatter));

          // Initialize review counts for this date
          positiveCountsByDate.put(date, 0);
          totalCountsByDate.put(date, 0);
        });
  }

  /**
   * Iterates through the review list to generate total and positive review counts.
   */
  private void countPositiveReviewsByDate() {
    // DB items use ISO format
    DateTimeFormatter isoFormatter = DateTimeFormatter.ISO_DATE_TIME; 
    for (Map<String, AttributeValue> review : items) {
      LocalDate date = LocalDate.parse(review.get("date").getS(), isoFormatter);
      String sentiment = review.get("sentiment").getS();

      totalCountsByDate.put(date, totalCountsByDate.get(date) + 1);
      if (sentiment.equals("POSITIVE")) {
        positiveCountsByDate.put(date, positiveCountsByDate.get(date) + 1);
      }
    }
  }

  /**
   * Using the total and positive counts, calculate the % Positive Reviews per day.
   * @return An chronological list of the % Positive Reviews each day
   */
  private List<Double> calculatePositiveReviewPercentages() {
    List<Double> result = new ArrayList<Double>();
    for (Map.Entry<LocalDate, Integer> count : positiveCountsByDate.entrySet()) {
      int total = totalCountsByDate.get(count.getKey());
      Double percentage = 
          total == 0 ? null : (double)count.getValue() / total * 100;
      result.add(percentage);
    }
    return result;
  }
}