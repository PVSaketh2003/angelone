import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Layers, Activity, Cpu, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function StockDetailModal({ symbol, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;

    const fetchDetail = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/stocks/${symbol}/`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error fetching stock details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    const interval = setInterval(fetchDetail, 2000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (!symbol) return null;

  const formatIndian = (num) => {
    if (!num) return '0';
    if (num >= 10000000) return (num / 10000000).toFixed(2) + ' Cr';
    if (num >= 100000) return (num / 100000).toFixed(2) + ' L';
    return num.toLocaleString('en-IN');
  };

  const chartData = data?.price_history ? data.price_history.map((p, idx) => ({
    tick: idx + 1,
    LTP: p,
    SMMA20: data.smma20_history[idx] || p,
    SMMA120: data.smma120_history[idx] || p,
  })) : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 relative border border-slate-200 dark:border-slate-800 shadow-2xl transition-colors">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {loading || !data ? (
          <div className="py-20 text-center text-slate-500 dark:text-slate-400 font-medium">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600 dark:text-emerald-500" />
            Loading real-time depth & SMMA analysis for {symbol}...
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header Info */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{data.symbol}</h2>
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold">{data.metrics.name}</span>
                  <span className={`badge-groww-${data.metrics.smma_status === 'BULLISH' ? 'green' : 'red'}`}>
                    {data.metrics.smma_status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">₹{data.metrics.ltp}</span>
                  <span className={`text-sm font-bold flex items-center gap-0.5 ${
                    data.metrics.change_pct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {data.metrics.change_pct >= 0 ? '+' : ''}{data.metrics.change_pct}%
                  </span>
                </div>
              </div>

              {/* AI Card */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/50 text-xs">
                <div className="text-slate-500 dark:text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                  AI Quantitative Signal Status
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge-groww-${data.ai_prediction.recommendation === 'ACCEPT' ? 'green' : 'red'}`}>
                    {data.ai_prediction.recommendation} ({data.ai_prediction.confidence}%)
                  </span>
                  <span className="text-slate-600 dark:text-slate-300 font-mono font-medium">
                    LTQ Surge: {data.ai_prediction.features.ltq_surge_ratio}x
                  </span>
                </div>
              </div>
            </div>

            {/* Technical Chart */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center justify-between">
                <span>Real-Time Price & SMMA (20 / 120) Technical Chart</span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">Green: SMMA(20) | Blue: SMMA(120)</span>
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="tick" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="LTP" stroke="#0f172a" strokeWidth={2.5} dot={false} name="LTP Price (₹)" />
                    <Line type="monotone" dataKey="SMMA20" stroke="#00d09c" strokeWidth={2} dot={false} name="SMMA (20)" />
                    <Line type="monotone" dataKey="SMMA120" stroke="#5367ff" strokeWidth={2} dot={false} name="SMMA (120)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 5-Level Market Depth & ETQ/VWAP Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 5-Level Depth */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                    5-Level Order Book Market Depth
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium">
                    Bid: {formatIndian(data.metrics.bid_qty)} | Ask: {formatIndian(data.metrics.ask_qty)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  {/* Bids */}
                  <div>
                    <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 pb-1 border-b border-emerald-200 dark:border-emerald-500/20 mb-2 flex justify-between">
                      <span>BID PRICE</span>
                      <span>QTY</span>
                    </div>
                    <div className="space-y-1.5">
                      {data.depth_levels.bids.map((b, i) => (
                        <div key={i} className="flex justify-between items-center bg-emerald-100/60 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                          <span className="text-emerald-900 dark:text-emerald-300 font-bold">₹{b.price}</span>
                          <span className="text-slate-700 dark:text-slate-400 font-medium">{formatIndian(b.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Asks */}
                  <div>
                    <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 pb-1 border-b border-rose-200 dark:border-rose-500/20 mb-2 flex justify-between">
                      <span>ASK PRICE</span>
                      <span>QTY</span>
                    </div>
                    <div className="space-y-1.5">
                      {data.depth_levels.asks.map((a, i) => (
                        <div key={i} className="flex justify-between items-center bg-rose-100/60 dark:bg-rose-500/10 px-2.5 py-1 rounded-lg">
                          <span className="text-rose-900 dark:text-rose-300 font-bold">₹{a.price}</span>
                          <span className="text-slate-700 dark:text-slate-400 font-medium">{formatIndian(a.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ETQ & VWAP Metrics */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-500" />
                  Exchange Traded Quantity (ETQ) & VWAP Stats
                </h4>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">ETQ 5 MIN</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">{formatIndian(data.metrics.etq_5m)}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">ETQ 20 MIN</div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono mt-1">{formatIndian(data.metrics.etq_20m)}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">ETQ 60 MIN</div>
                    <div className="text-sm font-bold text-slate-500 dark:text-slate-400 font-mono mt-1">{formatIndian(data.metrics.etq_60m)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">AVG PRICE (20 MIN)</div>
                    <div className="text-base font-bold text-emerald-600 dark:text-emerald-500 font-mono mt-1">₹{data.metrics.avg_price_20m}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">AVG PRICE (60 MIN)</div>
                    <div className="text-base font-bold text-blue-600 dark:text-blue-500 font-mono mt-1">₹{data.metrics.avg_price_60m}</div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <span className="font-bold text-slate-900 dark:text-slate-100">AI Reason: </span>
                  {data.ai_prediction.explanation}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
