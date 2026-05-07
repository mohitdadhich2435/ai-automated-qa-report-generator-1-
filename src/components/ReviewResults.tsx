/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { Sparkles, AlertCircle, CheckCircle2, Download, FileText, Globe, ShieldCheck, Activity, LayoutGrid, Share2, ClipboardCheck, Info, Gauge } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useRef, useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

interface ReviewResultsProps {
  results: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];

export default function ReviewResults({ results }: ReviewResultsProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Extract JSON data
  const { markdown, data } = useMemo(() => {
    const dataMatch = results.match(/<DATA>([\s\S]*?)<\/DATA>/);
    let jsonData = null;
    let cleanMarkdown = results;

    if (dataMatch) {
      try {
        jsonData = JSON.parse(dataMatch[1].trim());
        cleanMarkdown = results.replace(/<DATA>[\s\S]*?<\/DATA>/, '').trim();
      } catch (e) {
        console.error("Failed to parse visual data", e);
      }
    }

    return { markdown: cleanMarkdown, data: jsonData };
  }, [results]);

  const radarData = useMemo(() => {
    if (!data?.metrics) return [];
    return [
      { subject: 'UX', A: data.metrics.ux, fullMark: 100 },
      { subject: 'UI', A: data.metrics.ui, fullMark: 100 },
      { subject: 'Conversion', A: data.metrics.conversion, fullMark: 100 },
      { subject: 'Mobile', A: data.metrics.mobile, fullMark: 100 },
    ];
  }, [data]);

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    
    setIsDownloading(true);
    try {
      // Delay slightly to ensure fonts are rendered
      await new Promise(r => setTimeout(r, 500));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save('Final_Technical_QAAudit.pdf');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(markdown);
      setTimeout(() => setIsCopying(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full pb-20">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Professional Website Audit</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg hover:bg-slate-800 transition-all font-medium text-sm"
          >
            {isCopying ? (
              <>
                <ClipboardCheck className="w-4 h-4 text-emerald-500" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Share Text
              </>
            )}
          </button>
          
          <button
            onClick={downloadPDF}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all font-bold shadow-lg shadow-blue-900/40 disabled:opacity-50"
          >
            {isDownloading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Health Score */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-4"
          >
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="50" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
                <circle
                  cx="56" cy="56" r="50" fill="transparent" stroke="currentColor" strokeWidth="8"
                  strokeDasharray={314}
                  strokeDashoffset={314 - (314 * data.healthScore) / 100}
                  strokeLinecap="round"
                  className={data.healthScore > 80 ? 'text-emerald-500' : data.healthScore > 50 ? 'text-blue-500' : 'text-rose-500'}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-white">{data.healthScore}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Score</span>
              </div>
            </div>
          </motion.div>

          {/* Performance Radar */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 overflow-hidden"
          >
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Core Web Vitals
            </h4>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8 }} />
                  <Radar
                    name="Metrics"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Issue Categories */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 overflow-hidden"
          >
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <LayoutGrid className="w-3 h-3" /> Issue Categories
            </h4>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.chartData} innerRadius={25} outerRadius={40} paddingAngle={5} dataKey="value">
                    {data.chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Severity Bar */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 overflow-hidden"
          >
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" /> Severity Stats
            </h4>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.severityData}>
                  <XAxis dataKey="level" tick={{ fill: '#64748b', fontSize: 8 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    {data.severityData.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.level === 'Critical' ? '#ef4444' : entry.level === 'High' ? '#f59e0b' : '#3b82f6'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}

      <div 
        ref={reportRef}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900"
      >
        <div className="bg-slate-950 p-8 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl tracking-tight uppercase">Website QA Audit</h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Quality Assurance & Experience Report</p>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <div className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.3em] mb-1">Generated by Engine V3</div>
            <div className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase">Status: Official Release</div>
          </div>
        </div>

        <div className="p-10 lg:p-16 prose prose-slate max-w-none">
          <div className="markdown-body">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => (
                  <h1 {...props} className="text-3xl font-black text-slate-900 border-b-2 border-slate-100 pb-4 mb-8 uppercase tracking-tight" />
                ),
                h2: ({ node, ...props }) => (
                  <h2 {...props} className="text-lg font-black text-blue-600 mt-12 mb-6 uppercase tracking-[0.1em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    {props.children}
                  </h2>
                ),
                ul: ({ node, ...props }) => (
                  <ul {...props} className="list-none p-0 space-y-4" />
                ),
                li: ({ node, ...props }) => (
                  <li {...props} className="p-5 bg-slate-50/50 border border-slate-100 rounded-xl m-0" />
                ),
                p: ({ node, ...props }) => {
                  return <p {...props} className="text-base leading-relaxed text-slate-600 m-0" />;
                },
                strong: ({ node, ...props }) => {
                  const text = String(props.children);
                  const themes: Record<string, string> = {
                    'Issue': 'text-rose-600',
                    'Impact': 'text-amber-600',
                    'Recommendation': 'text-blue-600',
                    'Fix': 'text-emerald-600',
                  };
                  const colorClass = themes[text] || 'text-slate-900';
                  
                  return <strong {...props} className={`font-black uppercase tracking-tight ${colorClass} text-sm`} />;
                }
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>
        
        <div className="bg-slate-50 p-10 border-t border-slate-100 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 opacity-40">
              <Info className="w-4 h-4" />
              <p className="text-[10px] text-slate-500 font-bold tracking-[0.3em] uppercase">Confidential Analysis Methodology Applied</p>
            </div>
            <p className="text-[10px] text-slate-300 max-w-lg text-center leading-loose">This report utilizes AI-driven heuristic analysis and crawling technology. Metrics provided are estimations based on DOM structure and asset analysis. Always perform production-level validation before deployment.</p>
        </div>
      </div>
    </div>
  );
}
