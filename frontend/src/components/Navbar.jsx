import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { 
  Sprout, 
  Scan, 
  Bot, 
  BookOpen, 
  LayoutDashboard, 
  Sun, 
  Moon, 
  Laptop,
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Shield,
  CheckCircle
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout, themeMode, setThemeMode, isDarkMode, toggleDarkMode } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const navLinks = [
    { name: t('nav.home'), path: '/', icon: Sprout },
    { name: t('nav.detect'), path: '/detect', icon: Scan },
    { name: t('nav.chat'), path: '/chat', icon: Bot },
    { name: t('nav.library'), path: '/library', icon: BookOpen },
    { name: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
  ];

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'fr', label: 'Français' },
    { code: 'ja', label: '日本語' },
    { code: 'es', label: 'Español' },
  ];

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('plantbot_lang', lang);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full max-w-full transition-all duration-300 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform duration-300">
              <Sprout className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-emerald-950 to-emerald-700 dark:from-white dark:via-emerald-200 dark:to-emerald-400">
                PlantBot <span className="text-emerald-600 dark:text-emerald-400 font-black">AI</span>
              </span>
              <span className="hidden sm:block text-[9px] font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase -mt-1">
                Agricultural Vision & Gemma 3
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-full border border-slate-200/80 dark:border-slate-700/50">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    active
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {/* Language Dropdown */}
            <select
              value={i18n.language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              aria-label={t('language.selectLanguage')}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>

            {/* Theme Mode Selector (Light / Dark / System) */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold">
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`p-1.5 rounded-lg transition-all ${
                  themeMode === 'light'
                    ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400 font-black border border-amber-400/40 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Day Mode (Light Theme)"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`p-1.5 rounded-lg transition-all ${
                  themeMode === 'dark'
                    ? 'bg-slate-950 text-emerald-400 font-black border border-emerald-500/40 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Night Mode (Dark Theme)"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setThemeMode('system')}
                className={`p-1.5 rounded-lg transition-all ${
                  themeMode === 'system'
                    ? 'bg-emerald-600 text-white font-black shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="System Auto Preference"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                {user?.role === 'admin' && (
                  <Link
                    to={location.pathname === '/admin' ? '/dashboard' : '/admin'}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm transition-all flex-shrink-0"
                    title={location.pathname === '/admin' ? 'Exit Admin Panel' : 'Open Admin Panel'}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>{location.pathname === '/admin' ? 'Exit' : 'Admin'}</span>
                  </Link>
                )}
                
                <Link to="/profile" className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] overflow-hidden flex-shrink-0">
                    {user?.profile_image ? (
                      <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                      {user?.name?.split(' ')[0] || 'User'}
                    </p>
                  </div>
                </Link>

                <button
                  onClick={logout}
                  className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title={t('general.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {t('nav.register')} <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden gap-1.5">
            <button
              onClick={toggleDarkMode}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-colors ${
                  isActive(link.path)
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
            {/* Mobile Theme Selector */}
            <div className="flex items-center justify-between px-2 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-2">Theme Mode</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setThemeMode('light')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                    themeMode === 'light' ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400' : 'text-slate-400'
                  }`}
                >
                  <Sun className="w-4 h-4" /> Light
                </button>
                <button
                  onClick={() => setThemeMode('dark')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                    themeMode === 'dark' ? 'bg-slate-950 text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  <Moon className="w-4 h-4" /> Dark
                </button>
                <button
                  onClick={() => setThemeMode('system')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                    themeMode === 'system' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  <Laptop className="w-4 h-4" /> Auto
                </button>
              </div>
            </div>

            {isAuthenticated ? (
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 font-bold"
              >
                <LogOut className="w-5 h-5" /> {t('general.logout')}
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center font-bold text-white bg-emerald-600 rounded-xl"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
