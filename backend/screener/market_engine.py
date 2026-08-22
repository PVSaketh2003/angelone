import time
import random
import threading
from typing import List, Dict, Any
import numpy as np
from .indicators import calculate_smma_series, calculate_next_smma, detect_crossover
from .ml_model import ai_classifier

# Pre-defined representative list of NSE Stocks across various sectors with base prices in ₹30 - ₹500
NSE_STOCK_UNIVERSE = [
    {'symbol': 'TATAMOTORS', 'name': 'Tata Motors Ltd.', 'base_price': 480.50},
    {'symbol': 'SBI', 'name': 'State Bank of India', 'base_price': 490.00},
    {'symbol': 'WIPRO', 'name': 'Wipro Limited', 'base_price': 310.20},
    {'symbol': 'BPCL', 'name': 'Bharat Petroleum Corp Ltd', 'base_price': 345.80},
    {'symbol': 'BHEL', 'name': 'Bharat Heavy Electricals Ltd', 'base_price': 225.40},
    {'symbol': 'IOCL', 'name': 'Indian Oil Corporation Ltd', 'base_price': 165.70},
    {'symbol': 'CIL', 'name': 'Coal India Limited', 'base_price': 390.15},
    {'symbol': 'BEL', 'name': 'Bharat Electronics Limited', 'base_price': 285.60},
    {'symbol': 'GAIL', 'name': 'GAIL (India) Limited', 'base_price': 188.30},
    {'symbol': 'ITC', 'name': 'ITC Limited', 'base_price': 440.50},
    {'symbol': 'NTPC', 'name': 'NTPC Limited', 'base_price': 365.20},
    {'symbol': 'POWERGRID', 'name': 'Power Grid Corp of India', 'base_price': 295.40},
    {'symbol': 'SAIL', 'name': 'Steel Authority of India Ltd', 'base_price': 135.80},
    {'symbol': 'NHPC', 'name': 'NHPC Limited', 'base_price': 88.50},
    {'symbol': 'IDFC FIRST Bank', 'name': 'IDFC First Bank Limited', 'base_price': 72.40},
    {'symbol': 'PNB', 'name': 'Punjab National Bank', 'base_price': 105.60},
    {'symbol': 'UNION BANK', 'name': 'Union Bank of India', 'base_price': 118.20},
    {'symbol': 'IRFC', 'name': 'Indian Railway Finance Corp', 'base_price': 142.90},
    {'symbol': 'YESBANK', 'name': 'Yes Bank Limited', 'base_price': 34.50},
    {'symbol': 'SUZLON', 'name': 'Suzlon Energy Limited', 'base_price': 58.20},
]

class StockMarketEngine:
    """
    Core Market Data Engine maintaining real-time stock ticks, SMMA indicators,
    ETQ aggregations, Market Depth, and Signal detection.
    """
    def __init__(self):
        self.stocks: Dict[str, Dict[str, Any]] = {}
        self.signals_log: List[Dict[str, Any]] = []
        self.is_running = False
        self.min_ltp = 30.0
        self.max_ltp = 500.0
        self.min_bid_qty = 1000000 # 10 Lakhs (1 Million)
        self.min_ask_qty = 1000000 # 10 Lakhs (1 Million)
        self._lock = threading.Lock()
        self._init_stock_data()
        self._start_ticker_thread()

    def _init_stock_data(self):
        """Initialize historical price buffers and initial metrics for each stock."""
        for item in NSE_STOCK_UNIVERSE:
            symbol = item['symbol']
            base_price = item['base_price']

            # Generate 200 synthetic historical price ticks to initialize SMMA(20) and SMMA(120)
            np.random.seed(hash(symbol) % 10000)
            returns = np.random.normal(loc=0.0001, scale=0.003, size=200)
            price_history = [base_price]
            for r in returns:
                price_history.append(round(price_history[-1] * (1.0 + r), 2))

            prices_arr = np.array(price_history)
            smma20_series = calculate_smma_series(prices_arr, 20)
            smma120_series = calculate_smma_series(prices_arr, 120)

            # Generate 60-minute tick execution history for ETQ and VWAP calculations
            now_ts = int(time.time())
            ticks_history = []
            for i in range(120): # 120 ticks over last 60 mins (one tick per 30s)
                tick_time = now_ts - (120 - i) * 30
                tick_ltp = round(price_history[i + 80], 2)
                tick_ltq = random.randint(500, 15000)
                ticks_history.append({
                    'timestamp': tick_time,
                    'ltp': tick_ltp,
                    'ltq': tick_ltq,
                })

            curr_ltp = price_history[-1]
            curr_smma20 = smma20_series[-1]
            curr_smma120 = smma120_series[-1]

            # Initial market depth (bid/ask prices & quantities)
            bid_price = round(curr_ltp - 0.05, 2)
            ask_price = round(curr_ltp + 0.05, 2)
            bid_qty = random.randint(1050000, 3500000) # > 10L for screening eligibility
            ask_qty = random.randint(1050000, 3500000) # > 10L for screening eligibility

            # Some stocks have slightly lower depth to test liquidity filter filtering
            if symbol in ['YESBANK', 'SUZLON']:
                bid_qty = random.randint(400000, 950000)

            self.stocks[symbol] = {
                'symbol': symbol,
                'name': item['name'],
                'ltp': curr_ltp,
                'prev_ltp': price_history[-2],
                'change_pct': round(((curr_ltp - price_history[0]) / price_history[0]) * 100.0, 2),
                'bid_price': bid_price,
                'bid_qty': bid_qty,
                'ask_price': ask_price,
                'ask_qty': ask_qty,
                'depth_levels': self._generate_5level_depth(bid_price, ask_price, bid_qty, ask_qty),
                'smma20': round(curr_smma20, 2),
                'smma120': round(curr_smma120, 2),
                'smma20_prev': round(smma20_series[-2], 2),
                'smma120_prev': round(smma120_series[-2], 2),
                'price_history': price_history,
                'smma20_history': smma20_series.tolist(),
                'smma120_history': smma120_series.tolist(),
                'ticks_history': ticks_history,
                'last_updated': now_ts,
            }

    def _generate_5level_depth(self, best_bid_p: float, best_ask_p: float, total_bid_q: int, total_ask_q: int):
        """Generates realistic 5-level market depth order book."""
        bids = []
        asks = []
        b_q_rem = total_bid_q
        a_q_rem = total_ask_q

        for i in range(5):
            bp = round(best_bid_p - i * 0.05, 2)
            ap = round(best_ask_p + i * 0.05, 2)
            bq = int(total_bid_q * random.uniform(0.12, 0.28)) if i < 4 else b_q_rem
            aq = int(total_ask_q * random.uniform(0.12, 0.28)) if i < 4 else a_q_rem
            b_q_rem = max(0, b_q_rem - bq)
            a_q_rem = max(0, a_q_rem - aq)
            bids.append({'price': bp, 'quantity': bq, 'orders': random.randint(10, 150)})
            asks.append({'price': ap, 'quantity': aq, 'orders': random.randint(10, 150)})

        return {'bids': bids, 'asks': asks}

    def _start_ticker_thread(self):
        """Starts background worker thread to continuously update live tick prices."""
        self.is_running = True
        t = threading.Thread(target=self._run_live_ticker, daemon=True)
        t.start()

    def _run_live_ticker(self):
        """Simulates live tick updates, recalculating SMMA, ETQ, VWAPs, and checking crossovers."""
        while self.is_running:
            time.sleep(1.5) # Update every 1.5s
            with self._lock:
                now_ts = int(time.time())
                for symbol, data in self.stocks.items():
                    # Generate small tick delta (-0.3% to +0.3%)
                    delta = random.choice([-0.10, -0.05, 0.0, 0.05, 0.10, 0.15])
                    # Occasional volatility spike to trigger SMMA crossover
                    if random.random() < 0.08:
                        delta = random.choice([-0.45, -0.30, 0.35, 0.50])

                    old_ltp = data['ltp']
                    new_ltp = round(max(5.0, old_ltp + delta), 2)
                    data['prev_ltp'] = old_ltp
                    data['ltp'] = new_ltp

                    # Last Traded Quantity (LTQ) for this tick
                    ltq = random.randint(1200, 28000)
                    if abs(delta) >= 0.30:
                        ltq = random.randint(35000, 95000) # Surge in LTQ

                    # Append to tick history
                    data['ticks_history'].append({
                        'timestamp': now_ts,
                        'ltp': new_ltp,
                        'ltq': ltq,
                    })
                    # Keep max 500 ticks (~250 mins)
                    if len(data['ticks_history']) > 500:
                        data['ticks_history'].pop(0)

                    # Update SMMA indicators
                    old_smma20 = data['smma20']
                    old_smma120 = data['smma120']
                    new_smma20 = round(calculate_next_smma(old_smma20, new_ltp, 20), 2)
                    new_smma120 = round(calculate_next_smma(old_smma120, new_ltp, 120), 2)

                    data['smma20_prev'] = old_smma20
                    data['smma120_prev'] = old_smma120
                    data['smma20'] = new_smma20
                    data['smma120'] = new_smma120
                    data['price_history'].append(new_ltp)
                    data['smma20_history'].append(new_smma20)
                    data['smma120_history'].append(new_smma120)

                    # Update Bid / Ask market depth
                    data['bid_price'] = round(new_ltp - 0.05, 2)
                    data['ask_price'] = round(new_ltp + 0.05, 2)
                    data['bid_qty'] = int(max(200000, data['bid_qty'] + random.randint(-50000, 55000)))
                    data['ask_qty'] = int(max(200000, data['ask_qty'] + random.randint(-50000, 55000)))
                    data['depth_levels'] = self._generate_5level_depth(
                        data['bid_price'], data['ask_price'], data['bid_qty'], data['ask_qty']
                    )
                    data['last_updated'] = now_ts

                    # Check for SMMA Crossover event
                    crossover = detect_crossover(old_smma20, old_smma120, new_smma20, new_smma120)
                    if crossover in ['BUY', 'SELL']:
                        self._process_crossover_signal(symbol, data, crossover)

    def _process_crossover_signal(self, symbol: str, data: dict, signal_type: str):
        """Processes an SMMA crossover signal and passes it to the AI/ML model for validation."""
        metrics = self.calculate_stock_metrics(data)
        metrics['signal_type'] = signal_type

        # Pass data to quantitative AI/ML classifier model
        ai_prediction = ai_classifier.predict_signal(metrics)

        signal_entry = {
            'id': len(self.signals_log) + 1,
            'symbol': symbol,
            'signal_type': signal_type,
            'timestamp': int(time.time()),
            'ltp': data['ltp'],
            'smma20': data['smma20'],
            'smma120': data['smma120'],
            'ltq_surge_ratio': ai_prediction['features']['ltq_surge_ratio'],
            'bid_ask_ratio': ai_prediction['features']['bid_ask_ratio'],
            'recommendation': ai_prediction['recommendation'],
            'confidence': ai_prediction['confidence'],
            'explanation': ai_prediction['explanation'],
            'features': ai_prediction['features'],
        }
        self.signals_log.insert(0, signal_entry)
        if len(self.signals_log) > 50:
            self.signals_log.pop()

    def calculate_stock_metrics(self, data: dict) -> dict:
        """
        Computes ETQ totals (5m, 20m, 60m) and Average Price (VWAP 20m, 60m)
        from historical ticks buffer safely.
        """
        now_ts = data.get('last_updated', int(time.time()))
        # Thread-safe copy of ticks history buffer
        ticks = list(data.get('ticks_history', []))

        # ETQ: total quantity executed at exchange during 5m, 20m, 60m
        etq_5m = sum(t['ltq'] for t in ticks if now_ts - t.get('timestamp', 0) <= 300)
        etq_20m = sum(t['ltq'] for t in ticks if now_ts - t.get('timestamp', 0) <= 1200)
        etq_60m = sum(t['ltq'] for t in ticks if now_ts - t.get('timestamp', 0) <= 3600)

        # Average Price (LTP) over 20m and 60m
        ticks_20m = [t['ltp'] for t in ticks if now_ts - t.get('timestamp', 0) <= 1200]
        ticks_60m = [t['ltp'] for t in ticks if now_ts - t.get('timestamp', 0) <= 3600]

        avg_price_20m = round(float(np.mean(ticks_20m)), 2) if ticks_20m else data.get('ltp', 100.0)
        avg_price_60m = round(float(np.mean(ticks_60m)), 2) if ticks_60m else data.get('ltp', 100.0)

        # LTQ 2m vs 5m average computation
        ltqs_2m = [t['ltq'] for t in ticks if now_ts - t.get('timestamp', 0) <= 120]
        ltqs_5m = [t['ltq'] for t in ticks if now_ts - t.get('timestamp', 0) <= 300]
        avg_ltq_2m = float(np.mean(ltqs_2m)) if ltqs_2m else 5000.0
        avg_ltq_5m = float(np.mean(ltqs_5m)) if ltqs_5m else 5000.0

        # SMMA Status
        smma20 = data.get('smma20', 100.0)
        smma120 = data.get('smma120', 100.0)
        smma_status = 'BULLISH' if smma20 > smma120 else 'BEARISH'

        price_hist = data.get('price_history', [100.0])
        base_price = price_hist[0] if price_hist and price_hist[0] > 0 else 100.0
        curr_ltp = data.get('ltp', 100.0)
        change_pct = round(((curr_ltp - base_price) / base_price) * 100.0, 2)

        return {
            'symbol': data['symbol'],
            'name': data.get('name', data['symbol']),
            'ltp': curr_ltp,
            'prev_ltp': data.get('prev_ltp', curr_ltp),
            'change_pct': change_pct,
            'bid_price': data.get('bid_price', curr_ltp - 0.05),
            'bid_qty': data.get('bid_qty', 1000000),
            'ask_price': data.get('ask_price', curr_ltp + 0.05),
            'ask_qty': data.get('ask_qty', 1000000),
            'smma20': smma20,
            'smma120': smma120,
            'smma_status': smma_status,
            'etq_5m': etq_5m,
            'etq_20m': etq_20m,
            'etq_60m': etq_60m,
            'avg_price_20m': avg_price_20m,
            'avg_price_60m': avg_price_60m,
            'avg_ltq_2m': round(avg_ltq_2m, 2),
            'avg_ltq_5m': round(avg_ltq_5m, 2),
            'depth_levels': data.get('depth_levels', {'bids': [], 'asks': []}),
        }


    def get_screened_stocks(self, min_ltp: float = 30.0, max_ltp: float = 500.0, min_bid: int = 1000000, min_ask: int = 1000000) -> List[Dict[str, Any]]:
        """
        Applies Stock Screening & Liquidity Filters:
          1. LTP between min_ltp (₹30) and max_ltp (₹500).
          2. Bid Quantity > min_bid (10,00,000) AND Ask Quantity > min_ask (10,00,000).
        """
        screened = []
        with self._lock:
            for symbol, data in self.stocks.items():
                metrics = self.calculate_stock_metrics(data)
                
                # Check LTP range
                if not (min_ltp <= metrics['ltp'] <= max_ltp):
                    continue
                
                # Check Liquidity Filter (Bid Qty > 10L and Ask Qty > 10L)
                if metrics['bid_qty'] < min_bid or metrics['ask_qty'] < min_ask:
                    continue

                # Run AI signal evaluation for real-time dashboard status
                ai_pred = ai_classifier.predict_signal(metrics)
                metrics['ai_recommendation'] = ai_pred['recommendation']
                metrics['ai_confidence'] = ai_pred['confidence']
                metrics['ai_explanation'] = ai_pred['explanation']

                screened.append(metrics)

        # Sort screened stocks by ETQ 5m descending
        screened.sort(key=lambda x: x['etq_5m'], reverse=True)
        return screened

    def get_all_stocks_raw(self) -> List[Dict[str, Any]]:
        """Returns all universe stocks with screening pass/fail status flags."""
        result = []
        with self._lock:
            for symbol, data in self.stocks.items():
                metrics = self.calculate_stock_metrics(data)
                passes_ltp = (self.min_ltp <= metrics['ltp'] <= self.max_ltp)
                passes_liquidity = (metrics['bid_qty'] >= self.min_bid_qty and metrics['ask_qty'] >= self.min_ask_qty)
                metrics['passes_screener'] = passes_ltp and passes_liquidity
                metrics['passes_ltp'] = passes_ltp
                metrics['passes_liquidity'] = passes_liquidity
                
                ai_pred = ai_classifier.predict_signal(metrics)
                metrics['ai_recommendation'] = ai_pred['recommendation']
                metrics['ai_confidence'] = ai_pred['confidence']

                result.append(metrics)
        return result

# Global Singleton Market Engine
market_engine = StockMarketEngine()
