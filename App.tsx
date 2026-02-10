
import React, { useState, useEffect } from 'react';
import { ProjectContext, ToolType } from './types';
import { TOOL_CARDS } from './constants';
import { ProjectSetup } from './components/ProjectSetup';
import { Layout } from './components/Layout';
import { SEOAnalyzer } from './components/SEOAnalyzer';
import { GA4Analytics } from './components/GA4Analytics';
import { EpicPrioritizer } from './components/EpicPrioritizer';
import { Auth } from './components/Auth';
import { ProjectSelector } from './components/ProjectSelector';
import { ChevronLeft, LogOut, MessageSquare, FileText, Sparkles, ArrowRight, CloudSync } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectContext[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectContext | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [authNotification, setAuthNotification] = useState<string | null>(null);

  // Load persistence and handle OAuth callback
  useEffect(() => {
    const savedProjects = localStorage.getItem('pp_workspaces');
    if (savedProjects) setProjects(JSON.parse(savedProjects));
    
    const savedUser = localStorage.getItem('pp_user');
    if (savedUser) setUser(savedUser);

    // Check for OAuth status in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      setAuthNotification('Google Analytics connected successfully.');
      setActiveTool(ToolType.GA4_KPI);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('auth') === 'error') {
      setAuthNotification('Failed to connect Google Analytics. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('pp_workspaces', JSON.stringify(projects));
    }
  }, [projects]);

  const handleLogin = (userEmail: string) => {
    setUser(userEmail);
    localStorage.setItem('pp_user', userEmail);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveProject(null);
    setActiveTool(null);
    localStorage.removeItem('pp_user');
  };

  const handleCreateProject = (newProject: ProjectContext) => {
    const updated = [newProject, ...projects];
    setProjects(updated);
    setActiveProject(newProject);
    setShowSetup(false);
  };

  const renderContent = () => {
    if (!user) return <Auth onLogin={handleLogin} />;

    if (showSetup || (projects.length === 0 && !activeProject)) {
      return (
        <div className="space-y-4">
          {projects.length > 0 && (
            <button
              onClick={() => setShowSetup(false)}
              className="flex items-center gap-2 text-[10px] font-black text-teal-500 hover:text-teal-300 transition-colors uppercase tracking-widest ml-6 pt-6"
            >
              <ChevronLeft className="w-4 h-4" /> Abort Configuration
            </button>
          )}
          <ProjectSetup onComplete={handleCreateProject} />
        </div>
      );
    }

    if (!activeProject) {
      return (
        <ProjectSelector 
          projects={projects} 
          onSelect={setActiveProject} 
          onCreateNew={() => setShowSetup(true)} 
        />
      );
    }

    return (
      <div className="space-y-8">
        {authNotification && (
          <div className="glass-card px-8 py-4 rounded-2xl border border-teal-500/30 bg-teal-500/10 flex items-center justify-between animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-3">
              <CloudSync className="w-5 h-5 text-teal-400" />
              <span className="text-xs font-black text-teal-200 uppercase tracking-widest">{authNotification}</span>
            </div>
            <button onClick={() => setAuthNotification(null)} className="text-teal-400 hover:text-white font-black text-xs uppercase tracking-widest">Dismiss</button>
          </div>
        )}

        <div className="flex items-center justify-between glass-card px-8 py-4 rounded-[2rem] border border-white/5 shadow-2xl">
          <button
            onClick={() => {
              if (activeTool) setActiveTool(null);
              else setActiveProject(null);
            }}
            className="flex items-center gap-3 text-xs font-black text-slate-400 hover:text-teal-400 transition-colors uppercase tracking-[0.2em]"
          >
            <ChevronLeft className="w-5 h-5" /> {activeTool ? 'Return to Center' : 'De-select Workspace'}
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-teal-500 uppercase tracking-widest">Active Operator</span>
              <span className="text-xs font-black text-slate-200 uppercase tracking-widest">{user}</span>
            </div>
            <div className="h-8 w-px bg-white/10 mx-2"></div>
            <button
              onClick={handleLogout}
              className="p-3 bg-slate-800 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-xl border border-white/5"
              title="Terminate Session"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {!activeTool ? (
            <div className="grid lg:grid-cols-2 gap-10 max-w-6xl mx-auto px-4">
              {TOOL_CARDS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id as ToolType)}
                  className="group flex flex-col text-left p-12 glass-card rounded-[4rem] border-2 border-white/5 shadow-2xl transition-all hover:shadow-[0_40px_100px_-30px_rgba(45,212,191,0.2)] hover:-translate-y-3 relative overflow-hidden"
                >
                  <div className="absolute -right-12 -top-12 w-48 h-48 bg-teal-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
                  <div className="mb-8 p-6 bg-slate-800 rounded-3xl shadow-2xl border border-white/5 group-hover:bg-teal-500 group-hover:text-slate-900 transition-all w-fit relative z-10">
                    {tool.icon}
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-3xl font-black text-white mb-4 leading-tight group-hover:text-teal-400 transition-colors tracking-tight">{tool.title}</h3>
                    <p className="text-slate-400 font-semibold mb-10 leading-relaxed text-base group-hover:text-slate-300 transition-colors">{tool.description}</p>
                    <div className="mt-auto flex items-center gap-4 text-xs font-black text-teal-500 uppercase tracking-[0.2em] group-hover:gap-6 transition-all">
                      Initialize Protocol <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <>
              {activeTool === ToolType.SEO_Lighthouse && <SEOAnalyzer />}
              {activeTool === ToolType.GA4_KPI && <GA4Analytics project={activeProject} />}
              {activeTool === ToolType.EPIC_PRIORITY && <EpicPrioritizer project={activeProject} />}
              {activeTool === ToolType.SENTIMENT_ANALYSIS && (
                <div className="p-20 glass-card rounded-[4rem] text-center space-y-8 border border-white/5 shadow-2xl">
                  <h2 className="text-5xl font-black text-white tracking-tighter">Semantic Pulse Engine</h2>
                  <p className="text-slate-400 font-semibold max-w-xl mx-auto text-lg">Initialize multi-modal sentiment protocols to extract psychological markers.</p>
                </div>
              )}
              {activeTool === ToolType.RELEASE_REPORTING && (
                <div className="p-20 glass-card rounded-[4rem] text-center space-y-8 border border-white/5 shadow-2xl">
                  <h2 className="text-5xl font-black text-white tracking-tighter">Release Architect AI</h2>
                  <p className="text-slate-400 font-semibold max-w-xl mx-auto text-lg">Synthesize release notes and stakeholder communications from Git logs.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout projectName={activeProject?.name}>
      {renderContent()}
    </Layout>
  );
};

export default App;
