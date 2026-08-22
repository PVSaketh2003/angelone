import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Download, BarChart2, TrendingUp, TrendingDown } from 'lucide-react';
import { safeFixed, safeNumber, safeArray, formatIndianNumber, safePercent } from '../utils/safeFormats';
import { API_BASE_URL } from '../services/api';

export default function DashboardTable({ stocks, onSelectStock, showAllStocks }) {
  const [sortField, setSortField] = useState('etq_5m');
  const [sortAsc, setSortAsc] = useState(false);

  const stockList = safeArray(stocks);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedStocks = [...stockList].sort((a, b) => {
    let valA = a?.[sortField] ?? 0;
    let valB = b?.[sortField] ?? 0;

    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleExportCSV = () => {
    window.open(`${API_BASE_URL}/api/export/csv/`, '_blank');
  };

  if (stockList.length === 0) {
    return (
      <div className="py-24 text-center">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
          <BarChart2 className="w-8 h-8" />
        </div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No active assets found</p>
        <p className="text-xs text-slate-400 mt-1">Try expanding your filter parameters or search term.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
          Real-time Stock Monitor
          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] rounded-md font-bold uppercase tracking-wider">Live</span>
        </h2>
        
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 transition-all flex items-center gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          Export Dataset
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="premium-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('symbol')} className="cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors w-1/5">Company</th>
              <th onClick={() => handleSort('ltp')} className="cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-right">Price</th>
              <th className="text-right hidden md:table-cell">SMMA Indicators</th>
              <th onClick={() => handleSort('etq_5m')} className="cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-right hidden lg:table-cell">Volume Surge</th>
              <th className="text-right hidden xl:table-cell">Order Book Depth</th>
              <th onClick={() => handleSort('ai_confidence')} className="cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-right">AI Signal</th>
            </tr>
          </thead>
          <tbody>
            {sortedStocks.map((stock) => {
              if (!stock || !stock.symbol) return null;
              const isBullish = stock.smma_status === 'BULLISH';
              const isAccept = stock.ai_recommendation === 'ACCEPT';
              const changeVal = safeNumber(stock.change_pct, 0);
              const changeIsPos = changeVal >= 0;

              const bidQty = safeNumber(stock.bid_qty, 0);
              const askQty = safeNumber(stock.ask_qty, 1);
              const depthRatio = (bidQty / (askQty || 1)).toFixed(2);

              return (
                <tr 
                  key={stock.symbol} 
                  onClick={() => onSelectStock && onSelectStock(stock.symbol)}
                  className="cursor-pointer group hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                >
                  
                  {/* Company */}
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:shadow-sm transition-all duration-300">
                        {stock.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-950 dark:text-slate-100 flex items-center gap-2">
                          {stock.symbol}
                          {showAllStocks && !stock.passes_screener && (
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[8px] rounded font-bold uppercase tracking-wider">Filtered</span>
                          )}
                        </div>
                        <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[180px]">{stock.name || stock.symbol}</div>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="text-right">
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">₹{safeFixed(stock.ltp, 2)}</div>
                    <div className={`text-[10px] font-bold flex items-center justify-end gap-0.5 mt-1 ${changeIsPos ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {changeIsPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {safePercent(changeVal, 2)}
                    </div>
                  </td>

                  {/* SMMA */}
                  <td className="text-right hidden md:table-cell">
                    <div className="font-mono text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">₹{safeFixed(stock.smma20, 2)}</span>
                      <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                      <span className="text-slate-400 dark:text-slate-500">₹{safeFixed(stock.smma120, 2)}</span>
                    </div>
                    <div className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest mt-1.5 px-2 py-0.5 rounded ${
                      isBullish ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {isBullish ? 'Bullish' : 'Bearish'}
                    </div>
                  </td>

                  {/* Volume */}
                  <td className="text-right hidden lg:table-cell">
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatIndianNumber(stock.etq_5m)}</div>
                    <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1">20m: {formatIndianNumber(stock.etq_20m)}</div>
                  </td>

                  {/* Depth */}
                  <td className="text-right hidden xl:table-cell">
                    <div className="font-mono text-xs font-semibold">
                      <span className="text-emerald-600 dark:text-emerald-400">{formatIndianNumber(stock.bid_qty)}</span>
                      <span className="text-slate-300 dark:text-slate-600 mx-2">|</span>
                      <span className="text-rose-600 dark:text-rose-400">{formatIndianNumber(stock.ask_qty)}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-bold">Total Depth Ratio: {depthRatio}x</div>
                  </td>

                  {/* Signal */}
                  <td className="text-right">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                      isAccept 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-500/20' 
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 shadow-sm border border-rose-100 dark:border-rose-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isAccept ? 'bg-emerald-500' : 'bg-rose-500'} ${isAccept ? 'glow-green' : 'glow-red'}`} />
                      {stock.ai_recommendation || 'HOLD'}
                    </div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1.5 tracking-wider font-mono uppercase">
                      Conf: {safeFixed(stock.ai_confidence, 1)}%
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

