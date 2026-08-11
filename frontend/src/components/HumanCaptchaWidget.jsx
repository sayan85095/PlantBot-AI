import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, Loader2, RefreshCw, Lock } from 'lucide-react';
import HumanVerificationModal from './HumanVerificationModal';

const HumanCaptchaWidget = ({ isHuman, setIsHuman }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClickCheckbox = () => {
    if (isHuman) return;
    setIsModalOpen(true);
  };

  const handleVerifySuccess = () => {
    setIsHuman(true);
  };

  return (
    <>
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between shadow-sm transition-all">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClickCheckbox}
            disabled={isHuman}
            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
              isHuman
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-emerald-500'
            }`}
          >
            {isHuman && <CheckCircle2 className="w-4 h-4 text-white" />}
          </button>

          <div className="flex flex-col text-left">
            <span 
              onClick={handleClickCheckbox}
              className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer hover:text-emerald-500 transition-colors"
            >
              I am human
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {isHuman ? 'Verified Human ✓' : 'Click checkbox to verify'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end opacity-80">
          <div className="flex items-center gap-1 text-emerald-500">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black tracking-wider uppercase">Anti-Bot</span>
          </div>
          <span className="text-[8px] text-slate-400 font-mono">PlantBot Security</span>
        </div>
      </div>

      <HumanVerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onVerifySuccess={handleVerifySuccess}
      />
    </>
  );
};

export default HumanCaptchaWidget;
