import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import Header from '../components/Header';
import Sidebar from "../components/Sidebar";

const Icon = ({ name, className = "", filled = false }) => (
  <span className={`material-symbols-outlined${filled ? " filled" : ""} ${className}`}>{name}</span>
);

const navLinks = [
  { icon: "grid_view", label: "Home", path: "/dashboard", active: true },
  { icon: "analytics", label: "Analysis", path: "/predict" },
  { icon: "medical_services", label: "Doctors", path: "/specialists" },
  { icon: "restaurant", label: "Diet Plan", path: "/diet-plan" },
  { icon: "settings", label: "Settings", path: "/settings" },
];

const defaultProfilePic = "https://lh3.googleusercontent.com/aida-public/AB6AXuABjtdH0s7cpGRMhnM-Pog3alc22WtlULMFSMISibmFkv0oaa5gn5gufFH8SaIS8BEQ8HZ0PidJ11hQ6Bd0Cw_AuiSs8DYIp8TgH1Jl1_RaWO7kGFVw_iyzSMBKV5SNKtkfOunKXQltoQ0DJnQv6lGK-n1diDT3k2HHpALuBOPxnfSD3ROO16B3PYtHHBMVKpnb3eVyGiHSk1eqIxoJPWslGpHEkjvSVyz1uSzVj6ndJaK3ONf-BQ7IKZ_bQ3aRdeM3RZK0oZQg";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef(null);

  const [recentReports, setRecentReports] = useState([]);
  const [showArchivesModal, setShowArchivesModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profilePicture, setProfilePicture] = useState(defaultProfilePic);
  const [profileData, setProfileData] = useState({
    bloodGroup: "O Positive",
    heartRate: "72 BPM",
    weight: "76.5 kg",
    sleepHours: "7.5",
    sleepQuality: "8"
  });

  useEffect(() => {
    if (user?.healthProfile) {
      setProfileData(user.healthProfile);
    }
    if (user?.profilePicture) {
      setProfilePicture(user.profilePicture);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsEditingProfile(false);
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { healthProfile: profileData });
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleProfileChange = (key, value) => {
    setProfileData(prev => ({ ...prev, [key]: value }));
  };

  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const base64Image = canvas.toDataURL("image/jpeg", 0.7);

        setProfilePicture(base64Image);

        if (user) {
          try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { profilePicture: base64Image });
            window.dispatchEvent(new Event("profilePictureUpdate"));
          } catch (error) {
            console.error("Error uploading profile picture:", error);
          }
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "reports"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentReports(reps);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div style={{ backgroundColor: "#f8fafb", color: "#2a3437", minHeight: "100vh" }}>
      {/* Top Navigation */}
      <Header />

      <div className="flex pt-20 pb-24 md:pb-0">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 max-w-6xl mx-auto px-6 py-10">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-extrabold font-headline tracking-tight mb-2" style={{ color: "#2a3437" }}>{t('dashboard.welcomeBack', { name: user?.name ? user.name.split(' ')[0] : 'User' })}</h1>
              <p style={{ color: "#566164" }} className="text-lg">{t('dashboard.upToDate')}</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => navigate("/upload")} className="px-6 py-4 rounded-xl font-headline font-bold flex items-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 transition-all" style={{ background: "linear-gradient(to bottom right, #1e667f, #075a72)", color: "#f0f9ff" }}>
                <Icon name="upload_file" /> {t('Upload Document')}
              </button>
              <button onClick={() => navigate("/predict")} className="px-6 py-4 rounded-xl font-headline font-bold flex items-center gap-2 transition-colors active:scale-95" style={{ backgroundColor: "#d6e5eb", color: "#465459" }}>
                <Icon name="description" /> {t('dashboard.analyzeReports')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              {/* Health Profile */}
              <div className="bg-white p-8 rounded-3xl border shadow-sm" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
                <div className="flex justify-between items-start mb-8">
                  <h2 className="text-2xl font-headline font-bold">{t('dashboard.healthProfile')}</h2>
                  {isEditingProfile ? (
                    <button onClick={handleSaveProfile} className="font-bold text-sm px-4 py-2 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                      {t('dashboard.saveProfile')}
                    </button>
                  ) : (
                    <button onClick={() => setIsEditingProfile(true)} className="font-bold text-sm" style={{ color: "#1e667f" }}>
                      {t('dashboard.editProfile')}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[
                    { key: "bloodGroup", label: t('dashboard.bloodGroup') },
                    { key: "heartRate", label: t('dashboard.heartRate') },
                    { key: "weight", label: t('dashboard.weight') }
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#566164" }}>{label}</p>
                      {isEditingProfile ? (
                        key === "bloodGroup" ? (
                          <select
                            value={profileData[key] || "Unknown"}
                            onChange={(e) => handleProfileChange(key, e.target.value)}
                            className="w-full text-base md:text-lg font-headline font-extrabold border-b border-gray-200 focus:border-[#1e667f] outline-none bg-transparent py-1 transition-colors cursor-pointer"
                            style={{ color: "#0d5c75" }}
                          >
                            <option value="A Positive">A Positive</option>
                            <option value="A Negative">A Negative</option>
                            <option value="B Positive">B Positive</option>
                            <option value="B Negative">B Negative</option>
                            <option value="AB Positive">AB Positive</option>
                            <option value="AB Negative">AB Negative</option>
                            <option value="O Positive">O Positive</option>
                            <option value="O Negative">O Negative</option>
                            <option value="Unknown">Unknown</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={profileData[key] || ""}
                            onChange={(e) => handleProfileChange(key, e.target.value)}
                            className="w-full text-lg md:text-xl font-headline font-extrabold border-b border-gray-300 focus:border-[#1e667f] outline-none bg-transparent py-1 transition-colors"
                            style={{ color: "#0d5c75" }}
                          />
                        )
                      ) : (
                        <p className={`font-headline font-extrabold truncate ${key === 'bloodGroup' ? 'text-base md:text-lg' : 'text-lg md:text-xl'}`} style={{ color: "#0d5c75" }}>{profileData[key] || "N/A"}</p>
                      )}
                    </div>
                  ))}

                  {/* Computed Sleep Score manually injected into grid view */}
                  <div className="space-y-1 relative">
                    <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#566164" }}>{t('dashboard.sleepScore')}</p>
                    {isEditingProfile ? (
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          step="0.5" 
                          value={profileData.sleepHours || "7.5"} 
                          onChange={(e) => handleProfileChange("sleepHours", e.target.value)} 
                          className="w-1/2 text-lg md:text-xl font-headline font-extrabold border-b border-gray-300 focus:border-[#1e667f] outline-none bg-transparent py-1 transition-colors" 
                          style={{ color: "#0d5c75" }} 
                          title={t('dashboard.hoursSlept')} 
                        />
                        <input 
                          type="number" 
                          min="1" 
                          max="10" 
                          value={profileData.sleepQuality || "8"} 
                          onChange={(e) => handleProfileChange("sleepQuality", e.target.value)} 
                          className="w-1/2 text-lg md:text-xl font-headline font-extrabold border-b border-gray-300 focus:border-[#1e667f] outline-none bg-transparent py-1 transition-colors" 
                          style={{ color: "#0d5c75" }} 
                          title={t('dashboard.sleepQuality')} 
                        />
                      </div>
                    ) : (
                      <p className="font-headline font-extrabold truncate text-lg md:text-xl" style={{ color: "#0d5c75" }}>
                        {(() => {
                           // Try to grab pre-existing textual score to not break backwards compatibility for old users.
                           // However if we implement our custom calculations, we calculate it dynamically.
                           const hrs = parseFloat(profileData.sleepHours || 7.5);
                           const qual = parseFloat(profileData.sleepQuality || 8);
                           if (isNaN(hrs) || isNaN(qual)) { return profileData.sleepScore || "0/100"; }
                           const durationScore = Math.min((hrs / 8) * 50, 50);
                           const qualScore = Math.min((qual / 10) * 50, 50);
                           const total = Math.round(durationScore + qualScore);
                           return `${total}/100`;
                        })()}
                      </p>
                    )}
                    {isEditingProfile && (
                       <div className="absolute top-[110%] w-full flex justify-between px-1" style={{color: "#a9b4b7", fontSize: '9px'}}>
                         <span>Hrs:</span>
                         <span>Qlty/10:</span>
                       </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Reports */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-headline font-bold">{t('dashboard.recentReports')}</h2>
                  <a onClick={() => setShowArchivesModal(true)} className="font-bold flex items-center gap-1 cursor-pointer transition-transform hover:translate-x-1" style={{ color: "#075a72" }}>{t('dashboard.viewArchives')} <Icon name="arrow_forward" className="text-sm" /></a>
                </div>
                <div className="space-y-4">
                  {recentReports.length > 0 ? recentReports.slice(0, 3).map((report) => (
                    <div key={report.id} onClick={() => navigate("/reports")} className="group cursor-pointer p-5 rounded-2xl flex items-center justify-between border border-transparent hover:border-gray-200 transition-all duration-300" style={{ backgroundColor: "#f0f4f6" }}>
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#bde9ff", color: "#055972" }}>
                          <Icon name={report.subtitle === "X-Ray Analysis" ? "radiology" : "lab_panel"} />
                        </div>
                        <div>
                          <h4 className="font-headline font-bold" style={{ color: "#2a3437" }}>{report.title}</h4>
                          <p className="text-sm" style={{ color: "#566164" }}>{report.subtitle} • {new Date(report.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 text-xs font-bold rounded-full uppercase tracking-tighter" style={{ backgroundColor: report.status === "Completed" ? "#dcfce7" : "#fef3c7", color: report.status === "Completed" ? "#15803d" : "#92400e" }}>{report.status || "Completed"}</span>
                    </div>
                  )) : (
                    <div className="p-8 text-center rounded-2xl border border-dashed" style={{ borderColor: "rgba(169,180,183,0.3)" }}>
                      <p style={{ color: "#566164" }}>{t('dashboard.noReports')}</p>
                      <button onClick={() => navigate("/upload")} className="mt-4 font-bold text-sm" style={{ color: "#1e667f" }}>{t('dashboard.uploadNow')}</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">

              {/* Upcoming */}
              <div className="p-8 rounded-3xl" style={{ backgroundColor: "#e1eaed" }}>
                <h3 className="text-xl font-headline font-bold mb-6">{t('dashboard.upcomingEvents')}</h3>
                <div className="space-y-6">
                  {[{ month: "Nov", day: "08", title: "Eye Exam Referral", sub: "Optimum Vision Care" }, { month: "Nov", day: "12", title: "General Checkup", sub: "Dr. Emily Watson" }].map(({ month, day, title, sub }) => (
                    <div key={title} onClick={() => setShowFeatureModal(true)} className="flex gap-4 items-start cursor-pointer transition-transform hover:translate-x-1 group">
                      <div className="bg-white w-14 h-14 flex flex-col items-center justify-center rounded-2xl shadow-sm group-hover:shadow-md transition-shadow">
                        <span className="text-[10px] font-bold uppercase" style={{ color: "#566164" }}>{month}</span>
                        <span className="text-xl font-bold" style={{ color: "#1e667f" }}>{day}</span>
                      </div>
                      <div>
                        <h4 className="font-headline font-bold text-sm">{title}</h4>
                        <p className="text-xs" style={{ color: "#566164" }}>{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-3 z-50 rounded-t-3xl" style={{ backgroundColor: "rgba(248,250,251,0.8)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(169,180,183,0.15)" }}>
        {[{ icon: "home", label: "Home", path: "/dashboard", active: true }, { icon: "description", label: "Reports", path: "/reports" }, { icon: "add_circle", label: "Upload", path: "/upload" }, { icon: "smart_toy", label: "AI Chat", path: "/ai-chat" }].map(({ icon, label, path, active }) => (
          <a key={label} onClick={() => navigate(path)} className="flex flex-col items-center cursor-pointer" style={{ color: active ? "#055972" : "#566164", backgroundColor: active ? "#bde9ff" : "transparent", borderRadius: active ? "1rem" : "0", padding: active ? "0.5rem 1.5rem" : "0" }}>
            <Icon name={icon} /><span style={{ fontSize: "10px" }} className="uppercase tracking-wider mt-1">{label}</span>
          </a>
        ))}
      </nav>

      {/* Archives Modal */}
      {showArchivesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-[#f8fafb]">
              <h2 className="text-2xl font-headline font-extrabold text-[#0d5c75]">{t('dashboard.reportArchives')}</h2>
              <button onClick={() => setShowArchivesModal(false)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                <Icon name="close" className="text-gray-600" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-4 bg-white flex-1">
              {recentReports.length > 0 ? recentReports.map((report) => (
                <div key={report.id} onClick={() => { setShowArchivesModal(false); navigate("/reports"); }} className="group cursor-pointer p-5 rounded-2xl flex items-center justify-between border border-transparent hover:border-[#bde9ff] bg-[#f0f4f6] transition-all duration-300">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#bde9ff] text-[#055972]">
                      <Icon name={report.subtitle === "X-Ray Analysis" ? "radiology" : "lab_panel"} />
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-[#2a3437]">{report.title}</h4>
                      <p className="text-sm text-[#566164]">{report.subtitle} • {new Date(report.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs font-bold rounded-full uppercase tracking-tighter" style={{ backgroundColor: report.status === "Completed" ? "#dcfce7" : "#fef3c7", color: report.status === "Completed" ? "#15803d" : "#92400e" }}>{report.status || "Completed"}</span>
                </div>
              )) : (
                <div className="p-12 text-center text-gray-500 font-medium">
                  {t('dashboard.noArchives')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feature Coming Soon Modal */}
      {showFeatureModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowFeatureModal(false)}>
          <div className="bg-white rounded-[2rem] w-full max-w-sm flex flex-col py-10 px-8 shadow-2xl text-center transform scale-100 transition-transform" onClick={(e) => e.stopPropagation()}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner" style={{ backgroundColor: "#e2eef3" }}>
              <Icon name="rocket_launch" filled className="text-4xl" style={{ color: "#0d5c75" }} />
            </div>
            <h2 className="text-3xl font-headline font-extrabold mb-3" style={{ color: "#0d5c75" }}>Coming Soon!</h2>
            <p className="text-sm font-medium mb-8" style={{ color: "#566164", lineHeight: "1.6" }}>
              This feature is currently in development. Calendar integration and event tracking will be fully unlocked in upcoming updates!
            </p>
            <button 
              onClick={() => setShowFeatureModal(false)} 
              className="w-full py-4 rounded-xl font-headline font-bold transition-transform hover:scale-[1.02] active:scale-95 shadow-md flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #1e667f, #075a72)", color: "#f0f9ff" }}
            >
              <Icon name="check" /> Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

