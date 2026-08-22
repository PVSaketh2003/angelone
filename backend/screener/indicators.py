import numpy as np
import pandas as pd

def calculate_smma_series(prices: np.ndarray, period: int) -> np.ndarray:
    """
    Calculate Smoothed Moving Average (SMMA / Wilder's Moving Average) for a series of prices.
    
    Formula:
      - First value SMMA[N-1] = SMA(N)
      - Subsequent values: SMMA[t] = (SMMA[t-1] * (N - 1) + price[t]) / N
    """
    n = len(prices)
    smma = np.full(n, np.nan, dtype=np.float64)
    
    if n < period:
        return smma

    # First SMMA value is the simple average of the first 'period' elements
    first_sma = np.mean(prices[:period])
    smma[period - 1] = first_sma

    for i in range(period, n):
        smma[i] = (smma[i - 1] * (period - 1) + prices[i]) / period

    return smma

def calculate_next_smma(prev_smma: float, current_price: float, period: int) -> float:
    """
    Update SMMA incrementally for live real-time price tick stream.
    """
    if prev_smma is None or np.isnan(prev_smma):
        return current_price
    return (prev_smma * (period - 1) + current_price) / period

def detect_crossover(smma20_prev: float, smma120_prev: float, smma20_curr: float, smma120_curr: float) -> str:
    """
    Detect SMMA crossover signal:
      - 'BUY': SMMA(20) crosses above SMMA(120)
      - 'SELL': SMMA(20) crosses below SMMA(120)
      - 'NONE': No crossover
    """
    if smma20_prev is None or smma120_prev is None or smma20_curr is None or smma120_curr is None:
        return 'NONE'
    
    if smma20_prev <= smma120_prev and smma20_curr > smma120_curr:
        return 'BUY'
    elif smma20_prev >= smma120_prev and smma20_curr < smma120_curr:
        return 'SELL'
    
    return 'NONE'
