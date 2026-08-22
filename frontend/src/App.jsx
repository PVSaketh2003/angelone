import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ChatAssistant from './components/ChatAssistant';
import ScreenerPage from './pages/ScreenerPage';
import StockDetailPage from './pages/StockDetailPage';
import VisionAIPage from './pages/VisionAIPage';
import BacktestPage from './pages/BacktestPage';
import MLMetricsPage from './pages/MLMetricsPage';
import SettingsPage from './pages/SettingsPage';
import { apiClient } from './services/api';
import { safeArray } from './utils/safeFormats';
import { WifiOff } from 'lucide-react';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">Loading session...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Main App Layout
const MainLayout = ({ children, isLive }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {!isLive && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          Backend API server disconnected. Attempting to reconnect...
        </div>
      )}
      <Navbar isLive={isLive} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-10 pb-20 md:pb-10">
        {children}
      </main>

      <footer className="py-8 pb-24 md:pb-8 text-center text-xs text-gray-400 font-semibold tracking-wide">
        QuantEngine Technical Assessment &bull; Developed by PV Sairam Saketh &copy; 2026
      </footer>
      <ChatAssistant />
    </div>
  );
};

function AppContent() {
  const [screenedStocks, setScreenedStocks] = useState([]);
  const [allStocks, setAllStocks] = useState([]);
  const [signals, setSignals] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLive, setIsLive] = useState(true);

  // Screener Filter Parameters
  const [minLtp, setMinLtp] = useState(30);
  const [maxLtp, setMaxLtp] = useState(500);
  const [minBidQty, setMinBidQty] = useState(1000000);
  const [minAskQty, setMinAskQty] = useState(1000000);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllStocks, setShowAllStocks] = useState(false);
  
  const { user } = useAuth();

  const fetchData = async () => {
    if (!user) return; // Only fetch if logged in
    try {
      const screenedJson = await apiClient(
        `/api/stocks/?min_ltp=${minLtp}&max_ltp=${maxLtp}&min_bid=${minBidQty}&min_ask=${minAskQty}`
      );
      setScreenedStocks(safeArray(screenedJson?.stocks));
      if (screenedJson?.timestamp) setLastUpdated(screenedJson.timestamp);

      const allJson = await apiClient('/api/stocks/all/');
      setAllStocks(safeArray(allJson?.stocks));

      const sigJson = await apiClient('/api/signals/');
      setSignals(safeArray(sigJson?.signals));
      
      setIsLive(true);
    } catch (err) {
      console.warn("Backend API telemetry fetch warning:", err?.message || err);
      setIsLive(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1500);
    return () => clearInterval(interval);
  }, [minLtp, maxLtp, minBidQty, minAskQty, user]);


  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected Main Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout isLive={isLive}>
              <ScreenerPage
                screenedStocks={screenedStocks}
                allStocks={allStocks}
                signals={signals}
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
              />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/stock/:symbol" element={<ProtectedRoute><MainLayout isLive={isLive}><StockDetailPage /></MainLayout></ProtectedRoute>} />
      <Route path="/vision-ai" element={<ProtectedRoute><MainLayout isLive={isLive}><VisionAIPage /></MainLayout></ProtectedRoute>} />
      <Route path="/backtest" element={<ProtectedRoute><MainLayout isLive={isLive}><BacktestPage /></MainLayout></ProtectedRoute>} />
      <Route path="/ml-metrics" element={<ProtectedRoute><MainLayout isLive={isLive}><MLMetricsPage /></MainLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><MainLayout isLive={isLive}><SettingsPage /></MainLayout></ProtectedRoute>} />
    </Routes>
  );
}


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
