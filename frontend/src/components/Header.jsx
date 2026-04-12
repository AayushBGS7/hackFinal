import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const Icon = ({ name, className = "", filled = false }) => (
  <span className={`material-symbols-outlined${filled ? " filled" : ""} ${className}`}>{name}</span>
);

export default function Header({ searchValue, onSearchChange, showSearch = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'hinglish', label: 'Hinglish' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="fixed top-0 w-full z-50 h-20" style={{ backgroundColor: "#f8fafb" }}>
      <div className="flex justify-between items-center px-8 h-full max-w-screen-2xl mx-auto">
        <div className="text-2xl font-extrabold tracking-tight cursor-pointer font-headline" style={{ color: "#0d5c75", letterSpacing: "-0.02em" }} onClick={() => navigate("/")}>
          {t('brand')}
        </div>
        <nav className="hidden md:flex items-center gap-8 font-headline font-bold tracking-tight">
          <a onClick={() => navigate("/dashboard")} className={`cursor-pointer transition-colors ${isActive('/dashboard') ? 'border-b-2 pb-1' : ''}`} style={isActive('/dashboard') ? { color: "#0d5c75", borderColor: "#0d5c75" } : { color: "#566164" }}>{t('nav.dashboard')}</a>
          <a onClick={() => navigate("/reports")} className={`cursor-pointer transition-colors ${isActive('/reports') ? 'border-b-2 pb-1' : ''}`} style={isActive('/reports') ? { color: "#0d5c75", borderColor: "#0d5c75" } : { color: "#566164" }}>{t('nav.reports')}</a>
          <a onClick={() => navigate("/predict")} className={`cursor-pointer transition-colors ${isActive('/predict') ? 'border-b-2 pb-1' : ''}`} style={isActive('/predict') ? { color: "#0d5c75", borderColor: "#0d5c75" } : { color: "#566164" }}>{t('nav.analysis')}</a>
        </nav>
        <div className="flex items-center gap-6">
          {showSearch && (
            <div className="hidden lg:flex items-center px-4 py-2 rounded-full border" style={{ backgroundColor: "#f0f4f6", borderColor: "rgba(169,180,183,0.15)" }}>
              <Icon name="search" className="mr-2" style={{ color: "#566164" }} />
              <input type="text" placeholder={t('dashboard.searchRecords')} value={searchValue} onChange={(e) => onSearchChange && onSearchChange(e.target.value)} className="bg-transparent border-none outline-none text-sm w-48" style={{ color: "#566164" }} />
            </div>
          )}
          <div className="relative">
            <button onClick={() => { setShowLangMenu(!showLangMenu); setShowProfileMenu(false); }} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title={t('dashboard.changeLanguage')}>
              <Icon name="translate" className="cursor-pointer" style={{ color: "#566164" }} />
            </button>
            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border overflow-hidden z-50 animate-fade-in" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
                <div className="px-4 py-3 border-b" style={{ backgroundColor: "#f8fafb", borderColor: "rgba(169,180,183,0.15)" }}>
                  <p className="text-xs uppercase font-bold tracking-widest" style={{ color: "#566164" }}>{t('language.selectLanguage')}</p>
                </div>
                {languages.map(lang => (
                  <button key={lang.code} onClick={() => { i18n.changeLanguage(lang.code); setShowLangMenu(false); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${i18n.language === lang.code ? 'font-bold' : ''}`} style={{ color: i18n.language === lang.code ? '#0d5c75' : '#2a3437', backgroundColor: i18n.language === lang.code ? 'rgba(189,233,255,0.2)' : 'transparent' }}>
                    {i18n.language === lang.code && <Icon name="check" className="text-[16px]" style={{ color: '#0d5c75' }} />}
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="relative">
            <div onClick={() => { setShowProfileMenu(!showProfileMenu); setShowLangMenu(false); }}>
              <Icon name="account_circle" className="cursor-pointer transition-transform hover:scale-110" style={{ color: "#566164" }} />
            </div>
            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border overflow-hidden z-50 animate-fade-in" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
                <div className="px-4 py-3 border-b" style={{ backgroundColor: "#f8fafb", borderColor: "rgba(169,180,183,0.15)" }}>
                  <p className="text-sm font-bold truncate" style={{ color: "#2a3437" }}>{user?.name || "User"}</p>
                  <p className="text-xs truncate" style={{ color: "#566164" }}>{user?.email || "user@example.com"}</p>
                </div>
                <div className="py-2">
                  <button className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors" style={{ color: "#2a3437" }}>
                    <Icon name="person" className="text-[18px]" /> {t('dashboard.myProfile')}
                  </button>
                  <button onClick={() => navigate("/settings")} className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors" style={{ color: "#2a3437" }}>
                    <Icon name="settings" className="text-[18px]" /> {t('sidebar.settings')}
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors" style={{ color: "#2a3437" }}>
                    <Icon name="help" className="text-[18px]" /> {t('dashboard.helpSupport')}
                  </button>
                </div>
                <div className="py-2 border-t" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-red-50 transition-colors" style={{ color: "#dc2626" }}>
                    <Icon name="logout" className="text-[18px]" /> {t('dashboard.logOut')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
