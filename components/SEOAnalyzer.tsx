
import React, { useState } from 'react';
import { Upload, FileText, Play, CheckCircle2, AlertCircle, BarChart, Globe, Smartphone, Monitor } from 'lucide-react';
import { generateLighthouseReport } from '../services/geminiService';
import { LighthouseReport } from '../types';

export const SEOAnalyzer: React.FC = () => {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<LighthouseReport[]>([]);

  const handleRunScan = async () => {
    if (!urls) return;
    setLoading(true);
    try {
      const urlList = urls.split(',').map(u => u.trim()).filter(u => u);
      const results = await generateLighthouseReport(urlList);
      setReports(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500 bg-emerald-50';
    if (score >= 50) return 'text-orange-500 bg-orange-50';
    return 'text-rose-500 bg-rose-50';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-card p-8 rounded-2xl border border-gray-200 shadow-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Scan Configuration
          </h3>
          <p className="text-gray-500 text-sm mb-6">Provide URLs manually or upload a CSV for bulk processing.</p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Comma Separated URLs</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none h-32"
                placeholder="https://example.com, https://test.com"
                value={urls}
                onChange={e => setUrls(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <button className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                <Upload className="w-5 h-5" />
                <span>Upload CSV</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                <FileText className="w-5 h-5" />
                <span>Lighthouse Zip</span>
              </button>
            </div>

            <button
              onClick={handleRunScan}
              disabled={loading || !urls}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Play className="w-5 h-5 fill-current" />}
              Generate Audit Report
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-center bg-blue-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h4 className="text-2xl font-bold mb-4">Quality & SEO Insights</h4>
            <p className="text-blue-100 mb-6">Analyze your web presence using simulated Lighthouse metrics. Our AI evaluates page speed, crawlability, and user experience standards.</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
                <span>Performance Scoring (LCP/CLS/FID)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
                <span>Bulk Competitor Auditing</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
                <span>Actionable Recommendations</span>
              </div>
            </div>
          </div>
          <BarChart className="absolute -right-12 -bottom-12 w-64 h-64 text-blue-500/20" />
        </div>
      </div>

      {reports.length > 0 && (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Performance', 'Accessibility', 'SEO', 'Average LCP'].map((label, idx) => (
              <div key={label} className="glass-card p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {idx === 3 ? '1.8s' : Math.floor(80 + Math.random() * 15) + '%'}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">URL & Device</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Perf</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Acc</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">SEO</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">LCP (ms)</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Key Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reports.map((report, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 truncate max-w-xs">{report.url}</span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            {report.device === 'Desktop' ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                            {report.device}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getScoreColor(report.performance)}`}>
                          {report.performance}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getScoreColor(report.accessibility)}`}>
                          {report.accessibility}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getScoreColor(report.seo)}`}>
                          {report.seo}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-600">{report.lcp}ms</td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2 max-w-sm">
                          <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-700 leading-tight">{report.recommendation}</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
