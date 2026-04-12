import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// ─── NAV ────────────────────────────────────────────────────────────────────
function Navbar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <nav
      className="fixed top-0 w-full z-50 px-8 h-20 flex justify-between items-center"
      style={{ backgroundColor: "#f8fafb", maxWidth: "96rem", margin: "0 auto", left: 0, right: 0 }}
    >
      <div className="flex items-center gap-12">
        <span
          className="text-2xl font-extrabold tracking-tight cursor-pointer"
          style={{ color: "#0d5c75", fontFamily: "Manrope", letterSpacing: "-0.02em" }}
          onClick={() => navigate("/")}
        >
          {t('brand')}
        </span>
        <div className="hidden md:flex items-center gap-8 font-bold tracking-tight" style={{ fontFamily: "Manrope" }}>
          <a onClick={() => navigate("/dashboard")} className="cursor-pointer transition-colors duration-300" style={{ color: "#566164" }}>{t('nav.dashboard')}</a>
          <a onClick={() => navigate("/reports")} className="cursor-pointer transition-colors duration-300" style={{ color: "#566164" }}>{t('nav.reports')}</a>
          <a onClick={() => navigate("/predict")} className="cursor-pointer transition-colors duration-300" style={{ color: "#566164" }}>{t('nav.analysis')}</a>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button
          onClick={() => navigate("/upload")}
          className="px-6 py-2.5 rounded-xl font-semibold shadow-sm transition-all"
          style={{ background: "linear-gradient(135deg, #1e667f, #075a72)", color: "#f0f9ff" }}
        >
          {t('nav.uploadDoc')}
        </button>
        <span className="material-symbols-outlined cursor-pointer" style={{ color: "#0d5c75" }} onClick={() => navigate("/dashboard")}>
          account_circle
        </span>
      </div>
    </nav>
  );
}

// ─── HERO ────────────────────────────────────────────────────────────────────
function HeroSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <section className="grid lg:grid-cols-2 gap-16 items-center mb-32">
      <div className="space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest" style={{ backgroundColor: "#d6e5eb", color: "#465459" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>verified</span>
          {t('landing.badge')}
        </div>
        <h1 className="text-6xl font-extrabold leading-tight tracking-tight" style={{ color: "#2a3437" }}>
          {t('landing.heroTitle1')} <br />
          <span className="italic" style={{ color: "#1e667f" }}>{t('landing.heroTitle2')}</span>
        </h1>
        <p className="text-xl leading-relaxed max-w-lg" style={{ color: "#566164" }}>
          {t('landing.heroSubtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold transition-all shadow-sm border"
            style={{ backgroundColor: "#ffffff", color: "#2a3437", borderColor: "rgba(114,125,128,0.3)" }}
          >
            <img alt="Google logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCNuamLP3vqhpbaRZs1NDxeCIiaevoHawW04qXmOtZ_yzn-2ntyL-OTsaVPIrNx5rctbXf4tMVzBqAE--tUyEcEVYrwMle2N-QZCKjXmkYTNPKedeOzlIm4HheAdfoCNRHfj8-t_qoHTjL29S2QrrMOLJ7tCqfvj-iAGYmN73ZIi-Mfv7CufgGHU3tocqcQ4OnR5ll5xpICzlwnr_xOPvVRWmU9pu79-jwIr7ECsEzGH1326wkvGxMTpinJv4MF9CQuAMDyKLC" />
            {t('landing.signInGoogle')}
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            style={{ backgroundColor: "#bde9ff", color: "#055972" }}
          >
            {t('landing.explorePlatform')}
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
      <div className="relative">
        <div className="overflow-hidden shadow-2xl relative group" style={{ aspectRatio: "4/5", borderRadius: "2rem", backgroundColor: "#f0f4f6" }}>
          <img className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 transition-all duration-700" style={{ filter: "grayscale(1)" }} src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhoVAgTY1Ej3dNl8T79EttZUCIfdJ7llw_XT9G1AdCOuWVKDJvYNuNCJpzCHOKhg8C6lEpYzvq_F75fnxhP80NIZX18zmV_VuvraqSGxc39_se13VUA4wPKjOafvBhPxbLhuJpoK0k698WQMpCzq-LUWjV5Qcl-TsklyQDwRt_j-R57r59D8o6szuh2eeaHpxnUEJU-FdDGaFZ-G1WsW_nBt_VCJS2uYWBkQjVa93OerPy4B_1xZsgPsXFdXDKiLki2118_k8Y" alt="Modern clinical examination room" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(42,52,55,0.4), transparent)" }} />
          <div className="absolute bottom-8 left-8 right-8">
            <div className="glass-pill p-6 rounded-2xl shadow-lg border border-white/20">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#bde9ff" }}>
                  <span className="material-symbols-outlined" style={{ color: "#055972" }}>query_stats</span>
                </div>
                <div>
                  <p className="font-bold" style={{ color: "#2a3437" }}>Analysis Progress</p>
                  <p className="text-xs" style={{ color: "#566164" }}>98% Accuracy Achieved</p>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#e1eaed" }}>
                <div className="h-full rounded-full" style={{ width: "92%", backgroundColor: "#1e667f" }} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -top-10 -right-10 hidden lg:block glass-pill p-6 shadow-xl border border-white/40" style={{ borderRadius: "1.5rem", width: "16rem" }}>
          <span className="material-symbols-outlined mb-2" style={{ color: "#1e667f" }}>shield_with_heart</span>
          <h3 className="font-bold" style={{ color: "#2a3437" }}>HIPAA Compliant</h3>
          <p className="text-sm mt-1" style={{ color: "#566164" }}>Encrypted, private, and secure storage for all clinical data.</p>
        </div>
      </div>
    </section>
  );
}

// ─── BENTO GRID ──────────────────────────────────────────────────────────────
function BentoGrid() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <section className="mb-32">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-extrabold tracking-tight mb-4" style={{ color: "#2a3437" }}>{t('landing.precisionEngine')}</h2>
        <p className="max-w-2xl mx-auto" style={{ color: "#566164" }}>{t('landing.precisionDesc')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6" style={{ minHeight: "600px" }}>
        <div onClick={() => navigate("/predict")} className="md:col-span-8 rounded-3xl p-10 flex flex-col justify-between group overflow-hidden relative cursor-pointer hover:shadow-lg transition-shadow" style={{ backgroundColor: "#f0f4f6" }}>
          <div className="relative z-10">
            <span className="material-symbols-outlined text-4xl mb-6 block" style={{ color: "#1e667f" }}>bloodtype</span>
            <h3 className="text-3xl font-bold mb-4" style={{ color: "#2a3437" }}>Blood Analysis</h3>
            <p className="max-w-md" style={{ color: "#566164" }}>Deconstruct CBC, metabolic panels, and lipid profiles into understandable trends with visual benchmarks.</p>
          </div>
          <div className="mt-8 flex gap-3 flex-wrap">
            {["Trend Visualization", "Anomalous Marker Detection"].map((tag) => (
              <span key={tag} className="px-4 py-2 rounded-full text-xs font-semibold border" style={{ backgroundColor: "#ffffff", color: "#566164", borderColor: "rgba(114,125,128,0.1)" }}>{tag}</span>
            ))}
          </div>
        </div>
        <div onClick={() => navigate("/upload")} className="md:col-span-4 rounded-3xl p-10 flex flex-col justify-between cursor-pointer hover:shadow-lg transition-shadow" style={{ backgroundColor: "#bde9ff" }}>
          <div>
            <span className="material-symbols-outlined text-4xl mb-6 block" style={{ color: "#055972" }}>prescriptions</span>
            <h3 className="text-2xl font-bold mb-4" style={{ color: "#055972" }}>Prescriptions</h3>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(5,89,114,0.8)" }}>AI-powered drug interaction checks and simplified dosage schedules for clarity.</p>
          </div>
          <button onClick={() => navigate("/upload")} className="w-full py-4 rounded-xl font-bold mt-8 flex items-center justify-center gap-2" style={{ backgroundColor: "#055972", color: "#f0f9ff" }}>
            Get Started <span className="material-symbols-outlined">add</span>
          </button>
        </div>
        <div onClick={() => navigate("/predict")} className="md:col-span-4 rounded-3xl p-10 flex flex-col justify-between border shadow-sm group cursor-pointer hover:shadow-lg transition-shadow" style={{ backgroundColor: "#ffffff", borderColor: "rgba(114,125,128,0.15)" }}>
          <div>
            <span className="material-symbols-outlined text-4xl mb-6 block" style={{ color: "#536166" }}>biotech</span>
            <h3 className="text-2xl font-bold mb-4" style={{ color: "#2a3437" }}>Health Predictions</h3>
            <p className="text-sm leading-relaxed" style={{ color: "#566164" }}>Heart, Diabetes, Kidney Disease, and CBC analysis powered by trained ML models.</p>
          </div>
          <div className="mt-6 flex items-center justify-between font-bold text-sm cursor-pointer" style={{ color: "#1e667f" }}>
            <span>Start Analysis</span>
            <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">arrow_forward</span>
          </div>
        </div>
        <div onClick={() => navigate("/upload")} className="md:col-span-8 rounded-3xl p-10 flex items-center gap-12 group cursor-pointer hover:shadow-lg transition-shadow" style={{ backgroundColor: "#d9e4e8" }}>
          <div className="flex-1">
            <span className="material-symbols-outlined text-4xl mb-6 block" style={{ color: "#2a3437" }}>radiology</span>
            <h3 className="text-3xl font-bold mb-4" style={{ color: "#2a3437" }}>X-Ray Reports</h3>
            <p style={{ color: "#566164" }}>Automated summarization of radiographic findings, highlighting key bone and tissue observations.</p>
          </div>
          <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-inner hidden lg:block" style={{ backgroundColor: "#ffffff" }}>
            <img className="w-full h-full object-cover opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBc320Xu17mOpwCOHz72mPMr_FefRxBVmJ0k2Gb1nr9TNC35S4n8T8rwOVLklRqdNe2oYrpxFMDiL30gp3bH4DClNRzEgCgbA2qGANszCEBAUcQQbft0QdvIKUK-6DfithL993MjDDE9TABlJ6UGFGziN2BHLGWJnsg6S81eELDTnUs80TOOgeo2aYtYEAz77rTLdGE0UAwNwArt8OkoNf4wAJH9mXDrl7iS-1kcTTTAGaJ5u18DUTdkKcUQzgoBpXvvcsQVIcI" alt="X-ray of human hand" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA SECTION ─────────────────────────────────────────────────────────────
function CTASection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <section className="text-center py-24 px-8 rounded-[3rem] relative overflow-hidden" style={{ backgroundColor: "#2a3437" }}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#1e667f 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      <div className="relative z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight" style={{ color: "#f0f9ff" }}>{t('landing.ctaTitle')}</h2>
        <p className="text-lg mb-12 max-w-xl mx-auto" style={{ color: "#9eddfa" }}>{t('landing.ctaSubtitle')}</p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <button onClick={() => navigate("/upload")} className="px-10 py-5 rounded-xl font-bold text-lg transition-all shadow-xl" style={{ backgroundColor: "#1e667f", color: "#f0f9ff" }}>{t('landing.uploadReports')}</button>
          <button onClick={() => navigate("/predict")} className="bg-transparent border px-10 py-5 rounded-xl font-bold text-lg transition-all" style={{ borderColor: "rgba(30,102,127,0.3)", color: "#f0f9ff" }}>{t('landing.tryPredictions')}</button>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
const footerLinks = {
  Platform: ["Blood Analysis", "Imaging Suite", "AI Consultation", "Data Privacy"],
  Company: ["About Us", "Clinical Standards", "Press Room", "Contact"],
  Resources: ["User Guides", "Medical Glossary", "Privacy Policy", "Terms of Service"],
};

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="px-8 pt-20 pb-32" style={{ backgroundColor: "#f8fafb", maxWidth: "96rem", margin: "0 auto" }}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-16 border-b" style={{ borderColor: "rgba(114,125,128,0.15)" }}>
        <div className="md:col-span-1">
          <span className="text-2xl font-extrabold mb-6 block tracking-tight" style={{ color: "#0d5c75", fontFamily: "Manrope", letterSpacing: "-0.02em" }}>{t('brand')}</span>
          <p className="text-sm leading-relaxed" style={{ color: "#566164" }}>{t('landing.footerDesc')}</p>
        </div>
        {Object.entries(footerLinks).map(([category, links]) => (
          <div key={category}>
            <h4 className="font-bold mb-6" style={{ color: "#2a3437" }}>{category}</h4>
            <ul className="space-y-4 text-sm" style={{ color: "#566164" }}>
              {links.map((link) => (<li key={link}><a href="#" className="hover:text-primary transition-colors">{link}</a></li>))}
            </ul>
          </div>
        ))}
      </div>
      <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-xs font-medium" style={{ color: "#566164" }}>{t('landing.copyright')}</p>
      </div>
    </footer>
  );
}

// ─── MOBILE BOTTOM NAV ───────────────────────────────────────────────────────
function MobileBottomNav() {
  const navigate = useNavigate();
  const [active, setActive] = useState("Home");
  const items = [
    { icon: "home", label: "Home", path: "/" },
    { icon: "description", label: "Reports", path: "/reports" },
    { icon: "add_circle", label: "Upload", path: "/upload" },
    { icon: "smart_toy", label: "AI Chat", path: "/ai-chat" },
  ];
  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-3 z-50 rounded-t-3xl" style={{ backgroundColor: "rgba(248,250,251,0.8)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(169,180,183,0.15)", boxShadow: "0px -12px 32px rgba(42,52,55,0.06)" }}>
      {items.map(({ icon, label, path }) => {
        const isActive = active === label;
        return (
          <button key={label} onClick={() => { setActive(label); navigate(path); }} className="flex flex-col items-center justify-center px-6 py-2 rounded-2xl transition-all" style={{ backgroundColor: isActive ? "#bde9ff" : "transparent", color: isActive ? "#055972" : "#566164" }}>
            <span className="material-symbols-outlined">{icon}</span>
            <span className="text-xs uppercase tracking-wider mt-1" style={{ fontFamily: "Inter", fontSize: "10px" }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="text-on-surface" style={{ color: "#2a3437" }}>
      <Navbar />
      <main className="pt-32 pb-20 px-8" style={{ maxWidth: "96rem", margin: "0 auto" }}>
        <HeroSection />
        <BentoGrid />
        <CTASection />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

