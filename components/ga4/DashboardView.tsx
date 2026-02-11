
import React, { useState, useMemo, useEffect } from 'react';
// Fixed missing icon imports from lucide-react: Globe, ShieldCheck, Download
import { ShieldAlert, Target, History, Database, ChevronDown, ChevronUp, Table as TableIcon, Calendar, CheckCircle, Info, Link2, ArrowUpRight, ArrowDownRight, TrendingUp, User, Activity, ShoppingCart, Search, Globe, ShieldCheck, Download } from 'lucide-react';
import { KPIStatTile } from './KPIStatTile';
import { databaseService } from '../../services/databaseService';
import { GA4Settings } from '../../types';

interface Props {
  analyzedKPIs: any[];
  ga4Config: { propertyId: string };
  analysisResults: { insights: any[], recommendations: any[] };
  telemetry: any[];
  startDate: string | null;
}

export const DashboardView: React.FC<Props> = ({ analyzedKPIs, ga4Config, analysisResults, telemetry, startDate }) => {
  const [showAudit, setShowAudit] = useState(false);
  const [showDataTable, setShowDataTable] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{date: string, kpi: string} | null>(null);
  const [ga4Settings, setGa4Settings] = useState<GA4Settings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await databaseService.getGA4Settings();
      setGa4Settings(settings);
    };
    fetchSettings();
  }, []);

  const dailyTableData = useMemo(() => {
    if (!startDate) return [];
    const siteStart = new Date(startDate).getTime();
    
    const dates = Array.from(new Set<string>(telemetry.map(t => t.recorded_at)))
      .filter((d: string) => new Date(d).getTime() >= siteStart)
      .sort()
      .reverse();

    const selectedKpiNames = analyzedKPIs.map(k => k.kpi_name);

    return dates.map(date => {
      const row: any = { date };
      selectedKpiNames.forEach(name => {
        const entry = telemetry.find(t => t.recorded_at === date && t.kpi_name === name);
        row[name] = entry 
          ? { value: entry.value, lineage: entry.metadata?.lineage, events: entry.metadata?.raw_payload } 
          : { value: '-', lineage: 'No data returned from API for this date', events: {} };
      });
      return row;
    });
  }, [telemetry, analyzedKPIs, startDate]);

  const renderMetricGroup = (title: string, icon: React.ReactNode, metrics: any[]) => {
    if (metrics.length === 0) return null;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 ml-4">
          <div className="p-2 bg-slate-800 text-slate-500 rounded-lg">{icon}</div>
          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{title}</h5>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((stat, idx) => (
            <KPIStatTile key={idx} stat={stat} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="lg:col-span-3 space-y-16 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-5xl font-black text-white tracking-tighter">Command Control</h3>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <div className="px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 flex items-center gap-2">
               <Globe className="w-3 h-3" />
               <span className="text-[9px] font-black uppercase tracking-widest">{ga4Settings?.property_name || 'Project Protocol'}</span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden md:block" />
            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> Linked: {startDate || 'N/A'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowAudit(!showAudit)}
          className={`px-8 py-4 rounded-2xl border flex items-center gap-3 transition-all shadow-2xl ${showAudit ? 'bg-teal-500 text-slate-950 border-teal-500' : 'bg-slate-800 border-white/5 text-slate-400 hover:text-white'}`}
        >
          <Database className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Integrity Report</span>
          {showAudit ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showAudit && (
        <div className="glass-card p-12 rounded-[3.5rem] border border-teal-500/20 bg-teal-500/5 animate-in slide-in-from-top-4 duration-500 shadow-inner">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-teal-500/60 uppercase tracking-widest">Grounding Period</p>
              <p className="text-lg font-black text-white italic leading-none">Since {startDate}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-teal-500/60 uppercase tracking-widest">Active Extraction</p>
              <p className="text-4xl font-black text-white leading-none tabular-nums">{telemetry.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-teal-500/60 uppercase tracking-widest">Protocol Trust</p>
              <p className="text-xs font-black text-white flex items-center gap-2 uppercase">
                 <CheckCircle className="w-4 h-4 text-emerald-400" /> OAuth 2.0 Verified
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-teal-500/60 uppercase tracking-widest">Lineage Integrity</p>
              <p className="text-xs font-black text-teal-400 uppercase flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Deterministic
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Render KPIs grouped by category if available */}
      <div className="space-y-12">
        {renderMetricGroup('User Metrics', <User className="w-4 h-4" />, analyzedKPIs.filter(k => ga4Settings?.selected_metrics.user_metrics.includes(k.kpi_key)))}
        {renderMetricGroup('Session Metrics', <Activity className="w-4 h-4" />, analyzedKPIs.filter(k => ga4Settings?.selected_metrics.session_metrics.includes(k.kpi_key)))}
        {renderMetricGroup('E-commerce Metrics', <ShoppingCart className="w-4 h-4" />, analyzedKPIs.filter(k => ga4Settings?.selected_metrics.ecommerce_metrics.includes(k.kpi_key)))}
        {renderMetricGroup('Traffic Metrics', <Search className="w-4 h-4" />, analyzedKPIs.filter(k => ga4Settings?.selected_metrics.traffic_metrics.includes(k.kpi_key)))}
        
        {/* Fallback for mixed or non-GA4 metrics */}
        {renderMetricGroup('Project KPIs', <Target className="w-4 h-4" />, analyzedKPIs.filter(k => !Object.values(ga4Settings?.selected_metrics || {}).flat().includes(k.kpi_key)))}
      </div>

      <div className="glass-card rounded-[4rem] border border-white/5 shadow-[0_60px_120px_-40px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="p-12 border-b border-white/5 flex items-center justify-between bg-slate-900/40 backdrop-blur-3xl">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/10 shadow-2xl relative">
              <TableIcon className="w-7 h-7 text-teal-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse border-2 border-slate-900" />
            </div>
            <div>
              <h4 className="font-black text-white uppercase tracking-tighter text-2xl leading-none">Deterministic Daily Log</h4>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-3 italic">Verified telemetry extracted via direct Google Cloud protocol</p>
            </div>
          </div>
          <button onClick={() => setShowDataTable(!showDataTable)} className="p-4 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95">
            {showDataTable ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </button>
        </div>
        
        {showDataTable && (
          <div className="overflow-x-auto max-h-[600px] scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-900/95 z-10 backdrop-blur-3xl">
                <tr className="border-b border-white/10">
                  <th className="px-12 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                    <Calendar className="w-4 h-4" /> Temporal Frame
                  </th>
                  {analyzedKPIs.map(k => (
                    <th key={k.kpi_name} className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {k.kpi_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dailyTableData.length === 0 ? (
                  <tr>
                    <td colSpan={analyzedKPIs.length + 1} className="px-12 py-32 text-center">
                       <div className="flex flex-col items-center gap-4 opacity-40">
                         <Search className="w-12 h-12 text-slate-600" />
                         <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Zero telemetry nodes detected in current sync window</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  dailyTableData.map((row, i) => (
                    <tr key={i} className="hover:bg-blue-500/[0.04] transition-colors group">
                      <td className="px-12 py-7 font-mono text-xs text-slate-600 font-bold uppercase tracking-widest">{row.date}</td>
                      {analyzedKPIs.map(k => (
                        <td 
                          key={k.kpi_name} 
                          className="px-12 py-7 font-black text-sm text-white relative group"
                          onMouseEnter={() => setHoveredCell({ date: row.date, kpi: k.kpi_name })}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          <div className="flex items-center gap-4">
                            {typeof row[k.kpi_name].value === 'number' 
                              ? row[k.kpi_name].value.toLocaleString(undefined, { maximumFractionDigits: 1 }) 
                              : row[k.kpi_name].value}
                            <Info className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all text-blue-400 cursor-help translate-x-2 group-hover:translate-x-0" />
                          </div>
                          
                          {hoveredCell?.date === row.date && hoveredCell?.kpi === k.kpi_name && row[k.kpi_name].lineage && (
                            <div className="absolute z-50 bottom-full left-10 mb-5 p-6 bg-slate-950 border border-blue-500/30 rounded-[2.5rem] shadow-[0_30px_90px_rgba(0,0,0,0.9)] text-[10px] text-blue-400 font-black uppercase whitespace-nowrap animate-in zoom-in-95 duration-200 backdrop-blur-3xl">
                              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/5 text-slate-200">
                                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Grounded Audit Trace
                              </div>
                              <div className="space-y-3">
                                {row[k.kpi_name].lineage.split('|').map((part: string, pi: number) => (
                                  <div key={pi} className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                                    <p className={pi === 0 ? 'text-slate-500' : 'text-blue-300 italic'}>{part.trim()}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-12 pb-20">
        <div className="glass-card p-16 rounded-[4.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
          <h4 className="font-black text-white mb-12 flex items-center gap-6 uppercase tracking-tighter text-xl">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-400 shadow-2xl">
              <ShieldAlert className="w-7 h-7" />
            </div>
            Grounding Assessment
          </h4>
          <div className="space-y-10">
            {analysisResults.insights.map((insight, i) => (
              <div key={i} className="p-10 rounded-[3rem] border bg-slate-900/60 border-white/5 flex items-start gap-8 hover:border-teal-500/30 transition-all shadow-xl group/item">
                <div className="w-5 h-5 rounded-full mt-2.5 bg-teal-500 shadow-[0_0_20px_rgba(45,212,191,0.6)] shrink-0 group-hover/item:scale-125 transition-transform" />
                <div>
                  <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-teal-400 mb-3">{insight.title}</span>
                  <p className="text-lg font-semibold text-slate-300 leading-relaxed italic">{insight.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="glass-card p-16 rounded-[4.5rem] border border-white/5 flex flex-col shadow-2xl relative overflow-hidden group">
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
          <h4 className="font-black text-white mb-12 flex items-center gap-6 uppercase tracking-tighter text-xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 shadow-2xl">
              <TrendingUp className="w-7 h-7" />
            </div>
            Strategic Directives
          </h4>
          <div className="space-y-10 flex-1">
            {analysisResults.recommendations.map((rec, i) => (
              <div key={i} className="p-12 bg-slate-900/80 rounded-[3.5rem] border border-white/10 relative hover:-translate-y-2 transition-transform shadow-2xl group/card">
                 <div className="absolute -top-5 left-12 px-6 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl group-hover/card:bg-indigo-500 transition-colors">{rec.impact || 'HIGH IMPACT'}</div>
                 <h5 className="text-xl font-black text-white mb-4 tracking-tight group-hover/card:text-indigo-400 transition-colors">{rec.title}</h5>
                 <p className="text-base text-slate-400 leading-relaxed font-semibold italic">{rec.detail}</p>
              </div>
            ))}
          </div>
          <button className="mt-16 w-full py-7 bg-teal-500 text-slate-950 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-teal-400 transition-all active:scale-95 flex items-center justify-center gap-4">
             <Download className="w-5 h-5" /> Export Strategic Integrity PDF
          </button>
        </div>
      </div>
    </div>
  );
};
