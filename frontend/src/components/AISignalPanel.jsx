import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, MessageSquare } from 'lucide-react';

export default function AISignalPanel({ signals }) {
  const [filter, setFilter] = useState('ALL');
  const [isExpanded, setIsExpanded] = useState(true);

  const filteredSignals = signals.filter(s => {
    if (filter === 'ACCEPT') return s.recommendation === 'ACCEPT';
    if (filter === 'AVOID') return s.recommendation === 'AVOID';
    return true;
  });

  return (
    <div className="py-8 border-t border-slate-100 dark:border-slate-800 transition-colors">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">AI Signal & Decision Feed</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Real-time crossover explanations & neural filter logging</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setFilter('ALL')}
              className={`transition-colors pb-1.5 ${filter === 'ALL' ? 'text-slate-900 dark:text-slate-100 border-b-2 border-slate-900 dark:border-slate-100' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              All Signals
            </button>
            <button
              onClick={() => setFilter('ACCEPT')}
              className={`transition-colors pb-1.5 ${filter === 'ACCEPT' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              Accepted
            </button>
            <button
              onClick={() => setFilter('AVOID')}
              className={`transition-colors pb-1.5 ${filter === 'AVOID' ? 'text-rose-600 dark:text-rose-400 border-b-2 border-rose-600 dark:border-rose-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              Avoided
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Stream List */}
      {isExpanded && (
        <div className="space-y-4">
          {filteredSignals.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Awaiting live crossovers...</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Crossover events will be logged and analyzed in real-time here.</p>
            </div>
          ) : (
            filteredSignals.map((sig) => {
              const isAccept = sig.recommendation === 'ACCEPT';

              return (
                <div key={sig.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-5 bg-slate-50/40 dark:bg-slate-800/40 border border-slate-100/70 dark:border-slate-700/70 hover:border-indigo-100 dark:hover:border-indigo-500/30 rounded-2xl hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all duration-300">
                  
                  {/* Stock Symbol */}
                  <div className="flex items-center gap-3.5 min-w-[220px]">
                    <div className={`w-2.5 h-2.5 rounded-full ${isAccept ? 'bg-emerald-500 glow-green' : 'bg-rose-500 glow-red'}`} />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{sig.symbol}</div>
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                        {sig.signal_type} @ <span className="font-mono">₹{sig.ltp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Decision rationale explanation */}
                  <div className="flex-1 text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                    {sig.explanation}
                  </div>

                  {/* Indicators & Pill */}
                  <div className="flex items-center justify-between lg:justify-end gap-6 min-w-[200px] border-t border-slate-100 dark:border-slate-800 lg:border-t-0 pt-3 lg:pt-0">
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono text-right">
                      <div className="mb-0.5">SURGE RATIO: <span className="text-slate-800 dark:text-slate-200">{sig.ltq_surge_ratio}x</span></div>
                      <div>B/A RATIO: <span className="text-slate-800 dark:text-slate-200">{sig.bid_ask_ratio}x</span></div>
                    </div>

                    <div className={`text-[10px] font-extrabold px-3 py-1.5 rounded-xl uppercase tracking-wider text-center w-24 ${
                      isAccept 
                        ? 'bg-emerald-100/70 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20' 
                        : 'bg-rose-100/70 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20'
                    }`}>
                      {sig.recommendation}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}
