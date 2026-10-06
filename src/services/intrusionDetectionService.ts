import db from "../database/db.js";

const ML_SERVICE_URL = (typeof process !== "undefined" && process.env?.ML_SERVICE_URL) || "http://localhost:5000";

export interface AuditLogData {
  user_id?: string;
  operation_type?: string; // SELECT, INSERT, UPDATE, DELETE
  table_name?: string;
  records_accessed?: number;
  query_text?: string;
  failed_login_attempts?: number;
  ip_address?: string;
}

/**
 * Record a database operation and analyze it for potential intrusion/anomaly using AI/ML.
 */
export async function logAndAnalyzeDatabaseActivity(logData: AuditLogData) {
  try {
    // 1. Insert into database_audit_logs
    await db.execute(
      `INSERT INTO database_audit_logs (user_id, operation_type, table_name, records_accessed, query_text, failed_login_attempts, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        logData.user_id || "Anonymous",
        logData.operation_type || "SELECT",
        logData.table_name || "",
        logData.records_accessed || 0,
        logData.query_text || "",
        logData.failed_login_attempts || 0,
        logData.ip_address || "127.0.0.1",
      ]
    );

    // 2. Call AI/ML Intrusion Detection Microservice
    const response = await fetch(`${ML_SERVICE_URL}/intrusion-detection/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData),
    });

    if (!response.ok) {
      throw new Error(`ML service returned status ${response.status}`);
    }

    const data: any = await response.json();
    const analysis = data.analysis;

    // 3. If classified as ANOMALOUS, insert into security_alerts table
    if (analysis && analysis.status === "ANOMALOUS") {
      console.warn(
        `🚨 [SECURITY ALERT] Anomalous DB access detected for User ${logData.user_id}: ${analysis.reasons?.join(", ")}`
      );
      await db.execute(
        `INSERT INTO security_alerts (user_id, anomaly_score, status, details)
         VALUES (?, ?, ?, ?)`,
        [
          String(logData.user_id || "Unknown"),
          analysis.anomaly_score || 0.9,
          "ANOMALOUS",
          JSON.stringify({
            reasons: analysis.reasons,
            records_accessed: analysis.records_accessed,
            normal_average: analysis.normal_average,
          }),
        ]
      );
    }

    return analysis;
  } catch (error) {
    console.warn(
      "[IntrusionDetectionService] AI Intrusion analysis offline or error:",
      (error as Error).message
    );
    return {
      user_id: logData.user_id,
      status: "NORMAL",
      anomaly_score: 0.0,
      reasons: ["Fallback: AI analysis offline"],
    };
  }
}

/**
 * Fetch all security alerts for admin dashboard.
 */
export async function getSecurityAlertsService(limit: number = 50) {
  const [rows]: any = await db.query(
    "SELECT * FROM security_alerts ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
  return rows;
}

/**
 * Fetch audit logs.
 */
export async function getAuditLogsService(limit: number = 100) {
  const [rows]: any = await db.query(
    "SELECT * FROM database_audit_logs ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
  return rows;
}
