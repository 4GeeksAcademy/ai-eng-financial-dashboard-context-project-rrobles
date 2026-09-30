/** Operation values exposed by the financial metrics API. */
export type OperationType = "income" | "outcome";

/** Category values exposed by the financial metrics API. */
export type Category =
  | "suppliers"
  | "sales"
  | "operational"
  | "administrative"
  | "others";

/** Business segments exposed by the financial metrics API. */
export type BusinessType = "B2B" | "B2C";

/** Time grouping values accepted by summary and alert endpoints. */
export type GroupBy = "day" | "week" | "month";

/**
 * A financial movement returned by `GET /api/metrics`.
 * The property names and required fields match the OpenAPI `FinancialMovement` schema.
 */
export interface FinancialMovement {
  /**
   * Calendar date of the movement, serialized as `YYYY-MM-DD`.
   * Source: `GET /api/metrics`, OpenAPI `FinancialMovement.create_date` (`string`, `date`).
   */
  create_date: string;

  /**
   * Movement amount as a JSON number; the API does not include a currency field.
   * Source: `GET /api/metrics`, OpenAPI `FinancialMovement.amount` (`number`).
   */
  amount: number;

  /**
   * Whether the movement is income or an outcome.
   * Valid values: `income`, `outcome`.
   * Source: `GET /api/metrics`, OpenAPI `FinancialMovement.operation_type`.
   */
  operation_type: OperationType;

  /**
   * Financial category of the movement.
   * Valid values: `suppliers`, `sales`, `operational`, `administrative`, `others`.
   * Source: `GET /api/metrics`, OpenAPI `FinancialMovement.category`.
   */
  category: Category;

  /**
   * Business segment assigned to the movement.
   * Valid values: `B2B`, `B2C`.
   * Source: `GET /api/metrics`, OpenAPI `FinancialMovement.business_type`.
   */
  business_type: BusinessType;
}

/**
 * Complete `GET /api/metrics` response: an array of `FinancialMovement` objects.
 * The response schema is an array whose items reference OpenAPI `FinancialMovement`.
 */
export type MetricsResponse = FinancialMovement[];

/**
 * Complete response from `GET /api/metrics/facets`.
 * OpenAPI schema: `MetricsFacets`.
 */
export interface FacetsResponse {
  /**
   * Operation types available in the dataset.
   * Values: `income`, `outcome`.
   * Source: `GET /api/metrics/facets`, OpenAPI `MetricsFacets.operation_types`.
   */
  operation_types: OperationType[];

  /**
   * Business segments available in the dataset.
   * Values: `B2B`, `B2C`.
   * Source: `GET /api/metrics/facets`, OpenAPI `MetricsFacets.business_types`.
   */
  business_types: BusinessType[];

  /**
   * Categories available in the dataset.
   * Values: `suppliers`, `sales`, `operational`, `administrative`, `others`.
   * Source: `GET /api/metrics/facets`, OpenAPI `MetricsFacets.categories`.
   */
  categories: Category[];

  /**
   * Earliest movement date, serialized as `YYYY-MM-DD`.
   * Source: `GET /api/metrics/facets`, OpenAPI `MetricsFacets.min_date` (`string`, `date`).
   */
  min_date: string;

  /**
   * Latest movement date, serialized as `YYYY-MM-DD`.
   * Source: `GET /api/metrics/facets`, OpenAPI `MetricsFacets.max_date` (`string`, `date`).
   */
  max_date: string;
}

/**
 * One anomalous outcome period returned by `GET /api/metrics/alerts`.
 * OpenAPI schema: `MetricsAlert`.
 */
export interface AlertEntry {
  /**
   * Group label; format depends on `group_by`: `YYYY-MM` for month,
   * `YYYY-MM-DD` for day, or ISO week `YYYY-Www` for week.
   * Source: `GET /api/metrics/alerts`, OpenAPI `MetricsAlert.period` (`string`).
   */
  period: string;

  /**
   * Recorded outcome amount for this period.
   * Source: `GET /api/metrics/alerts`, OpenAPI `MetricsAlert.outcome_total` (`number`).
   */
  outcome_total: number;

  /**
   * Average outcome of preceding grouped periods in the filtered summary;
   * this is not restricted to a rolling window of three periods.
   * Source: `GET /api/metrics/alerts`, OpenAPI `MetricsAlert.baseline_average` (`number`).
   */
  baseline_average: number;

  /**
   * Increase as a ratio, computed as `(outcome_total - baseline_average) / baseline_average`.
   * For example, `0.7353` represents a 73.53% increase.
   * Source: `GET /api/metrics/alerts`, OpenAPI `MetricsAlert.increase_ratio` (`number`).
   */
  increase_ratio: number;
}

/**
 * Complete `GET /api/metrics/alerts` response: an array of `AlertEntry` objects.
 * OpenAPI schema: array of `MetricsAlert` items.
 */
export type AlertsResponse = AlertEntry[];

/**
 * One category aggregate returned by `GET /api/metrics/categories/top`.
 * OpenAPI schema: `TopCategoryItem`.
 */
export interface CategoryEntry {
  /**
   * Category included in the top results.
   * Values: `suppliers`, `sales`, `operational`, `administrative`, `others`.
   * Source: `GET /api/metrics/categories/top`, OpenAPI `TopCategoryItem.category`.
   */
  category: Category;

  /**
   * Operation used to calculate this aggregate.
   * Values: `income`, `outcome`.
   * Source: `GET /api/metrics/categories/top`, OpenAPI `TopCategoryItem.operation_type`.
   */
  operation_type: OperationType;

  /**
   * Sum of movement amounts for this category and operation type.
   * Source: `GET /api/metrics/categories/top`, OpenAPI `TopCategoryItem.total_amount` (`number`).
   */
  total_amount: number;
}

/**
 * Complete `GET /api/metrics/categories/top` response: an array of `CategoryEntry` objects.
 * OpenAPI schema: array of `TopCategoryItem` items.
 */
export type TopCategoriesResponse = CategoryEntry[];

/** One time-grouped aggregate returned by `GET /api/metrics/summary`. */
export interface MetricsSummaryItem {
  /**
   * Group label; format depends on `group_by`: `YYYY-MM` for month,
   * `YYYY-MM-DD` for day, or ISO week `YYYY-Www` for week.
   * Source: `GET /api/metrics/summary`, OpenAPI `MetricsSummaryItem.period` (`string`).
   */
  period: string;

  /**
   * Sum of income movement amounts in the period.
   * Source: `GET /api/metrics/summary`, OpenAPI `MetricsSummaryItem.income` (`number`).
   */
  income: number;

  /**
   * Sum of outcome movement amounts in the period.
   * Source: `GET /api/metrics/summary`, OpenAPI `MetricsSummaryItem.outcome` (`number`).
   */
  outcome: number;

  /**
   * Net amount in the period, calculated as income minus outcome.
   * Source: `GET /api/metrics/summary`, OpenAPI `MetricsSummaryItem.net` (`number`).
   */
  net: number;
}

/**
 * Complete `GET /api/metrics/summary` response: an array of `MetricsSummaryItem` objects.
 * The OpenAPI 200 response schema is an array of `MetricsSummaryItem` items.
 */
export type MetricsSummaryResponse = MetricsSummaryItem[];