import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useTranslation } from "react-i18next";

const Icon = ({ name, className = "" }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const fileInputRef = useRef(null);

  const navLinks = [
    { icon: "grid_view", label: "Home", path: "/dashboard" },
    { icon: "analytics", label: "Analysis", path: "/predict" },
    { icon: "medical_services", label: "Consultants", path: "/specialists" },
    { icon: "restaurant", label: "Diet Plan", path: "/diet-plan" },
    { icon: "settings", label: "Settings", path: "/settings" },
  ];

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

        if (user) {
          try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { profilePicture: base64Image });
          } catch (error) {
            console.error("Error uploading profile picture:", error);
          }
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const defaultProfilePic = "https://lh3.googleusercontent.com/aida-public/AB6AXuABjtdH0s7cpGRMhnM-Pog3alc22WtlULMFSMISibmFkv0oaa5gn5gufFH8SaIS8BEQ8HZ0PidJ11hQ6Bd0Cw_AuiSs8DYIp8TgH1Jl1_RaWO7kGFVw_iyzSMBKV5SNKtkfOunKXQltoQ0DJnQv6lGK-n1diDT3k2HHpALuBOPxnfSD3ROO16B3PYtHHBMVKpnb3eVyGiHSk1eqIxoJPWslGpHEkjvSVyz1uSzVj6ndJaK3ONf-BQ7IKZ_bQ3aRdeM3RZK0oZQg";
  const currentProfilePic = user?.profilePicture || defaultProfilePic;

  return (
    <aside className={`hidden md:flex flex-col py-8 px-4 h-[calc(100vh-5rem)] border-r sticky top-20 transition-all duration-300 relative ${isSidebarCollapsed ? "w-24 items-center" : "w-72"}`} style={{ borderColor: "rgba(169,180,183,0.15)", backgroundColor: "#f8fafb" }}>
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="absolute -right-3 top-10 bg-white border rounded-full p-1 shadow-sm hover:scale-110 transition-transform z-10 flex items-center justify-center text-[#566164]"
        style={{ borderColor: "rgba(169,180,183,0.3)" }}
      >
        <Icon name={isSidebarCollapsed ? "chevron_right" : "chevron_left"} className="text-[18px]" />
      </button>
      <div className={`flex items-center gap-4 mb-10 ${isSidebarCollapsed ? "justify-center" : "px-2"}`}>
        <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()} title="Change Profile Picture">
          <img src={currentProfilePic} alt="User" className="w-12 h-12 rounded-xl object-cover transition-opacity group-hover:opacity-75" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Icon name="photo_camera" className="text-white text-[20px] drop-shadow-md" />
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
        </div>
        {!isSidebarCollapsed && (
          <div>
            <h3 className="font-headline font-bold" style={{ color: "#2a3437" }}>{user?.name || "User"}</h3>
            <p className="text-xs" style={{ color: "#566164" }}>{t('sidebar.userAccount', 'User Account')}</p>
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-1 w-full">
        {navLinks.map(({ icon, label, path }) => {
          const active = location.pathname.startsWith(path);
          return (
            <a key={label} onClick={() => navigate(path)} className={`flex items-center rounded-lg cursor-pointer transition-all w-full ${active ? "font-semibold" : ""} ${isSidebarCollapsed ? "justify-center py-3" : "gap-3 px-4 py-3"}`} style={{ backgroundColor: active ? "rgba(189,233,255,0.2)" : "transparent", color: active ? "#0d5c75" : "#566164" }} title={isSidebarCollapsed ? label : ""}>
              <Icon name={icon} className="shrink-0" />
              {!isSidebarCollapsed && <span className="text-sm">{label}</span>}
            </a>
          );
        })}
      </nav>
      <div className="mt-auto space-y-1 w-full">
        <a onClick={logout} className={`flex items-center rounded-lg cursor-pointer transition-colors w-full ${isSidebarCollapsed ? "justify-center py-3" : "gap-3 px-4 py-3"}`} style={{ color: "#566164" }} title={isSidebarCollapsed ? "Logout" : ""}>
          <Icon name="logout" className="shrink-0" />
          {!isSidebarCollapsed && <span className="text-sm">Logout</span>}
        </a>
      </div>
    </aside>
  );
}
