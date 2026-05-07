/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Flame,
  LayoutGrid,
  Zap,
  Globe,
  Search,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Plus,
  Trash2,
  FileImage,
  ImageIcon
} from 'lucide-react';
import { analyzeWebsite } from './services/geminiService';
import ReviewResults from './components/ReviewResults';
import axios from 'axios';

export default function App() {
  const [url, setUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | File[]) => {
    const newImages: string[] = [];
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    if (validFiles.length === 0) return;

    setError(null);
    let loadedCount = 0;

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newImages.push(e.target?.result as string);
        loadedCount++;
        if (loadedCount === validFiles.length) {
          setImages(prev => [...prev, ...newImages]);
          setResults(null);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const analyze = async () => {
    if (!url && images.length === 0) {
      setError('Please provide a URL or upload a screenshot.');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setResults(null);
    setStatus('Readying audit engine...');
    
    try {
      let researchData = null;
      if (url) {
        let processedUrl = url;
        if (!processedUrl.startsWith('http')) {
          processedUrl = `https://${processedUrl}`;
        }
        setStatus('Researching website structure...');
        const { data } = await axios.post('/api/research', { url: processedUrl });
        researchData = data;
      }
      
      setStatus('Analyzing audit data...');
      
      const base64Images = images.map(img => img.split(',')[1]);
      const analysis = await analyzeWebsite({ 
        images: base64Images, 
        content: researchData 
      });
      
      if (analysis) {
        setResults(analysis);
        setTimeout(() => {
          document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An unexpected error occurred.');
    } finally {
      setIsAnalyzing(false);
      setStatus(null);
    }
  };

  const onDragOver = (e: DragEvent) => e.preventDefault();
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 lg:py-24">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center space-y-8 mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold border border-blue-500/20 uppercase tracking-widest"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>AI-Driven QA Engine</span>
          </motion.div>
          
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9]">
            AUTOMATED <br />
            <span className="text-blue-500">QA REPORT</span> <br />
            GENERATOR.
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl font-medium leading-relaxed">
            Enter any website URL. We'll automatically research the site, <br className="hidden md:block" />
            identify UX bugs, and generate a professional QA audit report with visual insights.
          </p>
        </div>

        {/* Input Container */}
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="relative group p-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
            <div className="bg-[#0D0D0E] rounded-xl p-8 space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Option 1: Website Link</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                    <Globe className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="example.com"
                    className="w-full h-14 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-12 pr-4 text-base font-medium text-white transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Option 2: Screenshot Upload</label>
                <div 
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="group/drop h-32 border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-xl flex items-center justify-center gap-4 cursor-pointer transition-all bg-slate-950/50"
                >
                  <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800 group-hover/drop:border-blue-500/30">
                    <Upload className="w-5 h-5 text-slate-500 group-hover/drop:text-blue-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-200">Click or drag screenshots</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">PNG, JPG supported</p>
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-800">
                        <img src={img} className="w-full h-full object-cover" alt="" />
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                          className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 border-2 border-dashed border-slate-800 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-500 hover:border-blue-500/30 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={analyze}
                disabled={isAnalyzing || (!url && images.length === 0)}
                className="group relative w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xl flex items-center justify-center gap-4 transition-all shadow-lg shadow-blue-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    {status || 'GENERATING REPORT...'}
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6 fill-current" />
                    GENERATE QA REPORT
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <input type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" multiple className="hidden" />
            </div>
          </div>

          {error && (
            <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-center font-bold flex items-center justify-center gap-3"
            >
              <AlertTriangle className="w-5 h-5" />
              {error}
            </motion.div>
          )}

          {/* Results Area */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-8"
              >
                <ReviewResults results={results} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Features Section */}
        {!results && !isAnalyzing && (
          <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-slate-900 pt-20">
            {[
              { icon: <Globe />, title: "Full Scraping", desc: "We crawl the site structure, meta data, and content automatically." },
              { icon: <Zap />, title: "QA Insights", desc: "AI-powered detection of accessibility, SEO, and UX flaws." },
              { icon: <LayoutGrid />, title: "Visual Reports", desc: "Detailed breakdown with charts, graphs, and severity metrics." }
            ].map((feature, i) => (
              <div key={i} className="space-y-4">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 text-blue-500">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-slate-900 py-12 mt-20 text-center">
        <div className="flex items-center justify-center gap-3 mb-4 opacity-50">
          <ShieldCheck className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-black tracking-[0.2em] uppercase">AI QA ENGINE</span>
        </div>
        <p className="text-slate-600 text-xs mt-4">Automated Quality Assurance • Powered by Gemini 3 Flash • 2026</p>
      </footer>
    </div>
  );
}

