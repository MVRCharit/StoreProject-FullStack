# AI/ML Recommendation Service

This folder contains the dedicated AI/ML Recommendation Engine microservice for **StoreProject-FullStack**. It exposes a lightweight REST API (FastAPI) that seamlessly communicates with the Node.js Express backend.

---

## 📁 Directory Structure

```
ai_service/
├── app.py                     # Main FastAPI server exposing recommendation endpoints
├── requirements.txt           # Python dependencies
├── .env.example               # Configuration template
├── README.md                  # Documentation & usage guide
├── model/                     # Serialized trained model weights (.pkl, .pt, .onnx)
│   └── recommender_model.pkl
├── data/                      # Dataset dumps, interaction logs, and offline training data
└── src/
    ├── __init__.py
    ├── preprocessor.py        # Text & metadata preprocessing
    ├── recommender.py         # Recommendation algorithms (Content-Based, Collaborative, Hybrid)
    └── train.py               # Standalone training script
```

---

## 🚀 Setup & Installation

### 1. Create a Python Virtual Environment
```bash
cd ai_service
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 4. Run the Service
```bash
# Using uvicorn with auto-reload
uvicorn app:app --host 0.0.0.0 --port 5000 --reload

# Or directly with Python
python app.py
```

The interactive OpenAPI / Swagger documentation will be live at:
👉 **http://localhost:5000/docs**
