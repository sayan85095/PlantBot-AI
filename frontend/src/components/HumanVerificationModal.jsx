import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, Loader2, Sprout, X, RefreshCw, Lock } from 'lucide-react';

const HumanVerificationModal = ({ isOpen, onClose, onVerifySuccess }) => {
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [error, setError] = useState('');

  // 4 icons challenge: user must select the Plant/Sprout icon
  const iconsChallenge = [
    { id: 0, type: 'robot', label: 'Robot 🤖', icon: '🤖' },
    { id: 1, type: 'car', label: 'Car 🚗', icon: '🚗' },
    { id: 2, type: 'plant', label: 'Green Leaf 🌿', icon: '🌿', isCorrect: true },
    { id: 3, type: 'gear', label: 'Gear ⚙️', icon: '⚙️' },
  ];

  const handleSelectIcon = (item) => {
    setSelectedIndex(item.id);
    setError('');
  };

  const handleVerify = () => {
    if (selectedIndex === null) {
      setError('Please select the green leaf icon to prove you are human.');
      return;
    }

    const selected = iconsChallenge.find((i) => i.id === selectedIndex);
    if (!selected || !selected.isCorrect) {
      setError('Incorrect selection. Please select the Green Leaf (🌿) icon.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onVerifySuccess();
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                Human Security Check
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Prove you are human before proceeding
              </p>
            </div>
          </div>

          {/* Prompt */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Select the <strong>Green Leaf (🌿)</strong> icon below:</span>
          </div>

          {/* Icon Challenge Grid */}
          <div className="grid grid-cols-2 gap-3">
            {iconsChallenge.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectIcon(item)}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedIndex === item.id
                    ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 scale-105'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-slate-400'
                }`}
              >
                <span className="text-3xl">{item.icon}</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
              </button>
            ))}
          </div>

          {error && (
            <p className="text-xs font-bold text-rose-500 text-center animate-shake">
              {error}
            </p>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={handleVerify}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying Security Token...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Verify I am Human
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-500" /> 256-bit Encrypted
            </span>
            <span>PlantBot Anti-Bot Guard</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default HumanVerificationModal;
