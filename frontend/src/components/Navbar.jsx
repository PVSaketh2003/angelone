import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Activity, Sparkles, BarChart2, Cpu, Settings, Smartphone, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Navbar({ isLive }) {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  return (
    <>
      <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40 px-6 md:px-8 py-5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo & Title with Gradient Text */}
          <Link to="/" className="flex items-center gap-3.5 group">
            {/* Futuristic Geometric Delta Quant Logo */}
            <div className="relative w-10 h-10 flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] group-hover:border-slate-700 transition-colors duration-300">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 opacity-50" />
              <svg className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3L21 19H3L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 9L17 17H7L12 9Z" fill="currentColor" className="opacity-20" />
                <circle cx="12" cy="13" r="1.5" fill="currentColor" className="text-violet-400 animate-pulse-slow" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Quant</span>
                <span className="text-sm font-medium tracking-tight text-indigo-600 dark:text-indigo-400">Engine</span>
              </div>
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                Institutional Terminal
              </span>
            </div>
          </Link>

          {/* Premium Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200/40 dark:border-slate-700/40 backdrop-blur-md">
            <NavLink 
              to="/" 
              end 
              className={({ isActive }) => `px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-[0_4px_12px_rgba(0,0,0,0.03)]' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Screener
            </NavLink>
            <NavLink 
              to="/vision-ai" 
              className={({ isActive }) => `px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-[0_4px_12px_rgba(0,0,0,0.03)]' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Vision AI
            </NavLink>
            <NavLink 
              to="/backtest" 
              className={({ isActive }) => `px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-[0_4px_12px_rgba(0,0,0,0.03)]' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Backtest
            </NavLink>
            <NavLink 
              to="/ml-metrics" 
              className={({ isActive }) => `px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-[0_4px_12px_rgba(0,0,0,0.03)]' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              ML Metrics
            </NavLink>
          </nav>

          {/* Live Status Badge & Settings */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-full">
              <span className={`relative flex h-2 w-2`}>
                {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
              </span>
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hidden sm:inline">
                {isLive ? 'Live' : 'Offline'}
              </span>
            </div>

            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors shadow-sm"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link 
              to="/settings" 
              className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors shadow-sm"
            >
              <Settings className="w-4 h-4" />
            </Link>
            
            {user && (
              <button 
                onClick={logout}
                title="Logout"
                className="w-10 h-10 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 flex items-center justify-center text-rose-500 hover:text-rose-600 transition-colors shadow-sm ml-2"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Groww App Style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-100/80 dark:border-slate-800/80 z-40 flex items-center justify-around py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] transition-colors">
        <NavLink 
          to="/" 
          end 
          className={({ isActive }) => `flex flex-col items-center gap-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${
            isActive ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <Activity className="w-4 h-4" />
          Screener
        </NavLink>
        <NavLink 
          to="/vision-ai" 
          className={({ isActive }) => `flex flex-col items-center gap-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${
            isActive ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Vision
        </NavLink>
        <NavLink 
          to="/backtest" 
          className={({ isActive }) => `flex flex-col items-center gap-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${
            isActive ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Backtest
        </NavLink>
        <NavLink 
          to="/ml-metrics" 
          className={({ isActive }) => `flex flex-col items-center gap-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${
            isActive ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Metrics
        </NavLink>
      </nav>
    </>
  );
}
