import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Sprout, 
  Mail, 
  Headset, 
  Shield, 
  Cpu, 
  HelpCircle, 
  CheckCircle, 
  Lock, 
  ChevronRight,
  Sparkles,
  MessageSquare,
  BookOpen,
  Activity
} from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.02] via-transparent to-slate-950 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10 relative z-10">
        
        {/* Top Quick Help Banner */}
        <div className="mb-12 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Headset className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-white font-bold text-sm">Need Direct Agricultural Assistance?</h5>
              <p className="text-slate-400 text-xs">Our Help Desk support team is available 24/7 for farmers, agronomists, and researchers.</p>
            </div>
          </div>
          <a 
            href="mailto:plantbotai.support@gmail.com" 
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 shrink-0"
          >
            <Mail className="w-4 h-4" />
            Contact Help Desk
          </a>
        </div>

        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">
          
          {/* Brand Col */}
          <div className="space-y-4 pr-0 lg:pr-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
                <Sprout className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  PlantBot AI
                </span>
                <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 -mt-0.5">
                  Smart Agricultural Intelligence
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise-grade agricultural AI platform dedicated to precision crop health monitoring, early plant disease diagnosis, and sustainable agronomy guidance worldwide.
            </p>

            {/* Enterprise Trust Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <p className="text-emerald-400 font-bold text-xs">99.2%</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Accuracy</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <p className="text-blue-400 font-bold text-xs">100%</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Privacy</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <p className="text-teal-400 font-bold text-xs">Instant</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Diagnosis</p>
              </div>
            </div>
          </div>

          {/* Help Desk & Support Section (Enhanced) */}
          <div className="space-y-3.5">
            <h4 className="text-white font-bold text-xs tracking-wider uppercase flex items-center gap-2">
              <Headset className="w-4 h-4 text-emerald-400" /> Help Desk Contact
            </h4>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active Help Desk
                </span>
                <span className="text-[10px] text-slate-500 font-mono">24/7 Online</span>
              </div>
              
              <a 
                href="mailto:plantbotai.support@gmail.com" 
                className="flex items-center gap-2 text-emerald-400 font-mono font-semibold hover:underline text-[12px] pt-1"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                plantbotai.support@gmail.com
              </a>
            </div>

            {/* Quick Action Desk Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link 
                to="/chat" 
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 text-xs transition-colors flex items-center gap-1.5 font-medium"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Help Chat</span>
              </Link>
              <Link 
                to="/library" 
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-blue-400 text-xs transition-colors flex items-center gap-1.5 font-medium"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Knowledge Base</span>
              </Link>
            </div>
          </div>

          {/* Platform Navigation */}
          <div className="space-y-3.5">
            <h4 className="text-white font-bold text-xs tracking-wider uppercase flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" /> Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/detect" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  Disease Classifier
                </Link>
              </li>
              <li>
                <Link to="/chat" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  Ask Gemma 3 AI
                </Link>
              </li>
              <li>
                <Link to="/library" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  Disease Knowledge Base
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  Analytics Dashboard
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  User Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Botanical Species Coverage */}
          <div className="space-y-3.5">
            <h4 className="text-white font-bold text-xs tracking-wider uppercase flex items-center gap-2">
              <Sprout className="w-4 h-4 text-teal-400" /> Botanical Coverage
            </h4>
            <div className="flex flex-col gap-1.5 text-xs text-slate-300">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-200">Solanaceous Crops</span>
                <span className="text-slate-500 text-[10px]">Potato, Tomato, Pepper</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-200">Citrus Species</span>
                <span className="text-slate-500 text-[10px]">Orange, Lemon, Lime</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-200">Cereal & Grains</span>
                <span className="text-slate-500 text-[10px]">Rice, Wheat, Corn</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-200">Rosaceae Family</span>
                <span className="text-slate-500 text-[10px]">Apple, Peach, Cherry</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>© {new Date().getFullYear()} PlantBot AI Platform. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Systems Operational
            </span>
            <span className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Privacy First Architecture
            </span>
            <span className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors">
              <Cpu className="w-3.5 h-3.5 text-blue-400" /> On-Device Local Inference
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
