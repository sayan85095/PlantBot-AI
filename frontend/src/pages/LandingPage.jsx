import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Scan,
  Bot,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sparkles,
  Sprout,
  Cpu
} from 'lucide-react';

const LandingPage = () => {
  const { t } = useTranslation();

  const steps = [
    {
      step: '01',
      title: t('landing.step1Title'),
      desc: t('landing.step1Desc'),
      icon: Scan,
      color: 'from-emerald-500 to-green-600'
    },
    {
      step: '02',
      title: t('landing.step2Title'),
      desc: t('landing.step2Desc'),
      icon: Cpu,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      step: '03',
      title: t('landing.step3Title'),
      desc: t('landing.step3Desc'),
      icon: Bot,
      color: 'from-purple-500 to-emerald-600'
    }
  ];

  const supportedCrops = [
    { name: 'Tomato', icon: '🍅', diseases: 'Late Blight, Early Blight' },
    { name: 'Potato', icon: '🥔', diseases: 'Early Blight, Late Blight' },
    { name: 'Apple', icon: '🍎', diseases: 'Apple Scab, Black Rot' },
    { name: 'Corn', icon: '🌽', diseases: 'Common Rust, Leaf Blight' },
    { name: 'Grape', icon: '🍇', diseases: 'Black Rot, Esca' },
    { name: 'Peach', icon: '🍑', diseases: 'Bacterial Spot' },
    { name: 'Pepper', icon: '🫑', diseases: 'Bacterial Spot' },
    { name: 'Strawberry', icon: '🍓', diseases: 'Leaf Spot' },
    { name: 'Cherry', icon: '🍒', diseases: 'Powdery Mildew' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-300/30 to-green-500/20 dark:from-emerald-900/20 dark:to-green-800/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold tracking-wide uppercase">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                {t('landing.heroBadge')}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                {t('landing.heroTitle')}
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-2xl">
                {t('landing.heroSubtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  to="/detect"
                  className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Scan className="w-5 h-5" />
                  {t('landing.detectDisease')}
                </Link>
                <Link
                  to="/chat"
                  className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-emerald-500 font-extrabold text-base transition-all hover:scale-[1.02]"
                >
                  <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  {t('landing.askPlantBot')}
                </Link>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-3 gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{t('landing.precision')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>{t('landing.localPrivate')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <span>{t('landing.instantResults')}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-md p-6 rounded-3xl bg-gradient-to-b from-white/90 to-emerald-50/80 dark:from-slate-900/90 dark:to-slate-900/40 border border-slate-200/80 dark:border-slate-800 shadow-2xl backdrop-blur-xl">
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 h-72 flex items-center justify-center p-6 shadow-inner group">
              <img
                src="/plant-leaf.svg"
                alt="Green plant leaf being scanned by AI"
                className="w-72 h-56 object-contain drop-shadow-[0_0_25px_rgba(16,185,129,0.5)]"
              />
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-scan-line pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-slate-950/85 border border-emerald-500/40 text-white backdrop-blur-md flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">TensorFlow AI Computer Vision</span>
                      <p className="text-sm font-extrabold">Ready to Detect Leaf Disease</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Bot className="w-4 h-4" />
                    <span>Gemma 3 Agricultural Assistant</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    "Upload any crop or plant leaf image to instantly diagnose plant health and receive instant organic treatment guidance."
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              {t('landing.workflowTitle')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              {t('landing.workflowTitle')}
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400">
              {t('landing.workflowSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="relative p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 hover:border-emerald-500 transition-all duration-300 space-y-4 group"
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-3xl font-black text-slate-300 dark:text-slate-700">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {t('landing.architectureTitle1')}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('landing.architectureDesc1')}
              </p>
              <ul className="space-y-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t('landing.architectureFeature1')}
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t('landing.architectureFeature2')}
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t('landing.architectureFeature3')}
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t('landing.architectureFeature4')}
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {t('landing.architectureTitle2')}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('landing.architectureDesc2')}
              </p>
              <ul className="space-y-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t('landing.architectureFeature5')}
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t('landing.architectureFeature6')}
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t('landing.architectureFeature7')}
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t('landing.architectureFeature8')}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{t('landing.supportedCropsTitle')}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('landing.supportedCropsSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-4">
            {supportedCrops.map((crop, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-2 hover:border-emerald-500 transition-colors"
              >
                <div className="text-3xl">{crop.icon}</div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{crop.name}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{crop.diseases}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <div className="text-4xl font-black text-emerald-400">96.4%</div>
              <div className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">{t('landing.classificationAccuracy')}</div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-black text-emerald-400">15+</div>
              <div className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">{t('landing.plantDiseaseClasses')}</div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-black text-emerald-400">&lt;1.5s</div>
              <div className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">{t('landing.analysisSpeed')}</div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-black text-emerald-400">100%</div>
              <div className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">{t('landing.localPrivateBadge')}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-600/30">
            <Sprout className="w-8 h-8" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            {t('landing.ctaTitle')}
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            {t('landing.ctaSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/detect"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-xl shadow-emerald-600/25 transition-all"
            >
              {t('landing.ctaScanButton')}
            </Link>
            <Link
              to="/library"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-base hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              {t('landing.ctaLibraryButton')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
