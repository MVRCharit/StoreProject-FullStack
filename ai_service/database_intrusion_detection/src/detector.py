import os
from typing import List, Dict, Any, Optional

class DatabaseIntrusionDetector:
    """
    AI-Based Database Intrusion Detection System
    --------------------------------------------
    Detects anomalous database activities (e.g. sudden mass SELECTs, bulk DELETEs,
    high frequency failed logins, unauthorized table scans).

    Algorithms you can implement here:
    - K-Means (Cluster normal vs. abnormal user behaviors)
    - Isolation Forest (Identify outlier transaction volumes)
    - One-Class SVM (Model the boundary of normal DB queries)
    - Autoencoder (Deep learning reconstruction error on query features)
    """

    def __init__(self, model_dir: str = "models"):
        self.model_dir = model_dir
        self.model = None  # TODO: Initialize your ML model (e.g., IsolationForest(), KMeans(), Autoencoder)
        self.normal_threshold = 50.0  # Baseline average queries / records accessed

    def extract_features(self, log_entry: Dict[str, Any]) -> List[float]:
        """
        Extract numerical feature vector from a database log entry.
        Features could include:
        - records_accessed (int)
        - is_select, is_insert, is_update, is_delete (binary flags)
        - failed_attempts (int)
        - hour_of_day (0-23)
        """
        # =========================================================================
        # ✍️ [WRITE YOUR FEATURE EXTRACTION CODE HERE]
        # =========================================================================
        records_accessed = float(log_entry.get("records_accessed", 0))
        failed_logins = float(log_entry.get("failed_login_attempts", 0))
        op_type = str(log_entry.get("operation_type", "SELECT")).upper()

        is_select = 1.0 if op_type == "SELECT" else 0.0
        is_insert = 1.0 if op_type == "INSERT" else 0.0
        is_update = 1.0 if op_type == "UPDATE" else 0.0
        is_delete = 1.0 if op_type == "DELETE" else 0.0

        return [records_accessed, failed_logins, is_select, is_insert, is_update, is_delete]

    def train(self, logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Train your anomaly detection model on historical database logs.
        """
        # =========================================================================
        # ✍️ [WRITE YOUR MODEL TRAINING CODE HERE]
        # Example:
        # X = [self.extract_features(log) for log in logs]
        # self.model = IsolationForest(contamination=0.05).fit(X)
        # =========================================================================
        if logs:
            records = [log.get("records_accessed", 0) for log in logs]
            if records:
                self.normal_threshold = float(sum(records) / len(records)) * 3.0

        return {
            "status": "trained",
            "samples_trained": len(logs),
            "normal_threshold": self.normal_threshold
        }

    def detect_anomaly(self, log_entry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict whether an incoming database operation is NORMAL or ANOMALOUS.
        """
        # =========================================================================
        # ✍️ [WRITE YOUR INFERENCE / DETECTION LOGIC HERE]
        # Example:
        # feat = np.array([self.extract_features(log_entry)])
        # prediction = self.model.predict(feat) # -1 for anomaly, 1 for normal
        # =========================================================================
        user_id = log_entry.get("user_id", "Unknown")
        records_accessed = float(log_entry.get("records_accessed", 0))
        failed_attempts = int(log_entry.get("failed_login_attempts", 0))

        is_anomalous = False
        reasons = []

        if records_accessed > (self.normal_threshold * 2):
            is_anomalous = True
            reasons.append(f"Abnormally high records accessed ({int(records_accessed)} vs avg {int(self.normal_threshold)})")

        if failed_attempts >= 5:
            is_anomalous = True
            reasons.append(f"High failed login attempts detected ({failed_attempts})")

        return {
            "user_id": user_id,
            "status": "ANOMALOUS" if is_anomalous else "NORMAL",
            "records_accessed": records_accessed,
            "normal_average": self.normal_threshold,
            "anomaly_score": 0.95 if is_anomalous else 0.05,
            "reasons": reasons if is_anomalous else ["Activity within normal parameters"]
        }
