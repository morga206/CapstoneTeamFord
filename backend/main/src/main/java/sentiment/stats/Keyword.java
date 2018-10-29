package sentiment.stats;

public class Keyword {
  private String keyword;
  private double percentage;

  public Keyword(String keyword, double percentage) {
    this.keyword = keyword;
    this.percentage = percentage;
  }

  public String getKeyword() {
    return this.keyword;
  }

  public double getPercentage() {
    return this.percentage;
  }
}