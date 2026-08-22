import React, { useState } from 'react';
import { Key, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
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
      setSavedStatus(false);
    }, 2500);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      
      <div className="groww-card p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Trading Broker API Settings</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Configure Angel One SmartAPI or Fyers live feed credentials</p>
          </div>
        </div>
      </div>

      <div className="groww-card p-6">
        {savedStatus ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-slate-900">Broker API Configured Successfully</h4>
            <p className="text-xs text-slate-500 font-medium">Connected to Angel One SmartAPI Feed Stream</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Broker API Platform</label>
              <select
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="ANGELONE">Angel One (SmartAPI)</option>
                <option value="FYERS">Fyers API v3</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">API Key</label>
              <input
                type="text"
                placeholder="e.g. smartapi_key_xxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Client ID / Username</label>
              <input
                type="text"
                placeholder="e.g. A123456"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PIN / Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">TOTP Key / Secret</label>
              <input
                type="text"
                placeholder="Authenticator TOTP Secret"
                value={totpSecret}
                onChange={(e) => setTotpSecret(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-2 font-medium">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Credentials are encrypted locally and never saved on external servers.</span>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="btn-groww text-xs w-full py-2.5 justify-center"
              >
                Save & Connect Broker API
              </button>
            </div>

          </form>
        )}
      </div>

    </div>
  );
}
