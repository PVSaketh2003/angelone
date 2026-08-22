  import React, { useState, useEffect } from 'react';
  import { X, Cpu, Award, ShieldCheck, RefreshCw, BarChart2 } from 'lucide-react';
  import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

  export default function MLPerformanceModal({ onClose }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetch('http://localhost:8000/api/ml/stats/')
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(err => console.error("Error fetching ML stats:", err))
        .finally(() => setLoading(false));
    }, []);

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative border border-slate-200 dark:border-slate-800 shadow-2xl transition-colors">
          
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Quantitative ML Model Evaluation & Metrics</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Gradient Boosting Classifier calibration metrics over 3,000 synthetic tick iterations</p>
            </div>
          </div>

          {loading || !stats ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600 dark:text-emerald-500" />
              Evaluating Machine Learning Model AUC-ROC & Feature Importances...
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase">ROC-AUC SCORE</div>
                  <div className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{stats.auc_roc}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase">PRECISION</div>
                  <div className="text-2xl font-mono font-extrabold text-blue-600 dark:text-blue-400 mt-1">{(stats.precision * 100).toFixed(1)}%</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase">RECALL</div>
                  <div className="text-2xl font-mono font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{(stats.recall * 100).toFixed(1)}%</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase">ACCURACY</div>
                  <div className="text-2xl font-mono font-extrabold text-purple-600 dark:text-purple-400 mt-1">{(stats.accuracy * 100).toFixed(1)}%</div>
                </div>
              </div>

              {/* Feature Importances Chart */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wider">
                  Quantitative Feature Importance Attribution
                </h4>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.feature_importances} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="feature" type="category" stroke="#64748b" tick={{ fontSize: 10 }} width={120} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="importance" fill="#00d09c" radius={[0, 4, 4, 0]} name="Feature Importance Weight" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Confusion Matrix */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2 uppercase tracking-wider">Confusion Matrix (Validation Test Set)</h4>
                <div className="grid grid-cols-2 gap-3 text-center text-xs font-mono">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500 dark:text-slate-400">True Negatives (Avoided Loss)</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.confusion_matrix[0][0]}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500 dark:text-slate-400">False Positives (Missed Risk)</div>
                    <div className="text-lg font-bold text-rose-600 dark:text-rose-500 mt-1">{stats.confusion_matrix[0][1]}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500 dark:text-slate-400">False Negatives (Missed Win)</div>
                    <div className="text-lg font-bold text-amber-600 dark:text-amber-500 mt-1">{stats.confusion_matrix[1][0]}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500 dark:text-slate-400">True Positives (Accepted Profit)</div>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-500 mt-1">{stats.confusion_matrix[1][1]}</div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    );
  }
