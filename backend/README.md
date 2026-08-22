# QuantEngine Backend API Server

Django REST Framework backend for QuantEngine real-time stock screener and AI/ML quantitative trading engine.

## Setup & Running
```bash
cd backend
source ../venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Features
- Real-time stock universe screening (₹30-₹500 LTP, >10L Bid/Ask Qty).
- Technical Indicators: SMMA(20), SMMA(120), VWAP.
- Quantitative ML Signal Classifier (`screener/ml_model.py`).
- Production SMTP Email OTP Engine via `pvsaketh1@gmail.com`.
- DoS Rate Limiting & OWASP Security Headers Middleware.
