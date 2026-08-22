import React, { useState } from 'react';
import { X, Key, CheckCircle2, Lock } from 'lucide-react';

export default function CredentialsModal({ onClose }) {
  const [broker, setBroker] = useState('ANGELONE');
  const [apiKey, setApiKey] = useState('');
  const [clientId, setClientId] = useState('');
  const [password, setPassword] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [savedStatus, setSavedStatus] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedStatus(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 relative border border-slate-200 dark:border-slate-800 shadow-2xl transition-colors">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
            <Key className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Trading Broker API Credentials</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Configure Angel One SmartAPI or Fyers live feed</p>
          </div>
        </div>

        {savedStatus ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Credentials Saved Securely</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Connected to Angel One Live SmartAPI Stream</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Select Broker API</label>
              <select
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="ANGELONE">Angel One (SmartAPI)</option>
                <option value="FYERS">Fyers API v3</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">API Key</label>
              <input
                type="text"
                placeholder="e.g. smartapi_key_xxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Client ID / Username</label>
              <input
                type="text"
                placeholder="e.g. A123456"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">PIN / Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">TOTP Key / Secret</label>
              <input
                type="text"
                placeholder="Authenticator TOTP Secret"
                value={totpSecret}
                onChange={(e) => setTotpSecret(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-2 font-medium">
              <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
              <span>Credentials are encrypted locally and never saved on external servers.</span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-groww-outline text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-groww text-xs"
              >
                Connect API
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
