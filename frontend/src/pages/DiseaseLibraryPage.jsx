import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Filter, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Bot,
  Sprout
} from 'lucide-react';
import api from '../services/api';

const DiseaseLibraryPage = () => {
  const { t } = useTranslation();
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedDisease, setSelectedDisease] = useState(null);

  const crops = ['All', 'Tomato', 'Potato', 'Apple', 'Corn', 'Grape', 'Peach', 'Pepper', 'Strawberry', 'Cherry'];

  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        const res = await api.get('/diseases');
        setDiseases(res.data);
      } catch (err) {
        console.error('Failed to load disease library:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDiseases();
  }, []);

  const filteredDiseases = diseases.filter((item) => {
    const matchesCrop = selectedCrop === 'All' || item.plant.toLowerCase() === selectedCrop.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.plant.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCrop && matchesSearch;
  });

  return (
    <div className="min-h-screen py-12 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
            <BookOpen className="w-4 h-4" /> {t('library.title')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {t('library.title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('library.subtitle')}
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('library.searchPlaceholder')}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Crop Category Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {crops.map((crop) => (
              <button
                key={crop}
                onClick={() => setSelectedCrop(crop)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  selectedCrop === crop
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {crop === 'All' ? t('library.allCrops') : crop}
              </button>
            ))}
          </div>
        </div>

        {/* Disease Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 font-semibold">
            {t('library.loading')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDiseases.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedDisease(item)}
                className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
                      {item.plant}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>View Symptoms & Remedies</span>
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DETAIL MODAL POPUP */}
        <AnimatePresence>
          {selectedDisease && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedDisease(null)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Modal Title */}
                <div className="space-y-2 pr-10">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    {selectedDisease.plant} {t('library.plantDisease')}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {selectedDisease.name}
                  </h2>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  {selectedDisease.description}
                </p>

                {/* Grid Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Symptoms */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" /> Symptoms
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      {selectedDisease.symptoms.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Causes */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-2">
                      <Filter className="w-4 h-4 text-blue-500" /> Primary Causes
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      {selectedDisease.causes.map((c, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Treatment */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Organic & Recommended Treatments
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      {selectedDisease.treatment.map((t, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Prevention */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-teal-500" /> Prevention Best Practices
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      {selectedDisease.prevention.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default DiseaseLibraryPage;
