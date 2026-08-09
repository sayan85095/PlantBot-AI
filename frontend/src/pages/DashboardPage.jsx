import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Scan, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  Bot, 
  ArrowRight,
  Shield,
  Sprout
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import api from '../services/api';

const DashboardPage = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    // Live auto-refresh: poll every 5 seconds so new scans from any user appear automatically
    const intervalId = setInterval(fetchStats, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#8b5cf6', '#f59e0b'];

  const pieData = stats ? [
    { name: 'Healthy Crops', value: stats.healthy_count },
    { name: 'Diseased Crops', value: stats.diseased_count }
  ] : [];

  const barData = stats ? Object.keys(stats.disease_distribution).map((key) => ({
    name: key.length > 14 ? key.substring(0, 14) + '...' : key,
    count: stats.disease_distribution[key]
  })) : [];

  return (
    <div className="min-h-screen py-12 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20 mb-2">
              <LayoutDashboard className="w-4 h-4" /> {t('dashboard.liveAnalytics')}
            </div>
            <h1 className="text-3xl font-black tracking-tight">{t('dashboard.pageTitle')}</h1>
          </div>
          
          <Link
            to="/chat"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 transition-all"
          >
            <Bot className="w-4 h-4" /> {t('dashboard.openAssistant')}
          </Link>
        </div>

        {/* METRICS STATS CARDS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">{t('dashboard.totalScans')}</span>
              <Scan className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black">{loading ? '...' : stats?.total_scans}</p>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{t('dashboard.summaryEngine')}</span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">{t('dashboard.healthyPlants')}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{loading ? '...' : stats?.healthy_count}</p>
            <span className="text-[10px] font-semibold text-slate-500">{t('dashboard.optimalVitality')}</span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">{t('dashboard.diseasedPlants')}</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{loading ? '...' : stats?.diseased_count}</p>
            <span className="text-[10px] font-semibold text-slate-500">{t('dashboard.pathogensDetected')}</span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">{t('dashboard.avgConfidence')}</span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black">{loading ? '...' : `${stats?.avg_confidence}%`}</p>
            <span className="text-[10px] font-semibold text-blue-500">{t('dashboard.subSecondLatency')}</span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">{t('dashboard.topPathogen')}</span>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-sm font-black text-purple-600 dark:text-purple-400 truncate">{loading ? '...' : stats?.most_detected_disease}</p>
            <span className="text-[10px] font-semibold text-slate-500">{t('dashboard.mostFrequentClass')}</span>
          </div>

        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Disease Distribution Bar Chart */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">{t('dashboard.diseaseBreakdown')}</h3>
            <div className="h-64 w-full">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} 
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">No chart data available</div>
              )}
            </div>
          </div>

          {/* Healthy vs Diseased Pie Chart */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">{t('dashboard.healthRatio')}</h3>
            <div className="h-64 w-full flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                      <Cell fill="#10b981" />
                      <Cell fill="#f43f5e" />
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">{t('dashboard.noRatioData')}</div>
              )}
            </div>
          </div>

        </div>

        {/* RECENT SCANS TABLE */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">{t('dashboard.recentDiagnostics')}</h3>
            <Link to="/detect" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
              {t('dashboard.newDetection')}
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">{t('dashboard.table.crop')}</th>
                  <th className="py-3 px-4">{t('dashboard.table.detectedCondition')}</th>
                  <th className="py-3 px-4">{t('dashboard.table.status')}</th>
                  <th className="py-3 px-4">{t('dashboard.table.confidence')}</th>
                  <th className="py-3 px-4">{t('dashboard.table.timestamp')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {(stats?.recent_scans || []).map((scan, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{scan.plant}</td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">{scan.disease}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        scan.status === 'Healthy' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {scan.status === 'Healthy' ? t('dashboard.statusHealthy') : t('dashboard.statusDiseased')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">{scan.confidence}%</td>
                    <td className="py-3 px-4 text-slate-400">{scan.created_at ? new Date(scan.created_at).toLocaleDateString() : t('dashboard.justNow')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
