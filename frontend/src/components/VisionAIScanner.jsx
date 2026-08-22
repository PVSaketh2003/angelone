import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ShieldAlert, Cpu, RefreshCw, Layers } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const SAMPLE_CHARTS = {
  TATAMOTORS: {
    symbol: 'TATAMOTORS',
    pattern: 'SMMA (20) Bullish Golden Cross with High LTQ Volume Surge',
    confidence: 91.4,
    recommendation: 'ACCEPT',
    data: Array.from({ length: 30 }, (_, i) => {
      const ltp = 450 + i * 1.2 + Math.sin(i / 2) * 4;
      const smma20 = 448 + i * 1.1;
      const smma120 = 452 + i * 0.3;
      return { tick: i + 1, LTP: ltp, SMMA20: smma20, SMMA120: smma120, LTQ: 12000 + i * 900 };
    }),
    vision_notes: [
      'Vision AI detected clean upward SMMA(20) breakout above SMMA(120) at Tick #14.',
      'Order depth vision scanner highlights 2.4x Bid accumulation (18.5L Bids vs 7.2L Asks).',
      'LTQ volume expansion confirms strong institutional buying velocity.',
    ]
  },
  SBIN: {
    symbol: 'SBIN',
    pattern: 'SMMA (20) False Breakout / Avoided High-Risk Reversal',
    confidence: 34.2,
    recommendation: 'AVOID',
    data: Array.from({ length: 30 }, (_, i) => {
      const ltp = 495 - i * 0.8 + Math.cos(i / 3) * 5;
      const smma20 = 492 - i * 0.4;
      const smma120 = 488 + i * 0.1;
      return { tick: i + 1, LTP: ltp, SMMA20: smma20, SMMA120: smma120, LTQ: 4000 + Math.random() * 2000 };
    }),
    vision_notes: [
      'Vision AI flags severe ask-side supply overhang (Ask Qty > 22L capping gains).',
      'Subdued LTQ surge ratio (0.68x) signals lack of buyer momentum on the crossover.',
      'High probability of false breakout and immediate mean-reversion pull-back.',
    ]
  }
};

export default function VisionAIScanner() {
  const [selectedStock, setSelectedStock] = useState('TATAMOTORS');
  const [analyzing, setAnalyzing] = useState(false);

  const currentAnalysis = SAMPLE_CHARTS[selectedStock];

  const handleScan = (sym) => {
    setSelectedStock(sym);
    setAnalyzing(true);
    setTimeout(() => setAnalyzing(false), 600);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="groww-card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Vision AI Market & Technical Chart Scanner</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1 max-w-xl">
              Uses Deep Computer Vision AI & Pattern Models to analyze price chart geometry, SMMA crossover angles, and order book depth structures.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => handleScan('TATAMOTORS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedStock === 'TATAMOTORS' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              TATAMOTORS (Bullish)
            </button>
            <button
              onClick={() => handleScan('SBIN')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedStock === 'SBIN' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              SBIN (False Breakout)
            </button>
          </div>
        </div>
      </div>

      {analyzing ? (
        <div className="groww-card py-20 text-center text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600 dark:text-emerald-500" />
          Running Vision AI Convolutional Neural Network on {selectedStock} Chart...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart (2 cols) */}
          <div className="lg:col-span-2 groww-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{currentAnalysis.symbol} Vision AI Technical Chart</h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{currentAnalysis.pattern}</div>
              </div>

              <span className={`badge-groww-${currentAnalysis.recommendation === 'ACCEPT' ? 'green' : 'red'}`}>
                {currentAnalysis.recommendation === 'ACCEPT' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                {currentAnalysis.recommendation} ({currentAnalysis.confidence}%)
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentAnalysis.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="tick" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="LTP" stroke="#0f172a" strokeWidth={2.5} dot={false} name="LTP Price" />
                  <Line type="monotone" dataKey="SMMA20" stroke="#00d09c" strokeWidth={2} dot={false} name="SMMA (20)" />
                  <Line type="monotone" dataKey="SMMA120" stroke="#5367ff" strokeWidth={2} dot={false} name="SMMA (120)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Inspection Notes (1 col) */}
          <div className="lg:col-span-1 groww-card p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Vision AI Inspection Notes</h3>
            </div>

            <div className="space-y-3 text-xs">
              {currentAnalysis.vision_notes.map((note, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-1">
                  <div className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
                    Insight #{idx + 1}
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{note}</div>
                </div>
              ))}
            </div>

            <div className={`${currentAnalysis.recommendation === 'ACCEPT' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-400'} p-3.5 rounded-xl border text-xs font-medium`}>
              <div className={`font-bold mb-0.5 ${currentAnalysis.recommendation === 'ACCEPT' ? 'text-emerald-900 dark:text-emerald-300' : 'text-rose-900 dark:text-rose-300'}`}>Vision AI Decision</div>
              <div>
                {currentAnalysis.recommendation === 'ACCEPT'
                  ? 'Trade Accepted: High probability of trend continuation supported by order flow.'
                  : 'Trade Avoided: Rejection recommended due to lack of volume confirmation.'}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
