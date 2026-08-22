import React, { useState, useEffect } from 'react';
import { BarChart2, ArrowUpRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function BacktestView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const runBacktest = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/backtest/');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Backtest fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBacktest();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="groww-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Quantitative Strategy Backtest Report</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 max-w-xl">
            Simulates SMMA Crossover performance across screened NSE stocks and demonstrates how LTQ-based AI filtering eliminates losing trades and optimizes win rate.
          </p>
        </div>

        <button
          onClick={runBacktest}
          disabled={loading}
          className="btn-groww text-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-Run Backtest</span>
        </button>
      </div>

      {loading || !data ? (
        <div className="groww-card py-20 text-center text-slate-500 dark:text-slate-400 font-medium">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600 dark:text-emerald-500" />
          Running quantitative backtest simulation over historical SMMA ticks...
        </div>
      ) : (
        <>
          {/* Key Metric Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Win Rate Boost */}
            <div className="groww-card p-5 border-l-4 border-l-emerald-500 dark:border-l-emerald-400">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">WIN RATE WITH AI FILTER</div>
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-2">
                {data.ai_strategy.win_rate}%
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-500 mt-1 font-bold flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                +{data.win_rate_boost_pct}% vs Raw SMMA ({data.raw_strategy.win_rate}%)
              </div>
            </div>

            {/* Avoided Losing Trades */}
            <div className="groww-card p-5 border-l-4 border-l-blue-500 dark:border-l-blue-400">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">AVOIDED LOSING TRADES</div>
              <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-2">
                {data.avoided_losing_trades}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Losing trades filtered by LTQ AI model
              </div>
            </div>

            {/* AI Net Profit */}
            <div className="groww-card p-5 border-l-4 border-l-indigo-500 dark:border-l-indigo-400">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">AI STRATEGY NET PnL</div>
              <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono mt-2">
                ₹{data.ai_strategy.net_pnl.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Raw Strategy PnL: ₹{data.raw_strategy.net_pnl.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Profit Factor */}
            <div className="groww-card p-5 border-l-4 border-l-purple-500 dark:border-l-purple-400">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">PROFIT FACTOR</div>
              <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-2">
                {data.ai_strategy.profit_factor}x
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Gross Profits / Gross Losses
              </div>
            </div>

          </div>

          {/* Equity Curve Chart */}
          <div className="groww-card p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-between">
              <span>Cumulative Equity Growth Comparison (₹1,00,000 Capital)</span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Green: AI-Filtered Strategy | Red: Raw Strategy</span>
            </h3>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="trade_index" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="ai_equity" stroke="#00d09c" strokeWidth={3} name="AI-Filtered Strategy (₹)" />
                  <Line type="monotone" dataKey="raw_equity" stroke="#eb5b56" strokeWidth={1.5} strokeDasharray="4 4" name="Raw SMMA Strategy (₹)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trade Executions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm overflow-hidden">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-6">AI-Filtered Executed Trades Sample Log</h3>
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th className="w-1/6">Symbol</th>
                    <th>Trade Type</th>
                    <th className="text-right">Entry Price</th>
                    <th className="text-right">Exit Price</th>
                    <th className="text-right">Profit / Loss (₹)</th>
                    <th className="text-right">P&L %</th>
                    <th className="text-right">AI Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_ai_trades.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40">
                      <td className="font-bold text-slate-900 dark:text-slate-100">{t.symbol}</td>
                      <td>
                        <span className={`text-[10px] px-2.5 py-1 rounded-xl font-bold uppercase tracking-wider ${
                          t.type === 'BUY' 
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' 
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="font-mono text-right font-semibold text-slate-700 dark:text-slate-300">₹{t.entry_price.toFixed(2)}</td>
                      <td className="font-mono text-right font-semibold text-slate-700 dark:text-slate-300">₹{t.exit_price.toFixed(2)}</td>
                      <td className={`font-mono text-right font-bold ${t.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {t.pnl >= 0 ? '+' : ''}₹{t.pnl.toFixed(2)}
                      </td>
                      <td className={`font-mono text-right font-bold ${t.pnl_pct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {t.pnl_pct >= 0 ? '+' : ''}{t.pnl_pct}%
                      </td>
                      <td className="text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                          <span className="w-1 h-1 rounded-full bg-indigo-500 glow-indigo" />
                          ACCEPTED ({t.confidence}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
