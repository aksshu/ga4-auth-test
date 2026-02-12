
import React, { useState } from 'react';
import { ShieldCheck, Loader2, UserCheck, Edit3, Mail } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { UserRole } from '../types';

interface Props {
  onRoleSelect: (role: UserRole) => void;
}
// test
export const Auth: React.FC<Props> = ({ onRoleSelect }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      onRoleSelect(UserRole.EDITOR);
      setMessage('Access link sent to inbox.');
    } catch (err: any) {
      setMessage(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      onRoleSelect(UserRole.EDITOR);
    } catch (err: any) {
      setMessage(err.message || 'Guest protocol failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full glass-card rounded-[4rem] p-16 shadow-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
        
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-slate-800 rounded-[2.5rem] border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <UserCheck className="w-10 h-10 text-teal-400" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter mb-3">Protocol Initiation</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Accessing Strategic Vault</p>
        </div>

        <div className="space-y-8">
          <div className="p-8 rounded-[2rem] bg-teal-500/10 border-2 border-teal-500/20 text-center space-y-4">
             <div className="w-12 h-12 bg-slate-900 text-teal-400 rounded-xl flex items-center justify-center mx-auto shadow-xl">
               <Edit3 className="w-6 h-6" />
             </div>
             <div>
               <h4 className="text-white font-black uppercase text-xs tracking-widest">Editor Access Engaged</h4>
               <p className="text-[10px] text-teal-500/60 font-black uppercase tracking-widest mt-1">Full operational permissions granted</p>
             </div>
          </div>

          <button
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 py-6 px-8 bg-teal-500 text-slate-950 rounded-2xl hover:bg-teal-400 transition-all shadow-2xl shadow-teal-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            <span className="text-xs font-black uppercase tracking-widest">Initialize as Authorized Editor</span>
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[8px] uppercase font-black tracking-[0.4em] text-slate-700"><span className="bg-[#0F172A] px-4 italic text-slate-500 font-black">OR USE EMAIL GATEWAY</span></div>
          </div>

          <form onSubmit={handleMagicLink} className="space-y-4">
            <input
              type="email"
              required
              placeholder="Enterprise Email Address"
              className="w-full px-6 py-5 rounded-2xl border-2 border-slate-800 bg-slate-900/50 text-white font-bold text-xs placeholder:text-slate-700 focus:border-teal-500 outline-none transition-all shadow-inner"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all border border-white/5"
            >
              Request Strategic Access Link
            </button>
          </form>

          {message && (
            <p className="text-center text-[10px] font-black text-teal-400 uppercase tracking-widest animate-pulse">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
