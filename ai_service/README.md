# AI/ML Microservice Hub for StoreProject-FullStack

This service hosts the AI/ML models and connects seamlessly to the Node.js Express backend via REST API calls.

---

## 📁 Directory Architecture & Where to Write Your Models

```
ai_service/
├── app.py                                         # FastAPI server connecting all 3 AI modules to Node.js
├── requirements.txt                               # Python dependencies
├── .env.example                                   # Port & Host configuration
│
├── 🛡️ database_intrusion_detection/               # Module 1: Database Intrusion Detection
│   ├── data/                                      # Audit logs, query histories, training datasets
│   ├── models/                                    # Serialized models (.pkl, .onnx, .pt)
│   ├── notebooks/                                 # Jupyter notebooks for anomaly analysis
│   └── src/
│       └── detector.py                            # ✍️ [WRITE YOUR K-Means / Isolation Forest / Autoencoder CODE HERE]
│
├── 🛍️ product_recommendation/                     # Module 2: E-Commerce Product Recommendation
│   ├── data/                                      # Customer transaction logs, product catalog
│   ├── models/                                    # Saved association rules / similarity matrices
│   ├── notebooks/                                 # Recommendation & market basket analysis
│   └── src/
│       └── recommender.py                         # ✍️ [WRITE YOUR Apriori / Collaborative Filtering / Cosine Sim CODE HERE]
│
├── 📈 inventory_demand_forecasting/               # Module 3: Inventory & Demand Forecasting
│   ├── data/                                      # Historical sales orders, product stock counts
│   ├── models/                                    # Saved time-series regression models
│   ├── notebooks/                                 # Forecasting experiments (ARIMA, XGBoost, LSTM)
│   └── src/
│       └── forecaster.py                          # ✍️ [WRITE YOUR ARIMA / Regression / XGBoost / LSTM CODE HERE]
│
└── 🧩 common/                                     # Shared database utilities & helper functions
```

---

## 🔌 Backend $\leftrightarrow$ AI/ML Integration Endpoints

| Feature | Node.js Backend Route | AI/ML Service Endpoint | Purpose |
| :--- | :--- | :--- | :--- |
| **Product Recommendations** | `GET /recommendations` | `POST /recommend/user` | Personalized user recommendations |
| **Similar Products** | `GET /recommendations/product/:productId` | `POST /recommend/product` | Content-based item similarity |
| **Frequently Bought Together** | `POST /recommendations/frequently-bought-together` | `POST /recommend/frequently-bought-together` | Apriori / Market basket bundles |
| **Security Alerts** | `GET /security/alerts` | `POST /intrusion-detection/analyze` | List anomalous DB activity detected by AI |
| **Database Activity Analysis**| `POST /security/analyze-activity` | `POST /intrusion-detection/analyze` | Evaluate a query/action for intrusion |
| **Demand Forecasting** | `GET /inventory/forecast` | `POST /inventory/forecast` | Predict demand & reorder alerts |
| **Product Demand** | `GET /inventory/forecast/:productId` | `POST /inventory/forecast` | Single product demand prediction |

---

## 🚀 Running the AI Service

```bash
cd ai_service
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

- **API URL**: `http://localhost:5000`
- **Swagger Documentation**: `http://localhost:5000/docs`
