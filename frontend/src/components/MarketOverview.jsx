import React from 'react';
import { TrendingUp, Activity, Award, BarChart3 } from 'lucide-react';

export default function MarketOverview({ stocks }) {
  if (!stocks || stocks.length === 0) return null;

  const totalCount = stocks.length;
  const bullishCount = stocks.filter(s => s.smma_status === 'BULLISH').length;
  const bullishPct = Math.round((bullishCount / totalCount) * 100);

  const sortedGainers = [...stocks].sort((a, b) => b.change_pct - a.change_pct);
  const topGainer = sortedGainers[0];

  const sortedVolume = [...stocks].sort((a, b) => b.etq_5m - a.etq_5m);
  const volumeLeader = sortedVolume[0];

  const formatIndian = (num) => {
    if (!num) return '0';
    if (num >= 10000000) return (num / 10000000).toFixed(1) + ' Cr';
    if (num >= 100000) return (num / 100000).toFixed(1) + ' L';
    return num.toLocaleString('en-IN');
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-10 border-b border-slate-100 dark:border-slate-800 transition-colors">
      
      {/* Active Screened */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-between group hover:scale-[1.02] transition-all duration-300">
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Active Screened</span>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tracking-tight">{totalCount}</span>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
          <Activity className="w-5 h-5" />
        </div>
      </div>

      {/* Bullish Sentiment */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-between group hover:scale-[1.02] transition-all duration-300">
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Bullish Sentiment</span>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tracking-tight">{bullishPct}%</span>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

      {/* Top Gainer */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-between group hover:scale-[1.02] transition-all duration-300">
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Top Gainer</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{topGainer?.symbol}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+{topGainer?.change_pct}%</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
          <Award className="w-5 h-5" />
        </div>
      </div>

      {/* Volume Leader */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-between group hover:scale-[1.02] transition-all duration-300">
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Volume Leader</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{volumeLeader?.symbol}</span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{formatIndian(volumeLeader?.etq_5m)}</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center text-sky-500 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors duration-300">
          <BarChart3 className="w-5 h-5" />
        </div>
      </div>

    </div>
  );
}
