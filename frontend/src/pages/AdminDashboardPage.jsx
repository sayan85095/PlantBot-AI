import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Users,
  ShieldAlert,
  CheckCircle,
  Scan,
  Download,
  Database,
  Search,
  Trash2,
  Lock,
  Unlock,
  UserCheck,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  Activity,
  Layers,
  Leaf,
  LogOut,
  ArrowLeft
} from 'lucide-react';

const AdminDashboardPage = () => {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // overview, requests, users, scans, system
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [scansList, setScansList] = useState([]);
  const [adminRequestsList, setAdminRequestsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Access Control Guard
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Fetch Admin Analytics
  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to fetch admin analytics.');
    }
  };

  // Fetch Users
  const fetchUsers = async (query = '') => {
    try {
      const res = await api.get('/admin/users', { params: { q: query } });
      setUsersList(res.data);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to fetch user list.');
    }
  };

  // Fetch Scans
  const fetchScans = async () => {
    try {
      const res = await api.get('/admin/scans');
      setScansList(res.data);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to fetch plant scans.');
    }
  };

  // Fetch Admin Requests
  const fetchAdminRequests = async () => {
    try {
      const res = await api.get('/admin/requests');
      setAdminRequestsList(res.data);
    } catch (err) {
      console.warn('Could not fetch admin requests:', err);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      setLoading(true);
      Promise.all([fetchAnalytics(), fetchUsers(''), fetchScans(), fetchAdminRequests()]).finally(() =>
        setLoading(false)
      );
    }
  }, [user]);

  // Search filter effect
  useEffect(() => {
    if (user?.role === 'admin' && activeTab === 'users') {
      const timer = setTimeout(() => fetchUsers(searchQuery), 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, activeTab]);

  // Block / Unblock User
  const handleToggleBlock = async (userId, currentBlockedStatus) => {
    setErrorMessage('');
    setActionMessage('');
    try {
      const res = await api.put(`/admin/users/${userId}/block`, {
        is_blocked: !currentBlockedStatus
      });
      setActionMessage(`User '${res.data.email}' ${res.data.is_blocked ? 'blocked' : 'unblocked'} successfully.`);
      fetchUsers(searchQuery);
      fetchAnalytics();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to update user block status.');
    }
  };

  // Change User Role
  const handleChangeRole = async (userId, newRole) => {
    setErrorMessage('');
    setActionMessage('');
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setActionMessage(`User '${res.data.email}' role updated to ${newRole.toUpperCase()}.`);
      fetchUsers(searchQuery);
      fetchAnalytics();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to update user role.');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to permanently delete user '${userEmail}'?`)) return;
    setErrorMessage('');
    setActionMessage('');
    try {
      await api.delete(`/admin/users/${userId}`);
      setActionMessage(`User '${userEmail}' deleted successfully.`);
      fetchUsers(searchQuery);
      fetchAnalytics();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to delete user.');
    }
  };

  // Delete Scan
  const handleDeleteScan = async (scanId) => {
    if (!window.confirm(`Are you sure you want to delete scan record #${scanId}?`)) return;
    setErrorMessage('');
    setActionMessage('');
    try {
      await api.delete(`/admin/scans/${scanId}`);
      setActionMessage(`Scan #${scanId} deleted successfully.`);
      fetchScans();
      fetchAnalytics();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to delete scan record.');
    }
  };
  // Approve Admin Request
  const handleApproveAdminRequest = async (requestId, email) => {
    setErrorMessage('');
    setActionMessage('');
    try {
      const res = await api.post(`/admin/requests/${requestId}/approve`);
      setActionMessage(res.data.detail);
      fetchAdminRequests();
      fetchUsers(searchQuery);
      fetchAnalytics();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to approve admin request.');
    }
  };

  // Reject Admin Request
  const handleRejectAdminRequest = async (requestId, email) => {
    if (!window.confirm(`Are you sure you want to DENY admin request for '${email}'?`)) return;
    setErrorMessage('');
    setActionMessage('');
    try {
      const res = await api.post(`/admin/requests/${requestId}/reject`);
      setActionMessage(res.data.detail);
      fetchAdminRequests();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to reject admin request.');
    }
  };

  // Download Users CSV
  const handleExportCSV = async () => {
    try {
      const response = await api.get('/admin/export/users', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setErrorMessage('Failed to download users CSV.');
    }
  };

  // Download Database Backup
  const handleDownloadBackup = async () => {
    try {
      const response = await api.get('/admin/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `plantbot_backup_${new Date().toISOString().slice(0, 10)}.db`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setErrorMessage('Failed to download database backup.');
    }
  };

  if (authLoading || (user?.role === 'admin' && loading)) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight">Admin Control Center</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-300 dark:border-emerald-800">
                  Role: Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                System-wide user management, plant disease diagnosis history, analytics & database backups
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center gap-1.5 transition-colors shadow-sm"
              title="Return to Main Farmer Dashboard"
            >
              <ArrowLeft className="w-4 h-4" /> Exit Admin Panel
            </button>
            <button
              onClick={() => {
                setLoading(true);
                Promise.all([fetchAnalytics(), fetchUsers(searchQuery), fetchScans()]).finally(() =>
                  setLoading(false)
                );
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Sign Out of Admin Account"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Banners for action & error */}
        {actionMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Dashboard Tabs & Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Sidebar Menu */}
          <div className="lg:col-span-3 space-y-2">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" /> Overview & Analytics
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'users'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" /> User Management
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                  {usersList.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('scans')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'scans'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Scan className="w-4 h-4" /> Plant Scans
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                  {scansList.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('requests')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'requests'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 text-amber-400" /> Admin Access Requests
                </div>
                {adminRequestsList.filter(r => r.status === 'pending').length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black animate-pulse">
                    {adminRequestsList.filter(r => r.status === 'pending').length} New
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('system')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'system'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Database className="w-4 h-4" /> System & Backup
              </button>
            </div>
          </div>

          {/* Main Display Area */}
          <div className="lg:col-span-9 space-y-6">

            {/* TAB 1: OVERVIEW & ANALYTICS */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Total Users</span>
                      <Users className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{analytics?.total_users || 0}</p>
                    <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> {analytics?.verified_users || 0} Verified
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Plant Scans</span>
                      <Scan className="w-5 h-5 text-teal-600" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{analytics?.total_scans || 0}</p>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      {analytics?.healthy_count || 0} Healthy / {analytics?.diseased_count || 0} Diseased
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">AI Confidence</span>
                      <Activity className="w-5 h-5 text-indigo-600" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{analytics?.avg_confidence || 96.4}%</p>
                    <p className="text-[11px] text-slate-500 font-semibold">Average Prediction Score</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Top Disease</span>
                      <Leaf className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white truncate">
                      {analytics?.most_detected_disease || 'Tomato Late Blight'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold">Most Diagnosed</p>
                  </div>

                </div>

                {/* Disease Distribution & Recent Users Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Disease Distribution */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" /> Disease Scan Distribution
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(analytics?.disease_distribution || {}).slice(0, 5).map(([disease, count]) => {
                        const total = analytics?.total_scans || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={disease} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span>{disease}</span>
                              <span className="text-slate-500">{count} scans ({pct}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                              <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Registered Users */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" /> Recent User Registrations
                    </h3>
                    <div className="space-y-2">
                      {analytics?.recent_users?.map((u) => (
                        <div key={u.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            {u.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 2: USER MANAGEMENT */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                
                {/* Search Header */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users by name or email..."
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Showing {usersList.length} User Accounts
                  </span>
                </div>

                {/* Users Table */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="p-4">User</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Verification</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                                <p className="text-[11px] text-slate-500">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeRole(u.id, e.target.value)}
                              disabled={u.id === user.id}
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                            >
                              <option value="farmer">Farmer</option>
                              <option value="student">Student</option>
                              <option value="researcher">Researcher</option>
                              <option value="enthusiast">Enthusiast</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>

                          <td className="p-4">
                            {u.is_verified ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] inline-flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Verified
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                                Pending OTP
                              </span>
                            )}
                          </td>

                          <td className="p-4">
                            {u.is_blocked ? (
                              <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[10px] inline-flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Blocked
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                                Active
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleBlock(u.id, u.is_blocked)}
                                disabled={u.id === user.id}
                                className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${
                                  u.is_blocked
                                    ? 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                                    : 'border-amber-300 text-amber-600 hover:bg-amber-50'
                                }`}
                                title={u.is_blocked ? 'Unblock User' : 'Block User'}
                              >
                                {u.is_blocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                disabled={u.id === user.id}
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30"
                                title="Delete User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* TAB 3: PLANT SCANS */}
            {activeTab === 'scans' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">All User Plant Diagnosis History</h3>
                  <span className="text-xs font-semibold text-slate-500">Total Scans: {scansList.length}</span>
                </div>

                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="p-4">Scan ID</th>
                        <th className="p-4">Plant & Disease</th>
                        <th className="p-4">Confidence</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Created At</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {scansList.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          
                          <td className="p-4 font-bold text-slate-500">#{s.id}</td>

                          <td className="p-4">
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white">{s.disease}</p>
                              <p className="text-[11px] text-slate-500">Species: {s.plant}</p>
                            </div>
                          </td>

                          <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                            {s.confidence}%
                          </td>

                          <td className="p-4">
                            {s.status === 'Healthy' ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                                Healthy
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                                Diseased
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-slate-500">
                            {s.created_at ? new Date(s.created_at).toLocaleString() : 'N/A'}
                          </td>

                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteScan(s.id)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Scan Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* TAB: ADMIN ACCESS REQUESTS (ACCEPT / DENY WORKFLOW FOR SAYAN & ROHIT) */}
            {activeTab === 'requests' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-amber-500" /> Pending Admin Access Requests
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Review users requesting Administrator access. Sayan Mukherjee & Rohit Sardar can ACCEPT (Approve) or DENY (Reject) requests.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                    Total Requests: {adminRequestsList.length}
                  </span>
                </div>

                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="p-4">Applicant</th>
                        <th className="p-4">Gmail / Email</th>
                        <th className="p-4">Note / Reason</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Requested At</th>
                        <th className="p-4 text-right">Action (Sayan & Rohit)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {adminRequestsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            No Admin access requests submitted yet.
                          </td>
                        </tr>
                      ) : (
                        adminRequestsList.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 font-bold text-slate-900 dark:text-white">
                              {r.name}
                            </td>
                            <td className="p-4 font-mono text-emerald-600 dark:text-emerald-400">
                              {r.email}
                            </td>
                            <td className="p-4 text-slate-500">
                              {r.note || 'Requesting Admin Panel Access'}
                            </td>
                            <td className="p-4">
                              {r.status === 'pending' && (
                                <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-extrabold text-[10px] animate-pulse">
                                  ⏳ Pending Approval
                                </span>
                              )}
                              {r.status === 'approved' && (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
                                  ✅ Approved by {r.reviewed_by || 'Admin'}
                                </span>
                              )}
                              {r.status === 'rejected' && (
                                <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-extrabold text-[10px]">
                                  ❌ Denied by {r.reviewed_by || 'Admin'}
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-slate-500">
                              {r.created_at ? new Date(r.created_at).toLocaleString() : 'N/A'}
                            </td>
                            <td className="p-4 text-right">
                              {r.status === 'pending' ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleApproveAdminRequest(r.id, r.email)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1"
                                  >
                                    🟢 Accept
                                  </button>
                                  <button
                                    onClick={() => handleRejectAdminRequest(r.id, r.email)}
                                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1"
                                  >
                                    🔴 Deny
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Reviewed</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: SYSTEM & BACKUP */}
            {activeTab === 'system' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Export Users Data</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Download complete user database records formatted as a standard CSV file for offline reporting.
                    </p>
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Download className="w-4 h-4" /> Download Users CSV
                  </button>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">SQLite Database Backup</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Download a full binary SQLite database snapshot (`plantbot.db`) containing all users, predictions, and chats.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadBackup}
                    className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 transition-all"
                  >
                    <Download className="w-4 h-4" /> Download Database File
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;
