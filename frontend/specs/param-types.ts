import type {
  BusinessType,
  Category,
  GroupBy,
  OperationType,
} from "./api-types";

/**
 * Shared date filters for API query strings and the browser URL search params.
 * The property names match the API and product decision 9.
 */
export interface DateRangeFilter {
  /**
   * Inclusive lower date bound, as `YYYY-MM-DD`; omit when unset.
   * Source: optional `start_date` query parameter on `/api/metrics`, `/api/metrics/alerts`,
   * `/api/metrics/categories/top`, and `/api/metrics/summary`; also stored under this name in the URL.
   */
  start_date?: string;

  /**
   * Inclusive upper date bound, as `YYYY-MM-DD`; omit when unset.
   * Source: optional `end_date` query parameter on `/api/metrics`, `/api/metrics/alerts`,
   * `/api/metrics/categories/top`, and `/api/metrics/summary`; also stored under this name in the URL.
   */
  end_date?: string;
}

/** Query parameters for `GET /api/metrics`. */
export interface MetricsParams extends DateRangeFilter {
  /**
   * Optional category filter.
   * Values: `suppliers`, `sales`, `operational`, `administrative`, `others`.
   * Source: optional `/api/metrics` query parameter `category`.
   */
  category?: Category;

  /**
   * Optional operation filter. Values: `income`, `outcome`.
   * Source: optional `/api/metrics` query parameter `operation_type`.
   */
  operation_type?: OperationType;
}

/** Query parameters for `GET /api/metrics/alerts`. */
export interface AlertsParams extends DateRangeFilter {
  /**
   * Minimum increase ratio required for an alert. API default is `0.3` and its published minimum is `0`;
   * the API publishes no maximum. The UI validates the narrower range `0.01` through `1.0`.
   * Source: optional `/api/metrics/alerts` query parameter `threshold` (`number`, `ge=0`).
   */
  threshold?: number;

  /**
   * Period granularity. Values: `day`, `week`, `month`; API default is `month`.
   * Source: optional `/api/metrics/alerts` query parameter `group_by`.
   */
  group_by?: GroupBy;

  /**
   * Optional business segment filter. Values: `B2B`, `B2C`.
   * Source: optional `/api/metrics/alerts` query parameter `business_type`.
   */
  business_type?: BusinessType;
}

/** Query parameters for `GET /api/metrics/categories/top`. */
export interface TopCategoriesParams extends DateRangeFilter {
  /**
   * Operation to rank. Values: `income`, `outcome`; API default is `outcome`.
   * Source: optional `/api/metrics/categories/top` query parameter `operation_type`.
   */
  operation_type?: OperationType;

  /**
   * Maximum number of category rows; valid integers are `1` through `20`, API default is `5`.
   * The response can contain fewer rows when fewer categories have matching movements.
   * Source: optional `/api/metrics/categories/top` query parameter `limit`.
   */
  limit?: number;

  /**
   * Optional business segment filter. Values: `B2B`, `B2C`.
   * Source: optional `/api/metrics/categories/top` query parameter `business_type`.
   */
  business_type?: BusinessType;
}

/** Query parameters for `GET /api/metrics/summary`, used for F3 group totals. */
export interface MetricsSummaryParams extends DateRangeFilter {
  /**
   * Period granularity. Values: `day`, `week`, `month`; API default is `month`.
   * Source: optional `/api/metrics/summary` query parameter `group_by`.
   */
  group_by?: GroupBy;

  /**
   * Optional category filter.
   * Values: `suppliers`, `sales`, `operational`, `administrative`, `others`.
   * Source: optional `/api/metrics/summary` query parameter `category`.
   */
  category?: Category;

  /**
   * Optional operation filter. Values: `income`, `outcome`.
   * Source: optional `/api/metrics/summary` query parameter `operation_type`.
   */
  operation_type?: OperationType;

  /**
   * Optional business segment filter. Values: `B2B`, `B2C`.
   * Source: optional `/api/metrics/summary` query parameter `business_type`.
   */
  business_type?: BusinessType;
}