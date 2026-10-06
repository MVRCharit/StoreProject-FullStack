import os
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from dotenv import load_dotenv

from database_intrusion_detection.src.detector import DatabaseIntrusionDetector
from product_recommendation.src.recommender import ProductRecommender
from inventory_demand_forecasting.src.forecaster import DemandForecaster

load_dotenv()

app = FastAPI(
    title="StoreProject AI/ML Service Hub",
    description="Microservice providing Database Intrusion Detection, Product Recommendations, and Inventory Demand Forecasting",
    version="2.0.0"
)

# Enable CORS for communication with Node.js and client apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate Module Engines
intrusion_detector = DatabaseIntrusionDetector()
product_recommender = ProductRecommender()
demand_forecaster = DemandForecaster()

# =============================================================================
# 1. HEALTH CHECK
# =============================================================================
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "StoreProject-AIML-Service-Hub",
        "modules": [
            "database_intrusion_detection",
            "product_recommendation",
            "inventory_demand_forecasting"
        ],
        "version": "2.0.0"
    }

# =============================================================================
# 2. DATABASE INTRUSION DETECTION ENDPOINTS
# =============================================================================
class DatabaseAuditLogEntry(BaseModel):
    user_id: Optional[str] = "Anonymous"
    operation_type: Optional[str] = "SELECT"
    table_name: Optional[str] = ""
    records_accessed: Optional[int] = 0
    query_text: Optional[str] = ""
    failed_login_attempts: Optional[int] = 0
    ip_address: Optional[str] = ""

class IntrusionTrainRequest(BaseModel):
    logs: List[DatabaseAuditLogEntry]

@app.post("/intrusion-detection/analyze")
def analyze_database_activity(log: DatabaseAuditLogEntry):
    """
    Analyzes a database activity log for anomalous intrusion behavior.
    """
    try:
        result = intrusion_detector.detect_anomaly(log.model_dump())
        return {"success": True, "analysis": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/intrusion-detection/train")
def train_intrusion_model(payload: IntrusionTrainRequest):
    """
    Trains the intrusion detection model on historical audit logs.
    """
    try:
        result = intrusion_detector.train([l.model_dump() for l in payload.logs])
        return {"success": True, "training_result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# 3. PRODUCT RECOMMENDATION ENDPOINTS
# =============================================================================
class ProductItem(BaseModel):
    id: int
    name: str
    description: Optional[str] = ""
    price: Optional[float] = None
    discount_price: Optional[float] = None
    image_url: Optional[str] = None

class InteractionItem(BaseModel):
    product_id: int
    quantity: Optional[int] = 1

class UserRecRequest(BaseModel):
    user_id: Optional[int] = None
    user_history: List[InteractionItem] = Field(default_factory=list)
    products: List[ProductItem] = Field(default_factory=list)
    top_n: Optional[int] = 8

class ProductRecRequest(BaseModel):
    product_id: int
    products: List[ProductItem] = Field(default_factory=list)
    top_n: Optional[int] = 4

class FrequentlyBoughtTogetherRequest(BaseModel):
    product_ids: List[int] = Field(default_factory=list)
    products: List[ProductItem] = Field(default_factory=list)
    top_n: Optional[int] = 3

@app.post("/recommend/user")
def recommend_for_user(payload: UserRecRequest):
    try:
        recs = product_recommender.recommend_for_user(
            user_id=payload.user_id,
            user_history=[h.model_dump() for h in payload.user_history],
            catalog=[p.model_dump() for p in payload.products],
            top_n=payload.top_n
        )
        return {"success": True, "recommendations": recs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend/product")
def recommend_similar_products(payload: ProductRecRequest):
    try:
        similar = product_recommender.recommend_similar_products(
            product_id=payload.product_id,
            catalog=[p.model_dump() for p in payload.products],
            top_n=payload.top_n
        )
        return {"success": True, "recommendations": similar}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend/frequently-bought-together")
def recommend_frequently_bought_together(payload: FrequentlyBoughtTogetherRequest):
    try:
        bundles = product_recommender.recommend_frequently_bought_together(
            product_ids=payload.product_ids,
            catalog=[p.model_dump() for p in payload.products],
            top_n=payload.top_n
        )
        return {"success": True, "recommendations": bundles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# 4. INVENTORY & DEMAND FORECASTING ENDPOINTS
# =============================================================================
class HistoricalSaleRecord(BaseModel):
    product_id: int
    quantity: int
    created_at: Optional[str] = None

class ForecastRequest(BaseModel):
    product_id: int
    product_name: str
    current_stock: int
    historical_sales: List[HistoricalSaleRecord] = Field(default_factory=list)
    horizon_days: Optional[int] = 30

@app.post("/inventory/forecast")
def forecast_demand(payload: ForecastRequest):
    try:
        forecast = demand_forecaster.forecast_product_demand(
            product_id=payload.product_id,
            product_name=payload.product_name,
            current_stock=payload.current_stock,
            historical_sales=[s.model_dump() for s in payload.historical_sales],
            horizon_days=payload.horizon_days
        )
        return {"success": True, "forecast": forecast}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app:app", host=host, port=port, reload=True)
