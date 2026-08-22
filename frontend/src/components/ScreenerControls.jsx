import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export default function ScreenerControls({
  minLtp, setMinLtp, maxLtp, setMaxLtp,
  minBidQty, setMinBidQty, minAskQty, setMinAskQty,
  searchQuery, setSearchQuery,
  showAllStocks, setShowAllStocks,
  screenedCount, totalCount
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatIndianNumber = (num) => {
    if (num >= 10000000) return (num / 10000000).toFixed(1) + ' Cr';
    if (num >= 100000) return (num / 100000).toFixed(1) + ' L';
    return num.toLocaleString('en-IN');
  };

  return (
    <div className="border-b border-slate-100 dark:border-slate-800 py-6 mb-6 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Search Bar with clean border & focus indicator */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by symbol or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
          {/* Custom Tabs */}
          <div className="flex bg-slate-100/60 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/30 dark:border-slate-700/30">
            <button
              onClick={() => setShowAllStocks(false)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                !showAllStocks 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Screened ({screenedCount})
            </button>
            <button
              onClick={() => setShowAllStocks(true)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                showAllStocks 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All Universe ({totalCount})
            </button>
          </div>

          {/* Filter Trigger Button */}
          <div className="relative">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Parameters
            </button>

            {/* Premium Filter Dropdown */}
            {isExpanded && (
              <div className="absolute right-0 top-full mt-3 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-6 z-50">

                <div className="flex justify-between items-center mb-5">
                  <span className="text-[10px] font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Filter Limits</span>
                  <button onClick={() => setIsExpanded(false)} className="text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                      <span>Min LTP</span>
                      <span className="font-mono text-slate-900 dark:text-slate-100">₹{minLtp}</span>
                    </div>
                    <input type="range" min="10" max="200" step="5" value={minLtp} onChange={(e) => setMinLtp(Number(e.target.value))} className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                      <span>Max LTP</span>
                      <span className="font-mono text-slate-900 dark:text-slate-100">₹{maxLtp}</span>
                    </div>
                    <input type="range" min="100" max="1000" step="10" value={maxLtp} onChange={(e) => setMaxLtp(Number(e.target.value))} className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                      <span>Min Bid Qty</span>
                      <span className="font-mono text-slate-900 dark:text-slate-100">{formatIndianNumber(minBidQty)}</span>
                    </div>
                    <input type="range" min="100000" max="5000000" step="100000" value={minBidQty} onChange={(e) => setMinBidQty(Number(e.target.value))} className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                      <span>Min Ask Qty</span>
                      <span className="font-mono text-slate-900 dark:text-slate-100">{formatIndianNumber(minAskQty)}</span>
                    </div>
                    <input type="range" min="100000" max="5000000" step="100000" value={minAskQty} onChange={(e) => setMinAskQty(Number(e.target.value))} className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
