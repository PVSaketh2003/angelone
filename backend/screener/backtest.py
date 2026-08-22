import numpy as np
import random
import time
from typing import Dict, Any, List
from .indicators import calculate_smma_series, detect_crossover
from .ml_model import ai_classifier

def run_strategy_backtest(symbols: List[str] = None, initial_capital: float = 100000.0) -> Dict[str, Any]:
    """
    Simulates historical trading on SMMA Crossovers across stocks and compares:
      1. Raw SMMA Crossover Strategy
      2. AI/ML-Filtered SMMA Crossover Strategy (using LTQ & Market Depth AI Model)
    """
    if not symbols:
        symbols = ['TATAMOTORS', 'SBIN', 'WIPRO', 'BPCL', 'BHEL', 'IOC', 'COALINDIA', 'BEL', 'ITC', 'NTPC']

    raw_trades = []
    ai_trades = []

    np.random.seed(123)

    for symbol in symbols:
        # Simulate 500 price ticks (~ 5 days of trading data) per stock
        base_price = random.uniform(50.0, 450.0)
        returns = np.random.normal(loc=0.0002, scale=0.004, size=500)
        prices = [base_price]
        for r in returns:
            prices.append(round(prices[-1] * (1.0 + r), 2))
        prices_arr = np.array(prices)

        smma20 = calculate_smma_series(prices_arr, 20)
        smma120 = calculate_smma_series(prices_arr, 120)

        # Track active trade positions
        raw_position = None # {'type': 'BUY', 'entry_price': p, 'entry_idx': i}
        ai_position = None

        for i in range(121, len(prices_arr)):
            crossover = detect_crossover(smma20[i-1], smma120[i-1], smma20[i], smma120[i])
            price = prices_arr[i]

            # ---------------- Raw Strategy ----------------
            if crossover == 'BUY':
                if raw_position and raw_position['type'] == 'SELL':
                    # Exit Sell Trade
                    pnl = raw_position['entry_price'] - price
                    raw_trades.append({
                        'symbol': symbol,
                        'type': 'SELL',
                        'entry_price': raw_position['entry_price'],
                        'exit_price': price,
                        'pnl': round(pnl, 2),
                        'pnl_pct': round((pnl / raw_position['entry_price']) * 100.0, 2),
                        'is_win': pnl > 0,
                    })
                    raw_position = None
                
                if not raw_position:
                    raw_position = {'type': 'BUY', 'entry_price': price, 'entry_idx': i}

            elif crossover == 'SELL':
                if raw_position and raw_position['type'] == 'BUY':
                    # Exit Buy Trade
                    pnl = price - raw_position['entry_price']
                    raw_trades.append({
                        'symbol': symbol,
                        'type': 'BUY',
                        'entry_price': raw_position['entry_price'],
                        'exit_price': price,
                        'pnl': round(pnl, 2),
                        'pnl_pct': round((pnl / raw_position['entry_price']) * 100.0, 2),
                        'is_win': pnl > 0,
                    })
                    raw_position = None
                
                if not raw_position:
                    raw_position = {'type': 'SELL', 'entry_price': price, 'entry_idx': i}

            # ---------------- AI-Filtered Strategy ----------------
            if crossover in ['BUY', 'SELL']:
                # Mock real-time market data state at crossover point
                ltq_surge = float(np.random.choice([0.6, 0.8, 1.4, 1.9, 2.6], p=[0.2, 0.2, 0.25, 0.2, 0.15]))
                bid_ask = float(np.random.choice([0.5, 0.7, 1.2, 1.6, 2.2], p=[0.2, 0.2, 0.25, 0.2, 0.15]))
                
                mkt_state = {
                    'avg_ltq_2m': 10000.0 * ltq_surge,
                    'avg_ltq_5m': 10000.0,
                    'bid_qty': 1500000 * bid_ask,
                    'ask_qty': 1500000,
                    'etq_5m': 60000,
                    'etq_20m': 200000,
                    'smma20': smma20[i],
                    'smma120': smma120[i],
                    'smma20_slope': (smma20[i] - smma20[i-5]) / 5.0,
                    'ltp': price,
                    'avg_price_20m': price,
                    'signal_type': crossover
                }
                ai_result = ai_classifier.predict_signal(mkt_state)

                if crossover == 'BUY':
                    if ai_position and ai_position['type'] == 'SELL':
                        pnl = ai_position['entry_price'] - price
                        ai_trades.append({
                            'symbol': symbol,
                            'type': 'SELL',
                            'entry_price': ai_position['entry_price'],
                            'exit_price': price,
                            'pnl': round(pnl, 2),
                            'pnl_pct': round((pnl / ai_position['entry_price']) * 100.0, 2),
                            'is_win': pnl > 0,
                            'ai_recommendation': ai_position['rec'],
                            'confidence': ai_position['conf'],
                        })
                        ai_position = None

                    if not ai_position and ai_result['recommendation'] == 'ACCEPT':
                        ai_position = {'type': 'BUY', 'entry_price': price, 'entry_idx': i, 'rec': ai_result['recommendation'], 'conf': ai_result['confidence']}

                elif crossover == 'SELL':
                    if ai_position and ai_position['type'] == 'BUY':
                        pnl = price - ai_position['entry_price']
                        ai_trades.append({
                            'symbol': symbol,
                            'type': 'BUY',
                            'entry_price': ai_position['entry_price'],
                            'exit_price': price,
                            'pnl': round(pnl, 2),
                            'pnl_pct': round((pnl / ai_position['entry_price']) * 100.0, 2),
                            'is_win': pnl > 0,
                            'ai_recommendation': ai_position['rec'],
                            'confidence': ai_position['conf'],
                        })
                        ai_position = None

                    if not ai_position and ai_result['recommendation'] == 'ACCEPT':
                        ai_position = {'type': 'SELL', 'entry_price': price, 'entry_idx': i, 'rec': ai_result['recommendation'], 'conf': ai_result['confidence']}

    def calc_stats(trades_list):
        if not trades_list:
            return {'total_trades': 0, 'wins': 0, 'losses': 0, 'win_rate': 0.0, 'net_pnl': 0.0, 'avg_pnl': 0.0, 'profit_factor': 0.0}
        total = len(trades_list)
        wins = sum(1 for t in trades_list if t['is_win'])
        losses = total - wins
        win_rate = round((wins / total) * 100.0, 2)
        gross_profit = sum(t['pnl'] for t in trades_list if t['pnl'] > 0)
        gross_loss = abs(sum(t['pnl'] for t in trades_list if t['pnl'] < 0))
        net_pnl = round(gross_profit - gross_loss, 2)
        avg_pnl = round(net_pnl / total, 2)
        profit_factor = round(gross_profit / (gross_loss + 1e-5), 2)
        return {
            'total_trades': total,
            'wins': wins,
            'losses': losses,
            'win_rate': win_rate,
            'net_pnl': net_pnl,
            'avg_pnl': avg_pnl,
            'profit_factor': profit_factor,
        }

    raw_stats = calc_stats(raw_trades)
    ai_stats = calc_stats(ai_trades)

    # Generate timeline equity curve comparison data points
    timeline = []
    raw_equity = initial_capital
    ai_equity = initial_capital
    
    steps = max(len(raw_trades), len(ai_trades), 20)
    for step in range(steps):
        r_pnl = raw_trades[step]['pnl'] * 100 if step < len(raw_trades) else 0.0
        a_pnl = ai_trades[step]['pnl'] * 100 if step < len(ai_trades) else 0.0
        raw_equity = round(raw_equity + r_pnl, 2)
        ai_equity = round(ai_equity + a_pnl, 2)
        timeline.append({
            'trade_index': step + 1,
            'raw_equity': raw_equity,
            'ai_equity': ai_equity,
        })

    avoided_losing_trades = max(0, raw_stats['losses'] - ai_stats['losses'])

    return {
        'symbols_tested': symbols,
        'initial_capital': initial_capital,
        'raw_strategy': raw_stats,
        'ai_strategy': ai_stats,
        'avoided_losing_trades': avoided_losing_trades,
        'win_rate_boost_pct': round(ai_stats['win_rate'] - raw_stats['win_rate'], 2),
        'timeline': timeline,
        'recent_raw_trades': raw_trades[:10],
        'recent_ai_trades': ai_trades[:10],
    }
