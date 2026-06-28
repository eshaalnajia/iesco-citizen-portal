def compute_new_average(
    current_avg:    float,
    total_reviews:  int,
    new_rating:     int,
) -> tuple[float, int]:
    """
    Computes an updated rolling average when a new rating is submitted.

    Running average formula:
    new_avg = (current_avg * total_reviews + new_rating) / (total_reviews + 1)

    Returns: (new_average rounded to 2dp, new_total_reviews)
    """
    new_total = total_reviews + 1
    new_avg   = (
        (current_avg * total_reviews + new_rating) / new_total
    )
    return round(new_avg, 2), new_total


def rating_label(avg: float) -> str:
    """Human-readable label for a numeric rating."""
    if avg >= 4.5:  return "Excellent"
    if avg >= 4.0:  return "Very Good"
    if avg >= 3.5:  return "Good"
    if avg >= 3.0:  return "Average"
    return "Below Average"
