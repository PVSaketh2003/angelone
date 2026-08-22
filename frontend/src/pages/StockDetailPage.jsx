import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Cpu, Layers, Activity, CheckCircle2, ShieldAlert, TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { apiClient } from '../services/api';
import { safeFixed, safeNumber, safeArray, formatIndianNumber, safePercent } from '../utils/safeFormats';

export default function StockDetailPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) return;

    const fetchDetail = async () => {
      try {
        const json = await apiClient(`/api/stocks/${symbol.toUpperCase()}/`);
        setData(json);
        setError(null);
      } catch (err) {
        console.warn("Error fetching stock details:", err);
        setError(err.message || "Failed to load stock details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    const interval = setInterval(fetchDetail, 2000);
    return () => clearInterval(interval);
  }, [symbol]);

  const priceHist = safeArray(data?.price_history);
  const smma20Hist = safeArray(data?.smma20_history);
  const smma120Hist = safeArray(data?.smma120_history);

  const chartData = priceHist.map((p, idx) => ({
    tick: idx + 1,
    LTP: p,
    SMMA20: smma20Hist[idx] || p,
    SMMA120: smma120Hist[idx] || p,
  }));

  if (loading) {
    return (
      <div className="groww-card py-24 text-center text-slate-500 font-medium">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
        Loading real-time depth & SMMA indicators for {symbol}...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="groww-card py-16 text-center text-slate-500 font-medium space-y-4">
        <ShieldAlert className="w-10 h-10 mx-auto text-amber-500" />
        <p className="text-slate-800 dark:text-slate-200 font-bold">{error || `Stock ${symbol} not found.`}</p>
        <button onClick={() => navigate('/')} className="btn-groww-outline text-xs py-2 px-4 mx-auto">
          Back to Live Screener
        </button>
      </div>
    );
  }

  const metrics = data.metrics || {};
  const aiPred = data.ai_prediction || {};
  const aiFeatures = aiPred.features || {};
  const depthBids = safeArray(data.depth_levels?.bids);
  const depthAsks = safeArray(data.depth_levels?.asks);
  const changeVal = safeNumber(metrics.change_pct, 0);

  return (
    <div className="space-y-6">
      
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="btn-groww-outline text-xs py-2 px-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>Back to Live Screener</span>
        </button>

        <span className={`badge-groww-${aiPred.recommendation === 'ACCEPT' ? 'green' : 'red'} text-sm py-1 px-3`}>
          AI {aiPred.recommendation || 'HOLD'} ({safeFixed(aiPred.confidence, 1)}%)
        </span>
      </div>

      {/* Stock Summary Header */}
      <div className="groww-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{data.symbol}</h2>
              <span className="text-base text-slate-500 font-semibold">{metrics.name || data.symbol}</span>
              <span className={`badge-groww-${metrics.smma_status === 'BULLISH' ? 'green' : 'red'}`}>
                {metrics.smma_status || 'NEUTRAL'}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-3xl font-mono font-bold text-slate-900">₹{safeFixed(metrics.ltp, 2)}</span>
              <span className={`text-base font-bold flex items-center gap-0.5 ${
                changeVal >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {safePercent(changeVal, 2)}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-medium space-y-1">
            <div className="text-slate-500 font-bold flex items-center gap-1">
              <Cpu className="w-4 h-4 text-emerald-600" />
              Quantitative Signal Evaluation
            </div>
            <div className="text-slate-900 font-mono font-bold text-sm">
              LTQ 2m/5m Surge: {safeFixed(aiFeatures.ltq_surge_ratio, 2)}x
            </div>
            <div className="text-slate-600">
              Bid/Ask Imbalance: {safeFixed(aiFeatures.bid_ask_ratio, 2)}x
            </div>
          </div>
        </div>

        {/* AI Rationale Banner */}
        <div className="mt-4 bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-medium">
          <span className="font-bold">AI Recommendation Rationale: </span>
          {aiPred.explanation || 'No rationale available.'}
        </div>
      </div>

      {/* Technical Chart Card */}
      <div className="groww-card p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
          <span>Real-Time Price Action & SMMA (20 / 120) Technical Chart</span>
          <span className="text-xs text-emerald-700 font-mono">Green: SMMA(20) | Blue: SMMA(120)</span>
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="tick" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="LTP" stroke="#0f172a" strokeWidth={2.5} dot={false} name="LTP Price (₹)" />
              <Line type="monotone" dataKey="SMMA20" stroke="#00d09c" strokeWidth={2.5} dot={false} name="SMMA (20)" />
              <Line type="monotone" dataKey="SMMA120" stroke="#5367ff" strokeWidth={2.5} dot={false} name="SMMA (120)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Market Depth & ETQ Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 5-Level Market Depth */}
        <div className="groww-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              5-Level Order Book Market Depth
            </h4>
            <span className="text-xs text-slate-500 font-mono font-bold">
              Bid: {formatIndianNumber(metrics.bid_qty)} | Ask: {formatIndianNumber(metrics.ask_qty)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            {/* Bids */}
            <div>
              <div className="text-xs font-bold text-emerald-700 pb-1.5 border-b border-emerald-200 mb-2 flex justify-between">
                <span>BID PRICE</span>
                <span>QUANTITY</span>
              </div>
              <div className="space-y-2">
                {depthBids.map((b, i) => (
                  <div key={i} className="flex justify-between items-center bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <span className="text-emerald-900 font-bold">₹{safeFixed(b.price, 2)}</span>
                    <span className="text-slate-700 font-bold">{formatIndianNumber(b.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Asks */}
            <div>
              <div className="text-xs font-bold text-rose-700 pb-1.5 border-b border-rose-200 mb-2 flex justify-between">
                <span>ASK PRICE</span>
                <span>QUANTITY</span>
              </div>
              <div className="space-y-2">
                {depthAsks.map((a, i) => (
                  <div key={i} className="flex justify-between items-center bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                    <span className="text-rose-900 font-bold">₹{safeFixed(a.price, 2)}</span>
                    <span className="text-slate-700 font-bold">{formatIndianNumber(a.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ETQ Executed Volume & VWAPs */}
        <div className="groww-card p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Exchange Traded Quantity (ETQ) & VWAP Stats
          </h4>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-bold">ETQ 5 MIN</div>
              <div className="text-base font-bold text-slate-900 font-mono mt-1">{formatIndianNumber(metrics.etq_5m)}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-bold">ETQ 20 MIN</div>
              <div className="text-base font-bold text-slate-700 font-mono mt-1">{formatIndianNumber(metrics.etq_20m)}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-bold">ETQ 60 MIN</div>
              <div className="text-base font-bold text-slate-500 font-mono mt-1">{formatIndianNumber(metrics.etq_60m)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-bold">AVG PRICE (20 MIN VWAP)</div>
              <div className="text-lg font-bold text-emerald-600 font-mono mt-1">₹{safeFixed(metrics.avg_price_20m, 2)}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-bold">AVG PRICE (60 MIN VWAP)</div>
              <div className="text-lg font-bold text-blue-600 font-mono mt-1">₹{safeFixed(metrics.avg_price_60m, 2)}</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

