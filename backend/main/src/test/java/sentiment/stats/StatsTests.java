package sentiment.stats;

import org.junit.Test;

import static org.assertj.core.api.Assertions.assertThat;

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
    reviews.add(populateReview("test store*test id", "2018-05-21T00:00:00.000Z", "1.0.0", "abcdef"));
    reviews.add(populateReview("test store*test id", "2018-05-24T00:00:00.000Z", "1.0.0", "123456"));

    IncomingStat rawReviews = new IncomingStat();
    rawReviews.setData("rawReviews", null);
    IncomingStat[] stats = new IncomingStat[] { rawReviews };

    OutgoingStat<?, ?>[] result = request.calculateStats(reviews, stats);

    Map<String, String> reviewsJson = new HashMap<String, String>();
    reviewsJson.put("abcdef", "{\"date\":\"2018-05-21T00:00:00.000Z\",\"reviewHash\":\"abcdef\",\"version\":\"1.0.0\",\"appIdStore\":\"test store*test id\"}");
    reviewsJson.put("123456", "{\"date\":\"2018-05-24T00:00:00.000Z\",\"reviewHash\":\"123456\",\"version\":\"1.0.0\",\"appIdStore\":\"test store*test id\"}");
    
    OutgoingStat<String, String> rawReviewsResults = new OutgoingStat<String, String>("rawReviews", reviewsJson);
    OutgoingStat<?, ?>[] expected = new OutgoingStat<?, ?>[] { rawReviewsResults };

    for (int i = 0; i < result.length; i++) {
      assertThat(result[i].getName()).isEqualTo(expected[i].getName());
      assertThat(result[i].getValues()).isEqualTo(expected[i].getValues());
    }
  }
  
  private Map<String, AttributeValue> populateReview(String appIdStore, String date, String version, String reviewHash) {
    Map<String, AttributeValue> review = new HashMap<String, AttributeValue>();
    review.put("appIdStore", new AttributeValue().withS(appIdStore));
    review.put("date", new AttributeValue().withS(date));
    review.put("version", new AttributeValue().withS(version));
    review.put("reviewHash", new AttributeValue().withS(reviewHash));

    return review;
  }

	@Test
	public void testRawReviewsCalculation() throws Exception {
    List<Map<String, AttributeValue>> reviews = new ArrayList<Map<String, AttributeValue>>();
    reviews.add(populateReview("test store*test id", "2018-05-21T00:00:00.000Z", "1.0.0", "abcdef"));
    reviews.add(populateReview("test store2*test id2", "2001-04-04T00:00:00.000Z", "0.0.1", "a1b2c3"));

    OutgoingStat<?, ?> result = new RawReviewsCalculation(reviews).calculate();

    Map<String, String> reviewsJson = new HashMap<String, String>();
    reviewsJson.put("abcdef", "{\"date\":\"2018-05-21T00:00:00.000Z\",\"reviewHash\":\"abcdef\",\"version\":\"1.0.0\",\"appIdStore\":\"test store*test id\"}");
    reviewsJson.put("a1b2c3", "{\"date\":\"2001-04-04T00:00:00.000Z\",\"reviewHash\":\"a1b2c3\",\"version\":\"0.0.1\",\"appIdStore\":\"test store2*test id2\"}");
    
    OutgoingStat<String, String> expected = new OutgoingStat<String, String>("rawReviews", reviewsJson);

    assertThat(result.getName()).isEqualTo(expected.getName());
    assertThat(result.getValues()).isEqualTo(expected.getValues());
	}

}
