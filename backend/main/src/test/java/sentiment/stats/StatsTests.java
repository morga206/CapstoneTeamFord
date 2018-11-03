package sentiment.stats;

import org.junit.Test;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.amazonaws.services.dynamodbv2.model.AttributeValue;

public class StatsTests {

	@Test
	public void testCalculateStats() {

    StatsRequest request = new StatsRequest("", "", "2001-01-01T00:00:00.000Z", "2001-01-01T00:00:00.000Z", new IncomingStat[]{});

    List<Map<String, AttributeValue>> reviews = new ArrayList<Map<String, AttributeValue>>();
    reviews.add(populateReview("test store*test id", "2018-05-21T00:00:00.000Z", "1.0.0", "abcdef", "POSITIVE", new String[0]));
    reviews.add(populateReview("test store*test id", "2018-05-24T00:00:00.000Z", "1.0.0", "123456", "NEGATIVE", new String[0]));

    IncomingStat rawReviews = new IncomingStat();
    rawReviews.setData("rawReviews", null);
    IncomingStat overallSentiment = new IncomingStat();
    overallSentiment.setData("overallSentiment", null);

    IncomingStat[] stats = new IncomingStat[] { rawReviews, overallSentiment };

    OutgoingStat<?, ?>[] result = request.calculateStats(reviews, stats);

    Map<String, String> reviewsJson = new HashMap<String, String>();
    reviewsJson.put("abcdef", "{\"date\":\"2018-05-21T00:00:00.000Z\",\"sentiment\":\"POSITIVE\",\"reviewHash\":\"abcdef\",\"version\":\"1.0.0\",\"appIdStore\":\"test store*test id\"}");
    reviewsJson.put("123456", "{\"date\":\"2018-05-24T00:00:00.000Z\",\"sentiment\":\"NEGATIVE\",\"reviewHash\":\"123456\",\"version\":\"1.0.0\",\"appIdStore\":\"test store*test id\"}");
    OutgoingStat<String, String> rawReviewsResults = new OutgoingStat<String, String>("rawReviews", reviewsJson);

    Map<String, Double> sentimentPercentages = new HashMap<String, Double>();
    sentimentPercentages.put("POSITIVE", 1.0 / 2 * 100);
    sentimentPercentages.put("NEGATIVE", 1.0 / 2 * 100);
    sentimentPercentages.put("MIXED", 0.0);
    sentimentPercentages.put("NEUTRAL", 0.0);
    OutgoingStat<String, Double> overallSentimentResults = new OutgoingStat<String, Double>("overallSentiment", sentimentPercentages);

    OutgoingStat<?, ?>[] expected = new OutgoingStat<?, ?>[] { rawReviewsResults, overallSentimentResults };

    for (int i = 0; i < result.length; i++) {
      assertThat(result[i].getName()).isEqualTo(expected[i].getName());
      assertThat(result[i].getValues()).isEqualTo(expected[i].getValues());
    }
  }
  
  private Map<String, AttributeValue> populateReview(String appIdStore, String date, String version, String reviewHash, String sentiment, String[] keywords) {
    Map<String, AttributeValue> review = new HashMap<String, AttributeValue>();
    review.put("appIdStore", new AttributeValue().withS(appIdStore));
    review.put("date", new AttributeValue().withS(date));
    review.put("version", new AttributeValue().withS(version));
    review.put("reviewHash", new AttributeValue().withS(reviewHash));
    review.put("sentiment", new AttributeValue().withS(sentiment));

    List<AttributeValue> keywordValues = new ArrayList<AttributeValue>();
    for (String keyword : keywords) {
      keywordValues.add(new AttributeValue().withS(keyword));
    }
    review.put("keywords", new AttributeValue().withL(keywordValues));

    return review;
  }

	@Test
	public void testRawReviewsCalculation() {
    List<Map<String, AttributeValue>> reviews = new ArrayList<Map<String, AttributeValue>>();
    reviews.add(populateReview("test store*test id", "2018-05-21T00:00:00.000Z", "1.0.0", "abcdef", "", new String[0]));
    reviews.add(populateReview("test store2*test id2", "2001-04-04T00:00:00.000Z", "0.0.1", "a1b2c3", "", new String[0]));

    OutgoingStat<?, ?> result = new RawReviewsCalculation(reviews).calculate();

    Map<String, String> reviewsJson = new HashMap<String, String>();
    reviewsJson.put("abcdef", "{\"date\":\"2018-05-21T00:00:00.000Z\",\"sentiment\":\"\",\"reviewHash\":\"abcdef\",\"version\":\"1.0.0\",\"appIdStore\":\"test store*test id\"}");
    reviewsJson.put("a1b2c3", "{\"date\":\"2001-04-04T00:00:00.000Z\",\"sentiment\":\"\",\"reviewHash\":\"a1b2c3\",\"version\":\"0.0.1\",\"appIdStore\":\"test store2*test id2\"}");
    
    OutgoingStat<String, String> expected = new OutgoingStat<String, String>("rawReviews", reviewsJson);

    assertThat(result.getName()).isEqualTo(expected.getName());
    assertThat(result.getValues()).isEqualTo(expected.getValues());
  }
  
  @Test
	public void testOverallSentimentCalculation() {
    List<Map<String, AttributeValue>> reviews = new ArrayList<Map<String, AttributeValue>>();
    reviews.add(populateReview("test store*test id", "2018-05-21T00:00:00.000Z", "1.0.0", "abcdef", "POSITIVE", new String[0]));
    reviews.add(populateReview("test store*test id", "2001-04-04T00:00:00.000Z", "1.0.0", "a1b2c3", "NEGATIVE", new String[0]));
    reviews.add(populateReview("test store*test id", "2001-04-05T00:00:00.000Z", "1.0.0", "123456", "NEGATIVE", new String[0]));
    reviews.add(populateReview("test store*test id", "2001-04-06T00:00:00.000Z", "1.0.0", "alsdkj", "MIXED", new String[0]));
    reviews.add(populateReview("test store*test id", "2001-04-07T00:00:00.000Z", "1.0.0", "34895f", "NEUTRAL", new String[0]));
    reviews.add(populateReview("test store*test id", "2001-04-08T00:00:00.000Z", "1.0.0", "asldf4", "NEUTRAL", new String[0]));
    reviews.add(populateReview("test store*test id", "2001-04-08T00:00:00.000Z", "1.0.0", "234i42", "NEUTRAL", new String[0]));
    reviews.add(populateReview("test store*test id", "2001-04-08T00:00:00.000Z", "1.0.0", "asdl23", "NEUTRAL", new String[0]));
    
    

    OutgoingStat<?, ?> result = new OverallSentimentCalculation(reviews).calculate();

    Map<String, Double> sentimentPercentages = new HashMap<String, Double>();
    sentimentPercentages.put("POSITIVE", 1.0 / 8 * 100);
    sentimentPercentages.put("NEGATIVE", 2.0 / 8 * 100);
    sentimentPercentages.put("MIXED", 1.0 / 8 * 100);
    sentimentPercentages.put("NEUTRAL", 4.0 / 8 * 100);
    
    OutgoingStat<String, Double> expected = new OutgoingStat<String, Double>("overallSentiment", sentimentPercentages);

    assertThat(result.getName()).isEqualTo(expected.getName());
    assertThat(result.getValues()).isEqualTo(expected.getValues());
  }
  
  @Test
	public void testSentimentOverTimeCalculation() {
    List<Map<String, AttributeValue>> reviews = new ArrayList<Map<String, AttributeValue>>();
    reviews.add(populateReview("test store*test id", "2001-05-21T00:00:00.000Z", "1.0.0", "abcdef", "POSITIVE", new String[0]));
    reviews.add(populateReview("test store*test id", "2001-05-21T00:00:00.000Z", "1.0.0", "a1b2c3", "NEGATIVE", new String[0]));
    reviews.add(populateReview("test store*test id", "2001-05-21T00:00:00.000Z", "1.0.0", "123456", "NEGATIVE", new String[0]));
    reviews.add(populateReview("test store*test id", "2001-05-22T00:00:00.000Z", "1.0.0", "alsdkj", "MIXED", new String[0]));
    reviews.add(populateReview("test store*test id", "2001-05-22T00:00:00.000Z", "1.0.0", "34895f", "NEGATIVE", new String[0]));
    reviews.add(populateReview("test store*test id", "2001-05-23T00:00:00.000Z", "1.0.0", "asldf4", "NEUTRAL", new String[0]));
    reviews.add(populateReview("test store*test id", "2001-05-23T00:00:00.000Z", "1.0.0", "234i42", "NEUTRAL", new String[0]));
    reviews.add(populateReview("test store*test id", "2001-05-23T00:00:00.000Z", "1.0.0", "asdl23", "NEUTRAL", new String[0]));

    LocalDate startDate = LocalDate.of(2001, 05, 21);
    LocalDate endDate = LocalDate.of(2001, 05, 23);
    OutgoingStat<?, ?> result = new SentimentOverTimeCalculation(reviews, startDate, endDate).calculate();

    Map<String, Object[]> sentimentOverTime = new HashMap<String, Object[]>();
    sentimentOverTime.put("labels", new String[]{"May 21", "May 22", "May 23"});
    sentimentOverTime.put("data", new Double[]{ 2.0 / 3 * 100, 1.0 / 2 * 100, 0.0 });
    sentimentOverTime.put("totals", new Integer[]{3, 2, 3});

    OutgoingStat<String, Object[]> expected = new OutgoingStat<String, Object[]>("sentimentOverTime", sentimentOverTime);

    assertThat(result.getName()).isEqualTo(expected.getName());
    assertThat(result.getValues()).isEqualToComparingFieldByFieldRecursively(expected.getValues());
  }
  
  @Test
	public void testKeywordsCalculation() {
    List<Map<String, AttributeValue>> reviews = new ArrayList<Map<String, AttributeValue>>();
    reviews.add(populateReview("test store*test id", "2018-05-21T00:00:00.000Z", "1.0.0", "abcdef", "POSITIVE", new String[]{"present always", "present sometimes"}));
    reviews.add(populateReview("test store*test id", "2001-05-21T00:00:00.000Z", "1.0.0", "a1b2c3", "NEGATIVE", new String[]{"present always", "present sometimes"}));
    reviews.add(populateReview("test store*test id", "2001-05-21T00:00:00.000Z", "1.0.0", "123456", "NEGATIVE", new String[]{"present always"}));
    reviews.add(populateReview("test store*test id", "2001-05-21T00:00:00.000Z", "1.0.0", "123456", "NEGATIVE", new String[]{"present always"}));
    reviews.add(populateReview("test store*test id", "2001-05-22T00:00:00.000Z", "1.0.0", "alsdkj", "MIXED", new String[]{"won't include mixed"}));
    reviews.add(populateReview("test store*test id", "2001-05-22T00:00:00.000Z", "1.0.0", "34895f", "POSITIVE", new String[]{"present always"}));
    reviews.add(populateReview("test store*test id", "2001-05-23T00:00:00.000Z", "1.0.0", "asldf4", "NEUTRAL", new String[]{"won't include neutral"}));

    OutgoingStat<?, ?> result = new KeywordsCalculation(reviews).calculate();

    Map<String, Keyword[]> keywords = new HashMap<String, Keyword[]>();
    keywords.put("positive", new Keyword[]{ new Keyword("present always", 100.0), new Keyword("present sometimes", 1.0 / 2 * 100)});
    keywords.put("negative", new Keyword[]{ new Keyword("present always", 100.0), new Keyword("present sometimes", 1.0 / 3 * 100)});
    
    OutgoingStat<String, Keyword[]> expected = new OutgoingStat<String, Keyword[]>("keywords", keywords);

    assertThat(result.getName()).isEqualTo(expected.getName());
    assertThat(result.getValues()).isEqualToComparingFieldByFieldRecursively(result.getValues());
	}

}
