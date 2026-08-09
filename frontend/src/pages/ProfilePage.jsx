import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Shield,
  Camera,
  KeyRound,
  Save,
  AlertCircle,
  Sparkles,
  Briefcase
} from 'lucide-react';

const ProfilePage = () => {
  const { user, isAuthenticated, loading: authLoading, updateProfile, sendPhoneOTP, linkPhone } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setProfileImage(user.profile_image || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setActionMsg('');
    setErrorMsg('');
    setLoading(true);
    try {
      await updateProfile({
        name,
        phone,
        profile_image: profileImage
      });
      setActionMsg('Profile updated successfully!');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendLinkOTP = async () => {
    if (!phone) {
      setErrorMsg('Please enter a phone number to link.');
      return;
    }
    setActionMsg('');
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await sendPhoneOTP(phone);
      setShowPhoneOtpModal(true);
      setActionMsg(`OTP sent to ${phone}! (Test Code: ${res.code || '123456'})`);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to send phone verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLinkOTP = async (e) => {
    e.preventDefault();
    setActionMsg('');
    setErrorMsg('');
    setLoading(true);
    try {
      await linkPhone(phone, phoneOtp);
      setShowPhoneOtpModal(false);
      setActionMsg('Phone number linked & verified successfully!');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Profile Card Header */}
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-3xl flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-600 text-white border-2 border-white dark:border-slate-800 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-2 text-center md:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl font-black">{user.name}</h1>
              <span className="px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider w-fit mx-auto sm:mx-0">
                {user.role}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" /> {user.email}
              </span>
              {user.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400" /> {user.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" /> Member since {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {user.is_verified && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] inline-flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Email Verified
                </span>
              )}
              {user.phone_verified ? (
                <span className="px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-bold text-[11px] inline-flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Phone Verified
                </span>
              ) : (
                <button
                  onClick={handleSendLinkOTP}
                  className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold text-[11px] inline-flex items-center gap-1 hover:underline"
                >
                  Verify Phone Number
                </button>
              )}
              {user.google_id && (
                <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
                  Google Account Linked
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        {actionMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{actionMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Settings Form */}
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" /> Edit Profile Information
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-019-2834"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Profile Image URL</label>
              <div className="relative">
                <Camera className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="url"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  placeholder="https://example.com/my-photo.jpg"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all"
              >
                <Save className="w-4 h-4" /> Save Profile Changes
              </button>
            </div>

          </form>
        </div>

        {/* Modal for Phone OTP Verification */}
        {showPhoneOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="text-center space-y-1">
                <KeyRound className="w-8 h-8 text-emerald-600 mx-auto" />
                <h3 className="text-base font-extrabold">Verify Phone OTP</h3>
                <p className="text-xs text-slate-500">Enter 6-digit code sent to {phone}</p>
              </div>

              <form onSubmit={handleVerifyLinkOTP} className="space-y-4">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value)}
                  placeholder="Enter OTP (e.g. 123456)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPhoneOtpModal(false)}
                    className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                  >
                    Verify & Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfilePage;
