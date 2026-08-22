import numpy as np
from django.test import TestCase
from screener.indicators import calculate_smma_series, calculate_next_smma, detect_crossover
from screener.ml_model import ai_classifier
from screener.market_engine import StockMarketEngine
from screener.backtest import run_strategy_backtest

class SMMAIndicatorTestCase(TestCase):
    def test_smma_series_calculation(self):
        prices = np.array([10.0, 12.0, 11.0, 13.0, 15.0, 14.0, 16.0, 18.0, 17.0, 19.0])
        smma5 = calculate_smma_series(prices, 5)
        # First 4 values should be NaN
        self.assertTrue(np.isnan(smma5[0]))
        self.assertTrue(np.isnan(smma5[3]))
        # 5th value is SMA(5) = (10+12+11+13+15)/5 = 12.2
        self.assertAlmostEqual(smma5[4], 12.2, places=2)
        # 6th value: (12.2 * 4 + 14.0)/5 = 12.56
        self.assertAlmostEqual(smma5[5], 12.56, places=2)

    def test_calculate_next_smma(self):
        prev = 100.0
        new_price = 110.0
        next_smma20 = calculate_next_smma(prev, new_price, 20)
        expected = (100.0 * 19 + 110.0) / 20.0 # 100.5
        self.assertEqual(next_smma20, expected)

    def test_detect_crossover(self):
        # Bullish Buy Crossover: SMMA20 crosses above SMMA120
        crossover_buy = detect_crossover(smma20_prev=99.0, smma120_prev=100.0, smma20_curr=101.0, smma120_curr=100.2)
        self.assertEqual(crossover_buy, 'BUY')

        # Bearish Sell Crossover: SMMA20 crosses below SMMA120
        crossover_sell = detect_crossover(smma20_prev=101.0, smma120_prev=100.0, smma20_curr=99.0, smma120_curr=99.5)
        self.assertEqual(crossover_sell, 'SELL')

        # No crossover
        no_crossover = detect_crossover(smma20_prev=105.0, smma120_prev=100.0, smma20_curr=106.0, smma120_curr=101.0)
        self.assertEqual(no_crossover, 'NONE')

class AIMLModelTestCase(TestCase):
    def test_ai_classifier_prediction(self):
        market_data = {
            'avg_ltq_2m': 25000.0,
            'avg_ltq_5m': 10000.0, # LTQ ratio 2.5x
            'bid_qty': 2000000,
            'ask_qty': 1000000, # Bid/Ask ratio 2.0x
            'etq_5m': 100000,
            'etq_20m': 250000,
            'smma20': 150.0,
            'smma120': 140.0,
            'smma20_slope': 0.15,
            'ltp': 152.0,
            'avg_price_20m': 148.0,
            'signal_type': 'BUY'
        }
        res = ai_classifier.predict_signal(market_data)
        self.assertIn('recommendation', res)
        self.assertIn(res['recommendation'], ['ACCEPT', 'AVOID'])
        self.assertIn('confidence', res)
        self.assertIn('explanation', res)
        self.assertGreater(len(res['explanation']), 20)

class StockEngineTestCase(TestCase):
    def test_screener_filtering(self):
        engine = StockMarketEngine()
        screened = engine.get_screened_stocks(min_ltp=30.0, max_ltp=500.0, min_bid=1000000, min_ask=1000000)
        self.assertIsInstance(screened, list)
        for s in screened:
            self.assertTrue(30.0 <= s['ltp'] <= 500.0)
            self.assertGreaterEqual(s['bid_qty'], 1000000)
            self.assertGreaterEqual(s['ask_qty'], 1000000)
            self.assertIn('smma20', s)
            self.assertIn('smma120', s)
            self.assertIn('etq_5m', s)
            self.assertIn('etq_20m', s)
            self.assertIn('etq_60m', s)

class BacktestTestCase(TestCase):
    def test_run_strategy_backtest(self):
        res = run_strategy_backtest(symbols=['TATAMOTORS', 'SBIN'], initial_capital=100000.0)
        self.assertIn('raw_strategy', res)
        self.assertIn('ai_strategy', res)
        self.assertIn('win_rate', res['raw_strategy'])
        self.assertIn('win_rate', res['ai_strategy'])
        self.assertIn('timeline', res)
        self.assertGreater(len(res['timeline']), 0)
