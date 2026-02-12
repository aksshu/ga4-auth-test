import React, { useState, useEffect } from 'react';
import { 
  Database, Loader2, Key, CheckCircle, ShieldCheck, 
  ArrowRight, Globe, Check, AlertTriangle, 
  Activity, Settings, Lock, Search, HeartPulse, 
  Unlink, LogIn, RefreshCw, X, ShieldAlert, Zap,
  Layers, BarChart3, Calendar, Plus, ChevronDown, ChevronUp,
  Package, Info, Monitor, Smartphone, Briefcase, ShoppingCart,
  Target
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { databaseService } from '../../services/databaseService';
import { KPIFact, GA4MetricSelection } from '../../types';

interface Props {
  onComplete: (tenantId: string) => void;
  onCancel: () => void;
}

type ConnectorStep = 'auth' | 'properties' | 'metrics' | 'sync_config' | 'syncing' | 'summary';

const METRIC_CATEGORIES = {
  user_metrics: [
    { id: 'activeUsers', name: 'Active Users', desc: 'Number of unique users who visited.' },
    { id: 'newUsers', name: 'New Users', desc: 'Users who interacted with your site for the first time.' },
    { id: 'totalUsers', name: 'Total Users', desc: 'Distinct number of users who logged at least one event.' },
    { id: 'engagementRate', name: 'Engagement Rate', desc: 'Percentage of engaged sessions.' },
    { id: 'userEngagementDuration', name: 'Engagement Time', desc: 'Total time users spent in active session.' }
  ],
  session_metrics: [
    { id: 'sessions', name: 'Sessions', desc: 'Total number of sessions.' },
    { id: 'sessionsPerUser', name: 'Sessions per User', desc: 'Average number of sessions per user.' },
    { id: 'averageSessionDuration', name: 'Avg Duration', desc: 'Average length of a session.' },
    { id: 'bounceRate', name: 'Bounce Rate', desc: 'Percentage of non-engaged sessions.' }
  ],
  ecommerce_metrics: [
    { id: 'totalRevenue', name: 'Total Revenue', desc: 'Combined revenue from purchases, in-app purchases, and ads.' },
    { id: 'transactions', name: 'Transactions', desc: 'Number of completed purchase events.' },
    { id: 'itemsPurchased', name: 'Items Purchased', desc: 'Number of units sold.' },
    { id: 'averagePurchaseRevenue', name: 'Avg Ticket', desc: 'Average revenue per transaction.' }
  ],
  traffic_metrics: [
    { id: 'organicGoogleSearchClicks', name: 'Organic Clicks', desc: 'Clicks from Google Search results.' },
    { id: 'organicGoogleSearchImpressions', name: 'Impressions', desc: 'Appearances in Google Search results.' }
  ]
};

export const GA4DirectConnector: React.FC<Props> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<ConnectorStep>('auth');
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [expandedCats, setExpandedCats] = useState<string[]>(['user_metrics']);
  
  // REAL DATA - not mock
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');
  
  const [selectedMetrics, setSelectedMetrics] = useState<GA4MetricSelection>({
    user_metrics: ['activeUsers', 'engagementRate'],
    session_metrics: ['sessions'],
    event_metrics: [],
    ecommerce_metrics: [],
    page_metrics: [],
    traffic_metrics: []
  });

  const [dateRange, setDateRange] = useState(30);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, status: '' });
  const [syncSummary, setSyncSummary] = useState({ added: 0, updated: 0 });

  // Check for OAuth callback on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const storedEmail = sessionStorage.getItem('ga4_user_email');
    
    if (code && !sessionStorage.getItem('ga4_access_token')) {
      handleOAuthCallback(code);
    } else if (storedEmail) {
      setUserEmail(storedEmail);
    }
  }, []);

  // Fetch properties when step changes to 'properties'
  useEffect(() => {
    if (step === 'properties' && properties.length === 0) {
      fetchRealProperties();
    }
  }, [step]);

  // Handle OAuth callback
  const handleOAuthCallback = async (code: string) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();
      
      if (data.access_token) {
        // Store tokens securely
        sessionStorage.setItem('ga4_access_token', data.access_token);
        if (data.refresh_token) {
          sessionStorage.setItem('ga4_refresh_token', data.refresh_token);
        }
        if (data.user_email) {
          sessionStorage.setItem('ga4_user_email', data.user_email);
          setUserEmail(data.user_email);
        }
        
        // Clear the code from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Move to properties step
        setStep('properties');
      } else {
        throw new Error(data.error || 'Failed to get access token');
      }
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      setError(error.message || 'Authentication failed. Please try again.');
      setStep('auth');
    } finally {
      setLoading(false);
    }
  };

  // REAL OAuth - redirect to Google
  const handleAuth = () => {
    // Clear any existing tokens
    sessionStorage.removeItem('ga4_access_token');
    sessionStorage.removeItem('ga4_refresh_token');
    sessionStorage.removeItem('ga4_user_email');
    
    // Redirect to OAuth login endpoint
    window.location.href = '/api/auth/login';
  };

  // REAL API - Fetch properties from Google Analytics
  const fetchRealProperties = async () => {
    setIsLoadingProperties(true);
    setError('');
    
    try {
      const accessToken = sessionStorage.getItem('ga4_access_token');
      
      if (!accessToken) {
        throw new Error('Not authenticated. Please reconnect.');
      }

      const response = await fetch('/api/ga4/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const data = await response.json();
      
      if (data.properties && data.properties.length > 0) {
        setProperties(data.properties);
      } else {
        setError('No GA4 properties found. Make sure you have access to at least one GA4 property.');
      }
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      setError(error.message || 'Failed to fetch properties. Please try reconnecting.');
      
      // If token expired, go back to auth
      if (error.message.includes('401') || error.message.includes('token')) {
        sessionStorage.clear();
        setStep('auth');
      }
    } finally {
      setIsLoadingProperties(false);
    }
  };

  const applyPreset = (type: 'ecom' | 'saas' | 'marketing') => {
    if (type === 'ecom') {
      setSelectedMetrics({
        user_metrics: ['activeUsers', 'totalUsers'],
        session_metrics: ['sessions'],
        event_metrics: [],
        ecommerce_metrics: ['totalRevenue', 'transactions', 'itemsPurchased'],
        page_metrics: [],
        traffic_metrics: []
      });
    } else if (type === 'saas') {
      setSelectedMetrics({
        user_metrics: ['activeUsers', 'newUsers', 'engagementRate', 'userEngagementDuration'],
        session_metrics: ['sessions', 'bounceRate'],
        event_metrics: [],
        ecommerce_metrics: [],
        page_metrics: [],
        traffic_metrics: []
      });
    } else {
      setSelectedMetrics({
        user_metrics: ['activeUsers'],
        session_metrics: ['sessions'],
        event_metrics: [],
        ecommerce_metrics: ['totalRevenue'],
        page_metrics: [],
        traffic_metrics: ['organicGoogleSearchClicks', 'organicGoogleSearchImpressions']
      });
    }
  };

  const toggleMetric = (cat: keyof GA4MetricSelection, id: string) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [cat]: prev[cat].includes(id) 
        ? prev[cat].filter(x => x !== id) 
        : [...prev[cat], id]
    }));
  };

  // REAL API - Sync data from GA4
  const handleStartSync = async () => {
    setStep('syncing');
    setLoading(true);
    setError('');
    
    try {
      const totalDays = dateRange;
      setSyncProgress({ current: 0, total: totalDays, status: 'Initializing sync...' });
      
      const accessToken = sessionStorage.getItem('ga4_access_token');
      
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Calculate date range
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      const startDateStr = startDate.toISOString().split('T')[0];

      // Prepare metrics for GA4 API
      const allMetrics = Object.values(selectedMetrics).flat();
      
      if (allMetrics.length === 0) {
        throw new Error('No metrics selected');
      }

      setSyncProgress(prev => ({ ...prev, status: 'Fetching data from GA4...' }));

      // Call API to fetch GA4 data
      const response = await fetch('/api/ga4/fetch-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          propertyId: selectedProperty.propertyId,
          startDate: startDateStr,
          endDate: endDate,
          metrics: allMetrics
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch GA4 data');
      }

      const { data: ga4Data } = await response.json();
      
      if (!ga4Data || ga4Data.length === 0) {
        throw new Error('No data returned from GA4 for the selected date range');
      }

      let added = 0;
      let updated = 0;

      setSyncProgress(prev => ({ 
        ...prev, 
        total: ga4Data.length,
        status: 'Syncing to database...' 
      }));

      // Store each day's data in Supabase
      for (let i = 0; i < ga4Data.length; i++) {
        const record = {
          tenant_id: tenantId,
          site_id: siteId || 'main',
          source: 'ga4',
          source_id: selectedProperty.propertyId,
          kpi_date: ga4Data[i].kpi_date,
          kpis: ga4Data[i].kpis
        };

        const { data: existing } = await supabase
          .from('kpi_daily_facts')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('site_id', record.site_id)
          .eq('source', 'ga4')
          .eq('kpi_date', record.kpi_date)
          .maybeSingle();

        const { error: upsertError } = await supabase
          .from('kpi_daily_facts')
          .upsert(record);
        
        if (upsertError) {
          console.error('Error upserting record:', upsertError);
        }
        
        if (existing) {
          updated++;
        } else {
          added++;
        }

        // Update progress
        if (i % 5 === 0 || i === ga4Data.length - 1) {
          setSyncProgress({ 
            current: i + 1, 
            total: ga4Data.length,
            status: `Syncing... (${i + 1}/${ga4Data.length} days)` 
          });
        }

        // Small delay to show progress
        await new Promise(r => setTimeout(r, 30));
      }

      // Save GA4 settings to Supabase
      await databaseService.saveGA4Settings({
        property_id: selectedProperty.propertyId,
        property_name: selectedProperty.propertyName,
        account_id: selectedProperty.accountId || selectedProperty.propertyId,
        account_name: selectedProperty.accountName || 'Unknown',
        selected_metrics: selectedMetrics,
        sync_schedule: 'Daily at 12:00 AM'
      });

      setSyncSummary({ added, updated });
      setStep('summary');
    } catch (err: any) {
      console.error('Sync error:', err);
      setError(err.message || 'Sync failed. Please try again.');
      alert(`Sync failed: ${err.message}`);
      setStep('sync_config');
    } finally {
      setLoading(false);
    }
  };

  const filteredProps = properties.filter(p => 
    p.propertyName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.propertyId?.includes(searchTerm)
  );

  const totalSelected = Object.values(selectedMetrics).flat().length;

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-3xl w-full glass-card rounded-[4rem] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        
        {/* Progress Header */}
        <div className="p-8 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-blue-500 rounded-2xl text-white shadow-lg">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">GA4 Protocol Node</h2>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 italic">Authorized Strategic Interface</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-3 text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-8 mt-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-400">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex-1 p-12 min-h-[500px]">
          {step === 'auth' && (
            <div className="max-w-md mx-auto text-center space-y-10 animate-in fade-in duration-500 py-10">
              <div className="w-24 h-24 bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto border border-white/10 shadow-2xl relative">
                <Lock className="w-10 h-10 text-blue-400" />
                <div className="absolute -right-2 -bottom-2 bg-blue-600 p-2 rounded-xl"><Key className="w-4 h-4 text-white" /></div>
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Connect Analytics</h3>
                <p className="text-slate-400 font-medium leading-relaxed">
                  Establish a secure bidirectional tunnel to retrieve industry-standard telemetry directly from Google Cloud nodes.
                </p>
              </div>
              <button 
                onClick={handleAuth} 
                disabled={loading}
                className="w-full py-6 bg-white text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-blue-50 transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Connecting...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" /> Sign In with Google Protocol
                  </>
                )}
              </button>
              <div className="grid grid-cols-2 gap-4 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                <span className="flex items-center gap-2 justify-center"><CheckCircle className="w-3 h-3 text-emerald-500" /> Real-time Ingestion</span>
                <span className="flex items-center gap-2 justify-center"><CheckCircle className="w-3 h-3 text-emerald-500" /> Automated Syncs</span>
              </div>
            </div>
          )}

          {step === 'properties' && (
            <div className="space-y-8 animate-in slide-in-from-right duration-500">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Identify Strategic Property</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Connected as: <span className="text-blue-400">{userEmail || 'Loading...'}</span>
                </p>
              </div>
              
              {isLoadingProperties ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                  <span className="text-slate-400 font-medium">Fetching your GA4 properties...</span>
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">No Properties Found</p>
                    <p className="text-sm text-slate-400 mt-2">Make sure you have access to at least one GA4 property</p>
                  </div>
                  <button 
                    onClick={fetchRealProperties}
                    className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-400 transition-all flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" /> Try Again
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                    <input 
                      className="w-full pl-16 pr-6 py-5 bg-slate-900 border-2 border-slate-800 rounded-3xl text-white font-bold outline-none focus:border-blue-500 transition-all shadow-inner"
                      placeholder="Filter by Property Name or ID..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto pr-4 space-y-4 scrollbar-hide">
                    {filteredProps.length === 0 ? (
                      <div className="text-center py-10 text-slate-500">
                        <p className="font-bold">No properties match your search</p>
                      </div>
                    ) : (
                      filteredProps.map(p => (
                        <button 
                          key={p.propertyId}
                          onClick={() => setSelectedProperty(p)}
                          className={`w-full p-6 rounded-[2rem] border-2 text-left transition-all group ${
                            selectedProperty?.propertyId === p.propertyId 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-xl' 
                            : 'bg-slate-900 border-white/5 text-slate-400 hover:border-blue-500/50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className={`font-black text-lg tracking-tight ${selectedProperty?.propertyId === p.propertyId ? 'text-white' : 'text-white group-hover:text-blue-400'}`}>
                                {p.propertyName}
                              </p>
                              <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${selectedProperty?.propertyId === p.propertyId ? 'text-blue-200' : 'text-slate-600'}`}>
                                ID: {p.propertyId} • {p.accountName}
                              </p>
                            </div>
                            {selectedProperty?.propertyId === p.propertyId && <CheckCircle className="w-6 h-6 text-white" />}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
              
              <div className="flex gap-4 pt-4">
                <button onClick={() => setStep('auth')} className="px-8 py-5 bg-slate-800 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white border border-white/5">Back</button>
                <button 
                  disabled={!selectedProperty}
                  onClick={() => setStep('metrics')}
                  className="flex-1 py-5 bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-400 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                >
                  Continue to Metric Mapping <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 'metrics' && (
            <div className="space-y-10 animate-in slide-in-from-right duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Metric Mapping</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Property: <span className="text-blue-400">{selectedProperty.propertyName}</span></p>
                </div>
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${totalSelected > 10 ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                   {totalSelected} Metrics Defined
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-8">
                <button onClick={() => applyPreset('ecom')} className="px-5 py-2.5 bg-slate-800 hover:bg-blue-500 text-slate-300 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center gap-2"><ShoppingCart className="w-3.5 h-3.5" /> E-commerce</button>
                <button onClick={() => applyPreset('saas')} className="px-5 py-2.5 bg-slate-800 hover:bg-blue-500 text-slate-300 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" /> SaaS Ecosystem</button>
                <button onClick={() => applyPreset('marketing')} className="px-5 py-2.5 bg-slate-800 hover:bg-blue-500 text-slate-300 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center gap-2"><Target className="w-3.5 h-3.5" /> Growth Marketing</button>
              </div>

              <div className="space-y-6 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
                {Object.entries(METRIC_CATEGORIES).map(([catKey, metrics]) => (
                  <div key={catKey} className="glass-card rounded-3xl border border-white/5 overflow-hidden">
                    <button 
                      onClick={() => setExpandedCats(prev => prev.includes(catKey) ? prev.filter(c => c !== catKey) : [...prev, catKey])}
                      className="w-full px-8 py-5 flex items-center justify-between bg-slate-900/50 hover:bg-slate-900 transition-colors"
                    >
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{catKey.replace('_', ' ')}</span>
                      {expandedCats.includes(catKey) ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                    </button>
                    {expandedCats.includes(catKey) && (
                      <div className="p-8 grid sm:grid-cols-2 gap-4">
                        {metrics.map(m => (
                          <button 
                            key={m.id}
                            onClick={() => toggleMetric(catKey as any, m.id)}
                            className={`p-4 rounded-2xl border text-left transition-all relative ${
                              selectedMetrics[catKey as keyof GA4MetricSelection].includes(m.id)
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/20'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                               <p className="text-xs font-black uppercase tracking-tight">{m.name}</p>
                               {selectedMetrics[catKey as keyof GA4MetricSelection].includes(m.id) && <Check className="w-4 h-4" />}
                            </div>
                            <p className={`text-[8px] font-bold leading-relaxed ${selectedMetrics[catKey as keyof GA4MetricSelection].includes(m.id) ? 'text-blue-100' : 'text-slate-600'}`}>{m.desc}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-6">
                <button onClick={() => setStep('properties')} className="px-8 py-5 bg-slate-800 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white border border-white/5">Back</button>
                <button 
                  disabled={totalSelected === 0}
                  onClick={() => setStep('sync_config')}
                  className="flex-1 py-5 bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-400 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                >
                  Configure Sync Settings <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 'sync_config' && (
            <div className="space-y-12 animate-in slide-in-from-right duration-500 py-6">
               <div className="text-center space-y-4">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Sync Configuration</h3>
                  <p className="text-slate-400 font-medium max-w-sm mx-auto">Define the ingestion parameters for your strategic project dashboard.</p>
               </div>

               <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Strategic Tenant ID</label>
                       <input 
                         className="w-full px-6 py-4 bg-slate-900 border-2 border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all"
                         placeholder="e.g. Acme_Corp_Global"
                         value={tenantId}
                         onChange={e => setTenantId(e.target.value)}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Site ID (Optional)</label>
                       <input 
                         className="w-full px-6 py-4 bg-slate-900 border-2 border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all"
                         placeholder="e.g. main, app, web"
                         value={siteId}
                         onChange={e => setSiteId(e.target.value)}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Historical Range</label>
                       <div className="grid grid-cols-3 gap-2">
                          {[7, 30, 90].map(d => (
                            <button key={d} onClick={() => setDateRange(d)} className={`py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${dateRange === d ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-white/5 text-slate-600 hover:border-white/10'}`}>{d} Days</button>
                          ))}
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6 p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><Package className="w-5 h-5" /></div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Protocol Summary</h4>
                     </div>
                     <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">Property: <span className="text-white">{selectedProperty.propertyName}</span></p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">Active Metrics: <span className="text-blue-400">{totalSelected} Channels</span></p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">Temporal Scale: <span className="text-white">{dateRange} Day History</span></p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">Schedule: <span className="text-emerald-400 italic">Daily Automated Sync</span></p>
                     </div>
                  </div>
               </div>

               <div className="flex gap-4 pt-10">
                <button onClick={() => setStep('metrics')} className="px-8 py-5 bg-slate-800 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white border border-white/5">Back</button>
                <button 
                  disabled={!tenantId || loading}
                  onClick={handleStartSync}
                  className="flex-1 py-6 bg-blue-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 hover:bg-blue-400 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" /> Initialize Project Sync
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'syncing' && (
            <div className="py-24 flex flex-col items-center justify-center space-y-12 animate-in zoom-in-95 duration-500">
               <div className="relative">
                 <div className="w-32 h-32 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                 <Activity className="absolute inset-0 m-auto w-10 h-10 text-blue-400 animate-pulse" />
               </div>
               <div className="text-center space-y-8 w-full max-w-sm">
                 <div className="space-y-2">
                    <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Strategic Ingestion</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] animate-pulse">Syncing encrypted data packets...</p>
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                       <span>{syncProgress.status}</span>
                       <span className="text-blue-400">{syncProgress.total > 0 ? Math.round((syncProgress.current / syncProgress.total) * 100) : 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                       <div 
                         className="h-full bg-blue-500 shadow-[0_0_20px_#3b82f6] transition-all duration-300 ease-out" 
                         style={{ width: `${syncProgress.total > 0 ? (syncProgress.current / syncProgress.total) * 100 : 0}%` }}
                       />
                    </div>
                 </div>
               </div>
            </div>
          )}

          {step === 'summary' && (
            <div className="py-12 space-y-12 animate-in fade-in duration-700 text-center">
              <div className="space-y-4">
                 <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl text-emerald-400 rotate-6 hover:rotate-0 transition-transform duration-500">
                   <ShieldCheck className="w-12 h-12" />
                 </div>
                 <h3 className="text-4xl font-black text-white uppercase tracking-tight">Sync Complete</h3>
                 <p className="text-slate-400 font-medium max-w-md mx-auto italic">
                   Successfully established the strategic grounding bridge for <span className="text-blue-400 font-black">{selectedProperty.propertyName}</span>.
                 </p>
              </div>

              <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto">
                <div className="glass-card p-10 rounded-[2.5rem] border border-emerald-500/10 bg-emerald-500/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Datapoints</p>
                  <p className="text-5xl font-black text-emerald-400 tabular-nums">{syncSummary.added + syncSummary.updated}</p>
                  <p className="text-[8px] text-slate-600 font-bold uppercase mt-3 tracking-widest">Ingested Snapshots</p>
                </div>
                <div className="glass-card p-10 rounded-[2.5rem] border border-blue-500/10 bg-blue-500/5">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tracked Metrics</p>
                   <p className="text-5xl font-black text-blue-400 tabular-nums">{totalSelected}</p>
                   <p className="text-[8px] text-slate-600 font-bold uppercase mt-3 tracking-widest">Active Channels</p>
                </div>
              </div>

              <div className="p-8 bg-slate-900 border border-white/5 rounded-[2.5rem] flex items-center justify-center gap-6 max-w-lg mx-auto">
                <Activity className="w-6 h-6 text-teal-400" />
                <div className="text-left">
                   <p className="text-xs font-black text-white uppercase tracking-widest">Consistency Integrity: 100%</p>
                   <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Automated Daily Synchronization Enabled</p>
                </div>
              </div>

              <button 
                onClick={() => onComplete(tenantId)}
                className="w-full max-w-md py-6 bg-emerald-500 text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all mx-auto flex items-center justify-center gap-4"
              >
                Enter Command Dashboard <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Strategic Footer */}
        <div className="p-6 bg-slate-950 border-t border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-700">
          <div className="flex items-center gap-6">
             <span className="flex items-center gap-2"><ShieldAlert className="w-3.5 h-3.5" /> High-Entropy Security</span>
             <span className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> OAuth 2.0 Identity Verified</span>
          </div>
          <span className="text-blue-500/50 italic">ProductPulse Strategic Sync Engine v2.4</span>
        </div>
      </div>
    </div>
  );
};
