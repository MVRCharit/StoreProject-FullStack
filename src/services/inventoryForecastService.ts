import db from "../database/db.js";

const ML_SERVICE_URL = (typeof process !== "undefined" && process.env?.ML_SERVICE_URL) || "http://localhost:5000";

interface ForecastResult {
  product_id: number;
  product_name: string;
  current_stock: number;
  predicted_demand: number;
  forecast_period_days: number;
  reorder_units_needed: number;
  status: string;
  recommendation: string;
}

/**
 * Fetch inventory demand forecasts for all approved products.
 */
export async function getAllProductsDemandForecast(horizonDays: number = 30): Promise<ForecastResult[]> {
  // 1. Fetch approved products with current stock
  const [products]: any = await db.query(
    "SELECT id, name, qty as current_stock FROM products WHERE approval_status = 'approved'"
  );

  if (!products || products.length === 0) {
    return [];
  }

  // 2. Fetch sales history per product from orders
  const [salesHistory]: any = await db.query(
    "SELECT product_id, quantity, created_at FROM orders WHERE status != 'cancelled'"
  );

  // Group sales history by product_id
  const salesByProduct = new Map<number, any[]>();
  for (const sale of salesHistory) {
    if (!salesByProduct.has(sale.product_id)) {
      salesByProduct.set(sale.product_id, []);
    }
    salesByProduct.get(sale.product_id)!.push(sale);
  }

  const results: ForecastResult[] = [];

  for (const product of products) {
    const history = salesByProduct.get(product.id) || [];

    try {
      // Call AI/ML forecasting service
      const response = await fetch(`${ML_SERVICE_URL}/inventory/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          current_stock: product.current_stock || 0,
          historical_sales: history,
          horizon_days: horizonDays,
        }),
      });

      if (response.ok) {
        const data: any = await response.json();
        if (data.forecast) {
          results.push(data.forecast);
          continue;
        }
      }
    } catch (err) {
      // Handled in fallback below
    }

    // Fallback heuristic if ML service is not reachable
    const totalSold = history.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
    const estimatedDemand = Math.max(10, Math.round(totalSold * 1.25) || 25);
    const reorderUnits = Math.max(0, estimatedDemand - (product.current_stock || 0));

    results.push({
      product_id: product.id,
      product_name: product.name,
      current_stock: product.current_stock || 0,
      predicted_demand: estimatedDemand,
      forecast_period_days: horizonDays,
      reorder_units_needed: reorderUnits,
      status: product.current_stock < estimatedDemand ? "INSUFFICIENT_STOCK" : "ADEQUATE",
      recommendation:
        product.current_stock < estimatedDemand
          ? `Reorder ${reorderUnits} units.`
          : "Stock level is sufficient.",
    });
  }

  return results;
}

/**
 * Fetch forecast for a single product.
 */
export async function getSingleProductDemandForecast(productId: number, horizonDays: number = 30) {
  const forecasts = await getAllProductsDemandForecast(horizonDays);
  return forecasts.find((f) => f.product_id === productId) || null;
}
