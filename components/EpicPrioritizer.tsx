
import React, { useState } from 'react';
import { ProjectContext, EpicStory } from '../types';
import { COMPLIANCE_OPTIONS } from '../constants';
import { getPrioritizedBacklog } from '../services/geminiService';
import { FileUp, ListTodo, Target, ShieldCheck, ExternalLink, Calculator, Layers, ArrowRight, Check } from 'lucide-react';

interface Props {
  project: ProjectContext;
}

enum Step {
  CONTEXT,
  MARKET,
  ANALYSIS,
  RESULTS
}

export const EpicPrioritizer: React.FC<Props> = ({ project }) => {
  const [step, setStep] = useState<Step>(Step.CONTEXT);
  const [marketInfo, setMarketInfo] = useState({
    isInternal: true,
    competitors: ['', '', ''],
    compliance: [] as string[]
  });
  const [method, setMethod] = useState<'RICE' | 'MoSCoW'>('MoSCoW');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const toggleCompliance = (id: string) => {
    setMarketInfo(prev => ({
      ...prev,
      compliance: prev.compliance.includes(id) 
        ? prev.compliance.filter(i => i !== id)
        : [...prev.compliance, id]
    }));
  };

  const handleRunPrioritization = async () => {
    setLoading(true);
    try {
      const mockStories: EpicStory[] = [
        { id: 'EPIC-1', title: 'User Authentication System', type: 'Epic', description: 'Enable secure login/logout and SSO' },
        { id: 'EPIC-2', title: 'Analytics Dashboard', type: 'Epic', description: 'Visualize real-time user data' },
        { id: 'EPIC-3', title: 'Payment Integration', type: 'Epic', description: 'Integrate Stripe and PayPal for checkout' },
        { id: 'STORY-4', title: 'Password Reset Flow', type: 'Story', description: 'Users should be able to reset forgotten passwords' },
        { id: 'STORY-5', title: 'Export to CSV', type: 'Story', description: 'Download analytics data locally' }
      ];

      const prioritized = await getPrioritizedBacklog(project, mockStories, method, JSON.stringify(marketInfo));
      setResults(prioritized);
      setStep(Step.RESULTS);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case Step.CONTEXT:
        return (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="glass-card p-12 rounded-[2.5rem] shadow-2xl border border-gray-100">
              <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-4 tracking-tight">
                <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                  <Target className="w-7 h-7" />
                </div>
                Context Alignment
              </h2>
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Product Domain</label>
                  <select className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-white text-gray-900 font-bold focus:border-emerald-500 focus:ring-0 outline-none appearance-none cursor-pointer shadow-sm">
                    <option className="text-gray-900 font-bold">FinTech</option>
                    <option className="text-gray-900 font-bold">HealthTech</option>
                    <option className="text-gray-900 font-bold">EdTech</option>
                    <option className="text-gray-900 font-bold">E-commerce</option>
                    <option className="text-gray-900 font-bold">Enterprise B2B</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Business Goal</label>
                  <textarea rows={2} className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-white text-gray-900 font-bold focus:border-emerald-500 focus:ring-0 outline-none shadow-sm placeholder:text-slate-300 resize-none" placeholder="e.g. Increase user retention by 20% in Q3" />
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Key Challenges</label>
                    <textarea rows={3} className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-white text-gray-900 font-bold focus:border-emerald-500 focus:ring-0 outline-none shadow-sm placeholder:text-slate-300 resize-none" placeholder="List top bottlenecks..." />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Expected Outcomes</label>
                    <textarea rows={3} className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-white text-gray-900 font-bold focus:border-emerald-500 focus:ring-0 outline-none shadow-sm placeholder:text-slate-300 resize-none" placeholder="What does success look like?" />
                  </div>
                </div>
                <button 
                  onClick={() => setStep(Step.MARKET)}
                  className="w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 mt-4"
                >
                  Define Market Relevance <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        );

      case Step.MARKET:
        return (
          <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-right duration-500">
            <div className="glass-card p-12 rounded-[2.5rem] shadow-2xl border border-gray-100">
              <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-4 tracking-tight">
                <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                Market Guardrails
              </h2>
              
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Product Placement</label>
                  <div className="flex gap-6">
                    <button 
                      onClick={() => setMarketInfo({...marketInfo, isInternal: true})}
                      className={`flex-1 py-5 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${marketInfo.isInternal ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-inner' : 'border-slate-50 text-slate-400 bg-slate-50/50'}`}
                    >
                      Internal Product
                    </button>
                    <button 
                      onClick={() => setMarketInfo({...marketInfo, isInternal: false})}
                      className={`flex-1 py-5 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${!marketInfo.isInternal ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-inner' : 'border-slate-50 text-slate-400 bg-slate-50/50'}`}
                    >
                      Market Facing
                    </button>
                  </div>
                </div>

                {!marketInfo.isInternal && (
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Competitor Reference URLs (Max 3)</label>
                    <div className="space-y-3">
                      {marketInfo.competitors.map((c, i) => (
                        <div key={i} className="relative group">
                          <input 
                            type="text" 
                            className="w-full pl-12 pr-5 py-4 rounded-2xl border-2 border-slate-100 bg-white text-gray-900 font-bold focus:border-emerald-500 focus:ring-0 outline-none shadow-sm transition-all" 
                            placeholder="https://competitor.com"
                            value={c}
                            onChange={e => {
                              const newC = [...marketInfo.competitors];
                              newC[i] = e.target.value;
                              setMarketInfo({...marketInfo, competitors: newC});
                            }}
                          />
                          <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Compliance Requirements</label>
                  <div className="grid grid-cols-2 gap-4">
                    {COMPLIANCE_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => toggleCompliance(opt.id)}
                        className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${marketInfo.compliance.includes(opt.id) ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-black shadow-sm' : 'border-slate-50 text-slate-500 bg-white hover:border-emerald-100'}`}
                      >
                        <div className={`p-2 rounded-lg ${marketInfo.compliance.includes(opt.id) ? 'bg-emerald-200' : 'bg-slate-50'}`}>
                          {opt.icon}
                        </div>
                        <span className="text-xs uppercase tracking-widest font-bold">{opt.name}</span>
                        {marketInfo.compliance.includes(opt.id) && <Check className="w-5 h-5 ml-auto text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setStep(Step.ANALYSIS)}
                  className="w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-700 shadow-xl mt-6"
                >
                  Configure Engine <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        );

      case Step.ANALYSIS:
        return (
          <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right duration-500">
            <div className="glass-card p-12 rounded-[3rem] shadow-2xl border border-gray-100">
              <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight text-center">Backlog Import</h2>
              <p className="text-gray-400 text-center font-medium mb-10 italic">Analyze strategy using MoSCoW or RICE Scoring</p>
              
              <div className="space-y-8">
                <div className="border-2 border-dashed border-slate-200 rounded-[2.5rem] py-16 flex flex-col items-center justify-center bg-white hover:bg-emerald-50/20 transition-all cursor-pointer group shadow-inner">
                  <FileUp className="w-16 h-16 text-slate-200 mb-4 group-hover:scale-110 group-hover:text-emerald-500 transition-all" />
                  <p className="font-black text-gray-900 uppercase tracking-widest text-xs">Drop JIRA Export CSV/JSON</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Maximum 500 items for deep analysis</p>
                </div>

                <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 text-center">Prioritization Framework</label>
                  <div className="grid grid-cols-2 gap-6">
                    <button 
                      onClick={() => setMethod('MoSCoW')}
                      className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${method === 'MoSCoW' ? 'border-emerald-600 bg-white shadow-xl scale-105' : 'border-transparent bg-slate-100/50'}`}
                    >
                      <Layers className={`w-10 h-10 ${method === 'MoSCoW' ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${method === 'MoSCoW' ? 'text-gray-900' : 'text-slate-400'}`}>MoSCoW Model</span>
                    </button>
                    <button 
                      onClick={() => setMethod('RICE')}
                      className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${method === 'RICE' ? 'border-emerald-600 bg-white shadow-xl scale-105' : 'border-transparent bg-slate-100/50'}`}
                    >
                      <Calculator className={`w-10 h-10 ${method === 'RICE' ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${method === 'RICE' ? 'text-gray-900' : 'text-slate-400'}`}>RICE Scoring</span>
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleRunPrioritization}
                  disabled={loading}
                  className="w-full bg-gray-900 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-black transition-all shadow-2xl disabled:opacity-50"
                >
                  {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Calculator className="w-5 h-5" />}
                  Execute Strategic Engine
                </button>
              </div>
            </div>
          </div>
        );

      case Step.RESULTS:
        return (
          <div className="space-y-10 animate-in zoom-in-95 duration-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">Strategic Backlog Ranking</h2>
                <p className="text-sm text-gray-400 font-medium mt-1 uppercase tracking-widest">Model: <span className="text-emerald-600 font-black">{method} Framework</span></p>
              </div>
              <button onClick={() => setStep(Step.ANALYSIS)} className="px-8 py-3 bg-white border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-500 hover:bg-slate-50 transition-all shadow-sm">Adjust Parameters</button>
            </div>

            <div className="grid gap-6">
              {results.map((res, i) => (
                <div key={i} className="glass-card p-8 rounded-[2rem] border-2 border-slate-50 flex items-center justify-between hover:shadow-2xl hover:border-emerald-100 transition-all group">
                  <div className="flex gap-8 items-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm ${method === 'MoSCoW' ? 
                      (res.bucket?.startsWith('Must') ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-blue-600 border border-blue-100') :
                      'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                      {i + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg uppercase tracking-[0.2em]">{res.id}</span>
                        <h4 className="font-black text-gray-900 text-lg tracking-tight group-hover:text-emerald-700 transition-colors leading-none">{res.title || 'Untitled Requirement'}</h4>
                      </div>
                      <p className="text-sm text-gray-500 font-medium line-clamp-2 max-w-2xl italic leading-relaxed">{res.reasoning || res.description || 'Strategic prioritization mapping applied based on current market demands and compliance guardrails.'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-12">
                    {method === 'MoSCoW' ? (
                      <div className={`px-5 py-2.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-sm ${
                        res.bucket === 'Must-Have' ? 'bg-rose-600 text-white' : 
                        res.bucket === 'Should-Have' ? 'bg-blue-600 text-white' : 
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {res.bucket}
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">RICE Score</p>
                        <p className="text-4xl font-black text-emerald-600 leading-none tabular-nums">{res.score}</p>
                      </div>
                    )}
                    <button className="p-3 bg-slate-50 rounded-xl text-slate-300 hover:text-gray-900 hover:bg-slate-100 transition-all shadow-inner">
                      <ExternalLink className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-[70vh]">
      {renderStep()}
    </div>
  );
};
