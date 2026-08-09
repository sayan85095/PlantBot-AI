import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useGoogleLogin } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import { Sprout, Mail, Lock, AlertCircle, CheckCircle, ArrowRight, Phone, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const googleButtonRef = useRef(null);
  const { t } = useTranslation();
  const location = useLocation();
  const [authMethod, setAuthMethod] = useState('email'); // email, phone, admin
  const [email, setEmail] = useState(location.state?.email || '');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin, sendPhoneOTP, phoneLogin } = useAuth();

  const googleLoginWithPopup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);

      try {
        const response = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to get Google profile.');
        }

        const profile = await response.json();

        await googleLogin({
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          google_id: profile.sub
        });

        navigate(fromPage, { replace: true });
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          err.message ||
          'Google Sign-In failed.'
        );
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setLoading(false);
      setError('Google Sign-In was cancelled or failed.');
    }
  });

  const navigate = useNavigate();

  const fromPage = location.state?.from?.pathname || '/dashboard';

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      if (loggedUser?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(fromPage, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password credentials. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const parseErrorMessage = (err, fallback) => {
    if (!err?.response?.data?.detail) return err?.message || fallback;
    const detail = err.response.data.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail[0]?.msg || detail[0]?.message || fallback;
    }
    return fallback;
  };

  const handleAdminBoxSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter a valid Gmail address.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const superAdmins = ['sayanmukherjee7464@gmail.com', 'sardrarohit@gmail.com', 'rohitsardar@gmail.com', 'admin@plantbot.ai'];
    const isSuperAdminEmail = superAdmins.includes(email.trim().toLowerCase());

    // If Super Admin email with password provided, try logging in first
    if (isSuperAdminEmail && !password) { setError('Please enter your password to sign in as admin.'); setLoading(false); } else if (isSuperAdminEmail && password) {
      try {
        const loggedUser = await login(email, password);
        if (loggedUser?.role === 'admin') {
          navigate('/admin', { replace: true });
          return;
        }
      } catch (err) {
        setError(parseErrorMessage(err, 'Invalid Super Admin password.'));
        setLoading(false);
        return;
      }
    }

    // If not super admin email, automatically submit Admin Access Request to Sayan & Rohit
    try {
      const res = await api.post('/admin/request-access', {
        name: name || email.split('@')[0],
        email: email,
        note: requestNote || 'Requesting Admin Panel Access'
      });
      setSuccessMsg(res.data.detail);
    } catch (err) {
      setError(parseErrorMessage(err, 'Failed to submit Admin Access Request. Please check email address format.'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAccessRequest = async (e) => {
    return handleAdminBoxSubmit(e);
  };

  const handleSendPhoneOTP = async (e) => {
    e.preventDefault();
    if (!phone) {
      setError('Please enter a valid phone number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await sendPhoneOTP(phone);
      setOtpSent(true);
      setOtpCode(''); // Keep field empty so user manually enters OTP
      const generatedCode = res.code || '123456';
      setSuccessMsg(`OTP dispatched to ${phone}! Enter the 6-digit code below (Generated OTP: ${generatedCode} | Test Code: 123456)`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP to phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await phoneLogin(phone, otpCode);
      navigate(fromPage, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

const handleGoogleSignIn = () => {
  setError('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '107283915574-sk5qcbk4h360kucm1f2se0lkq8q5p210.apps.googleusercontent.com';
  if (!clientId || clientId.includes('placeholder')) {
    setError('Google Sign-In is not configured yet. Please configure VITE_GOOGLE_CLIENT_ID in your frontend/.env file.');
    return;
  }
  googleLoginWithPopup();
};

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
            <Sprout className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t('auth.welcomeBack')}</h2>
          <p className="text-xs text-slate-500 font-semibold">{t('auth.signinText')}</p>
        </div>

        {/* Auth Method Selector (Email / Phone / Admin Portal) */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setAuthMethod('email'); setError(''); setSuccessMsg(''); }}
            className={`py-2 rounded-xl transition-all ${
              authMethod === 'email'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Email Login
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod('phone'); setError(''); setSuccessMsg(''); }}
            className={`py-2 rounded-xl transition-all ${
              authMethod === 'phone'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Phone OTP
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod('admin'); setError(''); setSuccessMsg(''); }}
            className={`py-2 rounded-xl transition-all ${
              authMethod === 'admin'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🛡️ Admin Box
          </button>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-3 transition-all shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.3 7.31 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
          <span className="bg-white dark:bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-400 absolute">Or</span>
        </div>

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {authMethod === 'admin' ? (
          /* Dedicated Admin Portal Access Box */
          <div className="space-y-4 p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-white shadow-xl">
            <div className="space-y-1 text-center">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-500/30">
                🛡️ Admin Portal Box
              </span>
              <p className="text-xs text-slate-300 font-medium pt-1">
                Authorized Login for Sayan Mukherjee & Rohit Sardar. Non-admins will submit an Access Request for Accept/Deny approval.
              </p>
            </div>

            <form onSubmit={handleAdminBoxSubmit} className="space-y-3">
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-300">Admin Name / Applicant Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name (e.g. Sayan Mukherjee / Applicant)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-300">Gmail / Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-300">Password (For Super Admins)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-300">Access Request Note (If requesting admin role)</label>
                <input
                  type="text"
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="Why do you need Admin access?"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '🟢 Sign In Admin'}
                </button>

                <button
                  type="button"
                  onClick={handleAdminAccessRequest}
                  disabled={loading}
                  className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  📩 Request Access
                </button>
              </div>
            </form>
          </div>
        ) : authMethod === 'email' ? (
          /* Email Login Form */
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('auth.emailAddress')}</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('auth.signinButton')} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Phone OTP Login Form */
          <form onSubmit={otpSent ? handlePhoneVerifySubmit : handleSendPhoneOTP} className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
              💡 <strong>Note for Local Testing:</strong> Real SIM mobile SMS requires a paid SMS gateway API (e.g. Twilio/Fast2SMS). On this local server, your 6-digit OTP appears on screen in the green alert box and auto-fills below (Test code: <code>123456</code>).
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="tel"
                  required
                  disabled={otpSent}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555-019-2834"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            {otpSent && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">6-Digit Phone OTP</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter OTP (e.g. 123456)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium tracking-widest"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : otpSent ? 'Verify Phone OTP & Sign In' : 'Send Phone OTP'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-500">
            {t('auth.dontHaveAccount')}{' '}
            <Link to="/register" className="font-bold text-emerald-600 hover:underline">
              {t('auth.registerForFree')}
            </Link>
        </p>
        <p className="text-center text-xs text-slate-500">
            <Link to="/forgot-password" className="font-bold text-emerald-600 hover:underline">
              {t('auth.forgotPasswordLink')}
            </Link>
        </p>

      </div>
    </div>
  );
};

export default LoginPage;
