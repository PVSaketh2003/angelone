import React from 'react';
import { useNavigate } from 'react-router-dom';
import MarketOverview from '../components/MarketOverview';
import ScreenerControls from '../components/ScreenerControls';
import DashboardTable from '../components/DashboardTable';
import AISignalPanel from '../components/AISignalPanel';
import { safeArray } from '../utils/safeFormats';

export default function ScreenerPage({
  screenedStocks,
  allStocks,
  signals,
  minLtp,
  setMinLtp,
  maxLtp,
  setMaxLtp,
  minBidQty,
  setMinBidQty,
  minAskQty,
  setMinAskQty,
  searchQuery,
  setSearchQuery,
  showAllStocks,
  setShowAllStocks
}) {
  const navigate = useNavigate();

  const safeScreened = safeArray(screenedStocks);
  const safeAll = safeArray(allStocks);
  const safeSig = safeArray(signals);

  const displayedStocks = (showAllStocks ? safeAll : safeScreened).filter(stock => {
    if (!stock) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const sym = (stock.symbol || '').toLowerCase();
    const name = (stock.name || '').toLowerCase();
    return sym.includes(q) || name.includes(q);
  });

  return (
    <div className="glass-card p-8 md:p-12 space-y-8">
      
      {/* Metrics overview */}
      <MarketOverview stocks={safeScreened} />

      {/* Control bar: Search, Tabs, Filter Parameters */}
      <ScreenerControls
        minLtp={minLtp}
        setMinLtp={setMinLtp}
        maxLtp={maxLtp}
        setMaxLtp={setMaxLtp}
        minBidQty={minBidQty}
        setMinBidQty={setMinBidQty}
        minAskQty={minAskQty}
        setMinAskQty={setMinAskQty}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showAllStocks={showAllStocks}
        setShowAllStocks={setShowAllStocks}
        screenedCount={safeScreened.length}
        totalCount={safeAll.length}
      />


      {/* Data Monitor Table */}
      <div className="pt-2">
        <DashboardTable
          stocks={displayedStocks}
          onSelectStock={(symbol) => navigate(`/stock/${symbol}`)}
          showAllStocks={showAllStocks}
        />
      </div>

      {/* AI Decision stream */}
      <div className="pt-8">
        <AISignalPanel signals={safeSig} />
      </div>

    </div>
  );
}

