import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";

const Icon = ({ name, className = "", filled = false }) => (
  <span className={`material-symbols-outlined${filled ? " filled" : ""} ${className}`}>{name}</span>
);

import Sidebar from "../components/Sidebar";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsRecap: false,
    aiSuggestions: true,
  });

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ backgroundColor: "#f8fafb", color: "#2a3437", minHeight: "100vh" }}>
      <Header />

      <div className="flex pt-20">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto px-6 py-10 animate-fade-in">
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold font-headline tracking-tight mb-3">{t('settings.title')}</h1>
            <p style={{ color: "#566164" }}>{t('settings.subtitle')}</p>
          </div>

          <div className="space-y-8">
            {/* Account Settings */}
            <div className="p-8 rounded-3xl" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(169,180,183,0.15)" }}>
              <h2 className="text-2xl font-headline font-bold mb-6 flex items-center gap-2">
                <Icon name="person" style={{ color: "#1e667f" }} /> {t('settings.accountSettings')}
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
                  <div>
                    <h4 className="font-bold">{t('settings.emailAddress')}</h4>
                    <p className="text-sm" style={{ color: "#566164" }}>{user?.email || "user@example.com"}</p>
                  </div>
                  <button className="text-sm font-bold" style={{ color: "#1e667f" }}>{t('settings.update')}</button>
                </div>
                <div className="flex justify-between items-center pb-4 border-b" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
                  <div>
                    <h4 className="font-bold">{t('settings.password')}</h4>
                    <p className="text-sm" style={{ color: "#566164" }}>{t('settings.passwordDesc')}</p>
                  </div>
                  <button className="text-sm font-bold" style={{ color: "#1e667f" }}>{t('settings.changePassword')}</button>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="p-8 rounded-3xl" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(169,180,183,0.15)" }}>
              <h2 className="text-2xl font-headline font-bold mb-6 flex items-center gap-2">
                <Icon name="notifications" style={{ color: "#1e667f" }} /> {t('settings.notifications')}
              </h2>
              <div className="space-y-6">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleNotification("emailAlerts")}>
                  <div>
                    <h4 className="font-bold">{t('settings.emailAlerts')}</h4>
                    <p className="text-sm" style={{ color: "#566164" }}>{t('settings.emailAlertsDesc')}</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors ${notifications.emailAlerts ? "bg-green-500" : "bg-gray-300"}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${notifications.emailAlerts ? "translate-x-6" : ""}`} />
                  </div>
                </div>
                
                <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleNotification("smsRecap")}>
                  <div>
                    <h4 className="font-bold">{t('settings.smsRecaps')}</h4>
                    <p className="text-sm" style={{ color: "#566164" }}>{t('settings.smsRecapsDesc')}</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors ${notifications.smsRecap ? "bg-green-500" : "bg-gray-300"}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${notifications.smsRecap ? "translate-x-6" : ""}`} />
                  </div>
                </div>

                <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleNotification("aiSuggestions")}>
                  <div>
                    <h4 className="font-bold">{t('settings.aiSuggestions')}</h4>
                    <p className="text-sm" style={{ color: "#566164" }}>{t('settings.aiSuggestionsDesc')}</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors ${notifications.aiSuggestions ? "bg-green-500" : "bg-gray-300"}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${notifications.aiSuggestions ? "translate-x-6" : ""}`} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Advanced Options */}
            <div className="p-8 rounded-3xl" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
              <h2 className="text-2xl font-headline font-bold mb-6 flex items-center gap-2" style={{ color: "#dc2626" }}>
                <Icon name="warning" style={{ color: "#dc2626" }} /> {t('settings.dangerZone')}
              </h2>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold" style={{ color: "#b91c1c" }}>{t('settings.deleteAccount')}</h4>
                  <p className="text-sm" style={{ color: "#dc2626" }}>{t('settings.deleteAccountDesc')}</p>
                </div>
                <button className="px-6 py-3 rounded-xl font-bold bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-colors">{t('settings.deleteProfileBtn')}</button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
