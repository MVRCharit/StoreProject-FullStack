import { Request, Response } from "express";
import {
  logAndAnalyzeDatabaseActivity,
  getSecurityAlertsService,
  getAuditLogsService,
} from "../services/intrusionDetectionService.js";

/**
 * Endpoint for Admin to view security anomaly alerts.
 * Route: GET /security/alerts
 */
export const getSecurityAlerts = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const alerts = await getSecurityAlertsService(limit);
    return res.status(200).json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error("[IntrusionController] Error fetching security alerts:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch security alerts" });
  }
};

/**
 * Endpoint for Admin to view raw database audit logs.
 * Route: GET /security/audit-logs
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const logs = await getAuditLogsService(limit);
    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error("[IntrusionController] Error fetching audit logs:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch audit logs" });
  }
};

/**
 * Endpoint to test or record and analyze a specific database query/action for intrusion.
 * Route: POST /security/analyze-activity
 */
export const analyzeActivity = async (req: Request, res: Response) => {
  try {
    const { user_id, operation_type, table_name, records_accessed, query_text, failed_login_attempts } = req.body;

    const result = await logAndAnalyzeDatabaseActivity({
      user_id,
      operation_type,
      table_name,
      records_accessed,
      query_text,
      failed_login_attempts,
      ip_address: req.ip || "127.0.0.1",
    });

    return res.status(200).json({
      success: true,
      analysis: result,
    });
  } catch (error) {
    console.error("[IntrusionController] Error analyzing activity:", error);
    return res.status(500).json({ success: false, message: "Failed to analyze activity" });
  }
};
