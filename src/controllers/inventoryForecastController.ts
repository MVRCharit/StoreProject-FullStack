import { Request, Response } from "express";
import {
  getAllProductsDemandForecast,
  getSingleProductDemandForecast,
} from "../services/inventoryForecastService.js";

/**
 * Controller to get demand forecasts and reorder alerts for all products.
 * Route: GET /inventory/forecast?horizonDays=30
 */
export const getInventoryDemandForecast = async (req: Request, res: Response) => {
  try {
    const horizonDays = Number(req.query.horizonDays) || 30;
    const forecasts = await getAllProductsDemandForecast(horizonDays);

    const reorderAlerts = forecasts.filter((f) => f.status === "INSUFFICIENT_STOCK");

    return res.status(200).json({
      success: true,
      total_products_analyzed: forecasts.length,
      insufficient_stock_alerts_count: reorderAlerts.length,
      forecasts,
    });
  } catch (error) {
    console.error("[InventoryForecastController] Error fetching inventory forecasts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate inventory demand forecasts",
    });
  }
};

/**
 * Controller to get demand forecast for a single specific product.
 * Route: GET /inventory/forecast/:productId?horizonDays=30
 */
export const getProductDemandForecast = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const horizonDays = Number(req.query.horizonDays) || 30;
    const forecast = await getSingleProductDemandForecast(productId, horizonDays);

    if (!forecast) {
      return res.status(404).json({ success: false, message: "Product forecast not found" });
    }

    return res.status(200).json({
      success: true,
      forecast,
    });
  } catch (error) {
    console.error("[InventoryForecastController] Error fetching product forecast:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product demand forecast",
    });
  }
};
