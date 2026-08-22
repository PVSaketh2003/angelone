import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function MLMetricsPage() {
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
    <div className="space-y-6">
      
      <div className="groww-card p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Quantitative ML Model Evaluation & Metrics</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Gradient Boosting Classifier calibration metrics over 3,000 synthetic tick iterations</p>
          </div>
        </div>
      </div>

      {loading || !stats ? (
        <div className="groww-card py-24 text-center text-slate-500 font-medium">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
          Evaluating Machine Learning Model ROC-AUC & Feature Importances...
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="groww-card p-5 border-l-4 border-l-emerald-500">
              <div className="text-xs text-slate-500 font-bold uppercase">ROC-AUC SCORE</div>
              <div className="text-3xl font-mono font-extrabold text-emerald-600 mt-2">{stats.auc_roc}</div>
            </div>
            <div className="groww-card p-5 border-l-4 border-l-blue-500">
              <div className="text-xs text-slate-500 font-bold uppercase">PRECISION</div>
              <div className="text-3xl font-mono font-extrabold text-blue-600 mt-2">{(stats.precision * 100).toFixed(1)}%</div>
            </div>
            <div className="groww-card p-5 border-l-4 border-l-indigo-500">
              <div className="text-xs text-slate-500 font-bold uppercase">RECALL</div>
              <div className="text-3xl font-mono font-extrabold text-indigo-600 mt-2">{(stats.recall * 100).toFixed(1)}%</div>
            </div>
            <div className="groww-card p-5 border-l-4 border-l-purple-500">
              <div className="text-xs text-slate-500 font-bold uppercase">ACCURACY</div>
              <div className="text-3xl font-mono font-extrabold text-purple-600 mt-2">{(stats.accuracy * 100).toFixed(1)}%</div>
            </div>
          </div>

          {/* Feature Importances Chart */}
          <div className="groww-card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
              Quantitative Feature Importance Attribution
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.feature_importances} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="feature" type="category" stroke="#64748b" tick={{ fontSize: 10 }} width={130} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="importance" fill="#00d09c" radius={[0, 4, 4, 0]} name="Feature Importance Weight" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Confusion Matrix */}
          <div className="groww-card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Confusion Matrix (Validation Test Set)</h3>
            <div className="grid grid-cols-2 gap-4 text-center font-mono">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500 font-sans font-semibold">True Negatives (Avoided Loss)</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{stats.confusion_matrix[0][0]}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500 font-sans font-semibold">False Positives (Missed Risk)</div>
                <div className="text-2xl font-bold text-rose-600 mt-1">{stats.confusion_matrix[0][1]}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500 font-sans font-semibold">False Negatives (Missed Win)</div>
                <div className="text-2xl font-bold text-amber-600 mt-1">{stats.confusion_matrix[1][0]}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500 font-sans font-semibold">True Positives (Accepted Profit)</div>
                <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.confusion_matrix[1][1]}</div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
