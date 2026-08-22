# QuantEngine — Institutional Real-Time Stock Screener & AI/ML Quantitative Analysis System

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Python](https://img.shields.io/badge/python-3.13-blue)
![Django](https://img.shields.io/badge/django-6.1-green)
![React](https://img.shields.io/badge/react-18.3-cyan)
![Vite](https://img.shields.io/badge/vite-8.2-purple)
![License](https://img.shields.io/badge/license-MIT-orange)

**QuantEngine** is an institutional-grade, full-stack quantitative trading platform designed for real-time market depth screening, technical indicator calculation, and Machine Learning signal filtering on National Stock Exchange (NSE) securities. 

Built specifically for **SSG Infotech Technical Assignment 1 (AI/ML Engineer - Quantitative Programming)**.

---

## 🌐 Live Production Links
- **Live Frontend Web App**: [https://angelone-mocha.vercel.app](https://angelone-mocha.vercel.app)
- **Live Production REST API**: [https://quantengine-backend.onrender.com](https://quantengine-backend.onrender.com)
- **GitHub Repository**: [https://github.com/PVSaketh2003/angelone](https://github.com/PVSaketh2003/angelone)

---

## 📖 End-User Application Guide

### Step 1: User Account Registration & Real-Time Email OTP
1. Open the live web app at [https://angelone-mocha.vercel.app](https://angelone-mocha.vercel.app).
2. Click **Sign Up** on the authentication card.
3. Fill in your **Username**, **Email Address**, and **Password**.
4. Click **Create Account**. Your account will be created in an inactive staging state.
5. Check your email inbox for a 6-digit verification OTP sent directly from **`pvsaketh1@gmail.com`**.
6. Enter the 6-digit OTP code on the verification screen to activate your account and automatically log in.

---

### Step 2: Navigating the Live Stock Screener Dashboard
1. Once logged in, you will arrive at the **Live Stock Screener Dashboard**.
2. **Live Data Streaming**: Stock prices, market depth, and indicators update automatically every 1.5 seconds without full page reloads.
3. **Custom Filters**: Click **Filter Parameters** to customize:
   - **Min/Max LTP**: Default is set to **₹30.00 – ₹500.00**.
   - **Min Bid/Ask Depth**: Default is set to **10,00,000 (10 Lakhs)**.
4. **Table Columns Breakdown**:
   - **Symbol & Company**: NSE Ticker (e.g. `TATAMOTORS`, `SBIN`, `RELIANCE`).
   - **LTP & Change**: Last Traded Price with color-coded percentage change.
   - **SMMA(20) & SMMA(120)**: Real-time smoothed moving averages.
   - **Market Depth**: Live Bid Price, Bid Qty, Ask Price, Ask Qty.
   - **Exchange Traded Quantity (ETQ)**: Total traded volume over last 5m, 20m, and 60m.
   - **Average Price**: Volume-weighted average price over 20m and 60m windows.

---

### Step 3: Viewing AI/ML Signal Analysis & Crossover Rationale
1. Click on any stock row in the dashboard table or open the **AI Signal Panel**.
2. **SMMA Crossover Detection**:
   - **BUY Signal**: Triggered when SMMA(20) crosses above SMMA(120).
   - **SELL Signal**: Triggered when SMMA(20) crosses below SMMA(120).
3. **Quantitative ML Recommendation**:
   - **`ACCEPT`**: Green badge indicating high probability of trade profitability based on LTQ volume surge ($LTQ_{2m} / LTQ_{5m} > 1.8x$).
   - **`AVOID`**: Red badge indicating high probability of signal failure/whipsaw.
4. **AI Confidence Score & Rationale**: View the exact model confidence percentage (e.g., `88.5%`) and a plain-text quantitative breakdown explaining why the trade should be executed or rejected.

---

### Step 4: Running Strategy Backtest Simulations
1. Click **Backtest Engine** in the top navigation bar.
2. Select your desired NSE stock symbols (e.g., `TATAMOTORS`, `INFY`) and enter initial capital (e.g. `₹1,00,000`).
3. Click **Run Backtest**.
4. **Performance Comparison**:
   - **Raw Strategy Win Rate**: Standard SMMA crossover performance without AI filtering.
   - **AI-Filtered Win Rate**: Enhanced win rate achieved by filtering out false crossover signals using the LTQ Machine Learning classifier.
5. **Timeline Chart**: Review cumulative equity curve growth, total PnL ($\text{Sell LTP} - \text{Buy LTP}$), and list of trade execution timestamps.

---

### Step 5: Using Vision AI & Voice Copilot
1. Click **Vision AI Scanner** to upload chart screenshots (PNG/JPEG) for automated technical analysis.
2. Click the floating **AI Assistant** icon (bottom right) to ask market questions in 5 languages (English, Hindi, Telugu, Tamil, Marathi).
3. Experience monospaced dark IDE code snippet blocks with 1-click code copying and live voice speech synthesis.

---

## 📊 SSG Infotech Assignment 1 Compliance Matrix

| Requirement # | Feature Requirement | System Implementation | Verification Status |
| :---: | :--- | :--- | :---: |
| **1** | **Stock Screening** | Filters NSE securities with LTP between **₹30** and **₹500**. | **100% SATISFIED** |
| **2** | **Liquidity Filter** | Filters stocks where **Bid Quantity > 10,00,000** AND **Ask Quantity > 10,00,000**. | **100% SATISFIED** |
| **3** | **Technical Indicators** | Smoothed Moving Averages: **SMMA (20)** & **SMMA (120)**. | **100% SATISFIED** |
| **4** | **ETQ Tracking** | Exchange Traded Quantity over **Last 5m**, **Last 20m**, and **Last 60m**. | **100% SATISFIED** |
| **5** | **Average Price** | Average LTP / VWAP over **Last 20m** and **Last 60m**. | **100% SATISFIED** |
| **6** | **Market Depth** | Real-time **Bid Price**, **Bid Qty**, **Ask Price**, and **Ask Qty**. | **100% SATISFIED** |
| **7** | **Live Dashboard** | Auto-refreshing live tabular UI with 1.5s streaming updates. | **100% SATISFIED** |
| **8** | **AI/ML Model & LTQ Ratio** | Quantitative classifier using $LTQ_{2m} / LTQ_{5m}$ surge ratio, confidence %, & explanation. | **100% SATISFIED** |
| **9** | **Trading & Backtest Logic** | Crossover exit rules, PnL calculation ($\text{Sell LTP} - \text{Buy LTP}$), win rate analysis. | **100% SATISFIED** |
| **10** | **Security & Deliverables** | Safe JWT, SMTP OTP delivery via `pvsaketh1@gmail.com`, OWASP security headers, DoS rate limiting. | **100% SATISFIED** |

---

## 🛠️ Local Development Setup Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/PVSaketh2003/angelone.git
cd angelone/backend

# Create and activate virtual environment
python3 -m venv ../venv
source ../venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations and start development server
python manage.py migrate
python manage.py runserver
```
*Backend runs on `http://127.0.0.1:8000`*

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🧪 Automated Testing & Verification

Run backend unit tests and security penetration suite:
```bash
cd backend
python manage.py test
```

---

## 👤 Candidate & Developer Contact Information

- **Name**: PV Sairam Saketh
- **Email**: pvsairamsaketh@gmail.com
- **Phone**: +91 9359587816
- **Position Applied**: AI/ML Engineer (Quantitative Programming)
- **Assignment**: SSG Infotech Technical Assignment 1

---

## 📄 License & Attribution
Developed by **PV Sairam Saketh** for **SSG Infotech Technical Assignment 1**.  
Distributed under the MIT License.

