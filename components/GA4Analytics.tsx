
import React, { useState, useEffect } from 'react';
import { ProjectContext, GA4Connection, GA4Property } from '../types';
import { RefreshCw, Link as LinkIcon, AlertCircle, CheckCircle, Database, Layout, ShieldCheck, ChevronRight, Power, Settings, CloudSync } from 'lucide-react';

interface Props {
  project: ProjectContext;
}

export const GA4Analytics: React.FC<Props> = ({ project }) => {
  const [connection, setConnection] = useState<GA4Connection>({ isConnected: false });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [properties, setProperties] = useState<GA4Property[]>([]);
  const [showPropertySelector, setShowPropertySelector] = useState(false);

  // Load connection status on mount
  useEffect(() => {
    fetchConnectionStatus();
  }, []);

  const fetchConnectionStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ga4/status');
      const data = await res.json();
      setConnection(data);
      if (data.isConnected && !data.propertyId) {
        fetchProperties();
      }
    } catch (err) {
      console.error('Failed to fetch GA4 status', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/ga4/properties');
      const data = await res.json();
      setProperties(data.properties || []);
      setShowPropertySelector(true);
    } catch (err) {
      console.error('Failed to fetch properties', err);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/auth/login';
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect? Historical data remains but syncs will stop.')) return;
    setLoading(true);
    try {
      await fetch('/api/ga4/disconnect', { method: 'POST' });
      setConnection({ isConnected: false });
      setShowPropertySelector(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProperty = async (prop: GA4Property) => {
    setLoading(true);
    try {
      await fetch('/api/ga4/save-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          propertyId: prop.propertyId, 
          propertyName: prop.displayName 
        })
      });
      setConnection(prev => ({ ...prev, propertyId: prop.propertyId, propertyName: prop.displayName }));
      setShowPropertySelector(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/ga4/sync', { method: 'POST' });
      const result = await res.json();
      alert(`Sync Complete: ${result.message}`);
      fetchConnectionStatus();
    } catch (err) {
      alert('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Handshaking GA4 Gateway...</p>
      </div>
    );
  }

  if (!connection.isConnected) {
    return (
      <div className="max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-500">
        <div className="glass-card rounded-[3.5rem] p-12 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500" />
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
              <Database className="w-10 h-10 text-slate-500" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight mb-3">GA4 Data Gateway</h2>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Protocol Offline</span>
            </div>
            <p className="text-slate-400 font-medium text-sm leading-relaxed mb-10 px-6">
              Connect your Google Analytics 4 property to enable real-time semantic intelligence and threshold monitoring.
            </p>
            
            <button
              onClick={handleConnect}
              className="w-full py-5 bg-teal-500 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-teal-400 hover:shadow-[0_0_30px_rgba(45,212,191,0.3)] transition-all"
            >
              <LinkIcon className="w-5 h-5" /> Initialize Google Auth
            </button>
            
            <div className="mt-8 pt-8 border-t border-white/5 w-full">
              <div className="flex flex-col items-start gap-4">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Prerequisites</p>
                <div className="space-y-3 w-full">
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-bold">
                    <CheckCircle className="w-4 h-4 text-teal-500/50" /> Valid GA4 Property Access
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-bold">
                    <CheckCircle className="w-4 h-4 text-teal-500/50" /> Analytics Read Permission
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showPropertySelector) {
    return (
      <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
        <div className="glass-card rounded-[3.5rem] p-12 border border-white/5 shadow-2xl">
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Select Target Architecture</h2>
          <p className="text-slate-400 font-medium text-sm mb-10">Choose the GA4 property context for <span className="text-teal-400 font-bold">{connection.email}</span></p>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {properties.map((prop) => (
              <button
                key={prop.propertyId}
                onClick={() => handleSelectProperty(prop)}
                className="w-full text-left p-6 bg-slate-800/50 rounded-2xl border border-white/5 hover:border-teal-500/50 hover:bg-slate-700/50 transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-black text-slate-200 uppercase tracking-widest group-hover:text-teal-400 transition-colors">{prop.displayName}</h4>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">Property ID: {prop.propertyId}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-teal-400 transition-all" />
              </button>
            ))}
            {properties.length === 0 && (
              <div className="py-12 text-center text-slate-500 italic text-sm">No GA4 properties detected. Check your permissions.</div>
            )}
          </div>
          
          <button
            onClick={handleDisconnect}
            className="mt-8 text-[10px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-widest flex items-center gap-2"
          >
            <Power className="w-3 h-3" /> Terminate Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="glass-card rounded-[3.5rem] p-10 border border-white/5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
        
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl border border-teal-500/20 flex items-center justify-center shadow-xl">
            <CheckCircle className="w-8 h-8 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-black text-teal-500 uppercase tracking-widest">Connected Intelligence</span>
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{connection.propertyName}</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Operator: {connection.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-6 py-4 bg-teal-500 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-teal-500/20 hover:bg-teal-400 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudSync className="w-4 h-4" />}
            {syncing ? 'Synchronizing...' : 'Sync Pipeline'}
          </button>
          
          <div className="h-12 w-px bg-white/10 mx-2" />
          
          <div className="flex flex-col items-end">
            <button onClick={() => setShowPropertySelector(true)} className="p-3 bg-slate-800 text-slate-400 hover:text-teal-400 rounded-xl transition-all" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={handleDisconnect} className="mt-2 p-3 bg-slate-800 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all" title="Disconnect">
              <Power className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-card p-8 rounded-3xl border border-white/5 shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Last Telemetry Sync</p>
          <p className="text-2xl font-black text-white tracking-tight">{connection.lastSync || 'Never'}</p>
        </div>
        <div className="glass-card p-8 rounded-3xl border border-white/5 shadow-xl md:col-span-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Pipeline Status</p>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="w-full h-full bg-emerald-500" />
            </div>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active & Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};
