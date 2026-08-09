import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  X, 
  Scan, 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  RefreshCw,
  ShieldCheck,
  BookmarkPlus,
  MessageSquare,
  Download,
  FileText,
  Camera,
  Video,
  PlayCircle
} from 'lucide-react';
import api from '../services/api';
import { generateDiagnosticPDF } from '../services/pdfService';

const DetectionPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('symptoms');
  
  // Webcam states
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const navigate = useNavigate();
  const { t } = useTranslation();

  // Preset Sample Leaves for instant 1-click testing
  const sampleLeaves = [
    {
      name: 'Tomato Late Blight',
      crop: 'Tomato',
      url: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Potato Early Blight',
      crop: 'Potato',
      url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Apple Scab',
      crop: 'Apple',
      url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Corn Rust',
      crop: 'Corn',
      url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Healthy Leaf Sample',
      crop: 'Strawberry',
      url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const handleFileSelect = (file) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError(t('detection.unsupportedFile'));
      return;
    }
    setError('');
    stopWebcam();
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Start Webcam Stream
  const startWebcam = async () => {
    setError('');
    setSelectedFile(null);
    setPreviewUrl('');
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsWebcamActive(true);
    } catch (err) {
      console.error(err);
      setError(t('detection.webcamError'));
    }
  };

  // Stop Webcam Stream
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsWebcamActive(false);
  };

  // Capture photo from Webcam video stream
  const captureWebcamPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `webcam_leaf_${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleFileSelect(file);
      }
    }, 'image/jpeg', 0.95);
  };

  // Handle clicking sample preset leaf image
  const handleSelectSampleLeaf = async (sample) => {
    setError('');
    setLoading(true);
    stopWebcam();
    setResult(null);

    try {
      const response = await fetch(sample.url);
      const blob = await response.blob();
      const file = new File([blob], `${sample.name.replace(/\s+/g, '_')}.jpg`, { type: 'image/jpeg' });
      
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));

      // Auto trigger prediction
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(t('detection.failedSampleImage'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    stopWebcam();
    setSelectedFile(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post('/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || t('detection.analysisFailed'));
    } finally {
      setLoading(false);
    }
  };

  const askGemmaAboutDisease = () => {
    if (result) {
      navigate('/chat', {
        state: {
          initialMessage: `I scanned a ${result.plant} leaf and detected ${result.disease} with ${result.confidence}% confidence. What further care instructions can you provide?`
        }
      });
    } else {
      navigate('/chat');
    }
  };

  const handleDownloadPDF = () => {
    if (result) {
      generateDiagnosticPDF(result);
    }
  };

  return (
    <div className="min-h-screen py-12 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
            <Scan className="w-4 h-4" /> {t('detection.liveWebcam')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {t('detection.pageTitle')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('detection.pageSubtitle')}
          </p>
        </div>

        {/* SAMPLE LEAVES (1-CLICK DEMO CARDS) */}
        {!result && !previewUrl && !isWebcamActive && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" /> {t('detection.sampleLeaves')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {sampleLeaves.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSampleLeaf(sample)}
                  className="group p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500 text-left transition-all hover:scale-[1.02]"
                >
                  <div className="h-24 w-full rounded-xl overflow-hidden mb-2 bg-slate-900">
                    <img 
                      src={sample.url} 
                      alt={sample.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{sample.name}</p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{sample.crop}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* UPLOAD / WEBCAM & ANALYSIS SECTION */}
        <div className="max-w-3xl mx-auto">
          {!result ? (
            <div className="space-y-6">
              
              {/* LIVE WEBCAM FEED CONTAINER */}
              {isWebcamActive ? (
                <div className="relative rounded-3xl bg-slate-900 overflow-hidden shadow-2xl p-4 space-y-4">
                  <div className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Camera Overlay Frame */}
                    <div className="absolute inset-8 border-2 border-dashed border-emerald-400/70 rounded-2xl pointer-events-none flex items-center justify-center">
                      <span className="bg-slate-950/80 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                        {t('detection.centerLeafInFrame')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2">
                    <button
                      onClick={stopWebcam}
                      className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-800 transition-colors"
                    >
                      {t('detection.cancelWebcam')}
                    </button>
                    <button
                      onClick={captureWebcamPhoto}
                      className="flex-1 flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 transition-all"
                    >
                      <Camera className="w-5 h-5" /> {t('detection.captureAnalyze')}
                    </button>
                  </div>
                </div>
              ) : !previewUrl ? (
                /* Drag and Drop Card + Webcam Button */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative p-10 sm:p-14 rounded-3xl border-2 border-dashed text-center transition-all duration-300 ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.01]'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-500'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-4 pointer-events-none">
                    <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                      <UploadCloud className="w-10 h-10" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {t('detection.dragDrop')}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {t('detection.supportedFormats')}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pointer-events-auto pt-2">
                      <button type="button" className="px-6 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-sm shadow">
                        {t('detection.browseFile')}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); startWebcam(); }}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow shadow-emerald-600/20"
                      >
                        <Video className="w-4 h-4" /> {t('detection.openWebcam')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Image Preview Card */
                <div className="relative rounded-3xl bg-slate-900 overflow-hidden shadow-2xl p-4 space-y-4">
                  <div className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden flex items-center justify-center bg-slate-950">
                    <img
                      src={previewUrl}
                      alt="Selected plant leaf"
                      className="w-full h-full object-contain"
                    />

                    <button
                      onClick={handleRemoveImage}
                      disabled={loading}
                      className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-950/80 text-white hover:bg-rose-600 transition-colors shadow-lg"
                      title={t('detection.removeImage')}
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {loading && (
                      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white space-y-4">
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#10b981] animate-scan-line" />
                        <div className="w-14 h-14 rounded-2xl bg-emerald-600/90 flex items-center justify-center animate-bounce shadow-xl">
                          <Scan className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-center space-y-1">
                          <p className="font-extrabold text-lg text-emerald-400">{t('detection.analyzing')}</p>
                          <p className="text-xs text-slate-300">{t('detection.analysisInfo')}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2">
                    <button
                      onClick={handleRemoveImage}
                      disabled={loading}
                      className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-800 transition-colors"
                    >
                      {t('detection.changePhoto')}
                    </button>
                    <button
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 transition-all"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" /> {t('detection.processingPipeline')}
                        </>
                      ) : (
                        <>
                          <Scan className="w-5 h-5" /> {t('detection.analyzeLeaf')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3 font-semibold">
                  <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

            </div>
          ) : (
            /* RESULTS DISPLAY CARD */
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* TensorFlow Classifier Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Scan className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('detection.computerVisionResult')}</h2>
                      <p className="text-xs text-slate-500">{t('detection.computerVisionEngine')}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    result.status === 'Healthy' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300' 
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300'
                  }`}>
                    {result.status === 'Healthy' ? t('detection.statusHealthy') : t('detection.statusDiseased')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('detection.plantLabel')}</span>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{result.plant}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('detection.diseaseLabel')}</span>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{result.disease}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('detection.confidenceLabel')}</span>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{result.confidence}%</p>
                  </div>
                </div>
              </div>

              {/* Gemma 3 AI Analysis Breakdown Card */}
              {result.ai_analysis && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('detection.aiAnalysis')}</h2>
                        <p className="text-xs text-slate-500">{t('detection.aiAdvice')}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-900">
                    {result.ai_analysis.description}
                  </p>

                  {/* Tabs navigation */}
                  <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                    {[
                      { id: 'symptoms', label: t('library.symptoms') },
                      { id: 'causes', label: t('library.primaryCauses') },
                      { id: 'treatment', label: t('library.treatment') },
                      { id: 'prevention', label: t('library.prevention') },
                      { id: 'care_tips', label: t('detection.careTips') },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                          activeTab === tab.id
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Active Tab Content */}
                  <div className="pt-2">
                    <ul className="space-y-3">
                      {(result.ai_analysis[activeTab] || []).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              )}

              {/* ACTION BUTTONS WITH PDF DOWNLOAD */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <button
                  onClick={handleRemoveImage}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> {t('detection.scanAnotherLeaf')}
                </button>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02]"
                  >
                    <Download className="w-4 h-4" /> {t('detection.downloadPDF')}
                  </button>

                  <button
                    onClick={askGemmaAboutDisease}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm shadow-md shadow-purple-600/25 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" /> {t('detection.askGemma')}
                  </button>
                </div>
              </div>

            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetectionPage;
