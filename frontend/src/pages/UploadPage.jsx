import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "../context/AnalysisContext";
import { useTranslation } from "react-i18next";
import { analyzeReport, analyzeXray } from "../api";
import { db } from "../firebase";
import { addDoc, collection } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";

const Icon = ({ name, filled = false, className = "" }) => (
  <span className={`material-symbols-outlined${filled ? " filled" : ""} ${className}`}>{name}</span>
);

const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg"];

function getFileExtension(name) {
  return name.split(".").pop().toLowerCase();
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function UploadPage() {
  const navigate = useNavigate();
  const { setResult } = useAnalysis();
  const { user } = useAuth();
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisType, setAnalysisType] = useState("report"); // report | xray
  const [language, setLanguage] = useState("English (Default)");
  const [error, setError] = useState(null);

  const handleFiles = useCallback((fileList) => {
    const newFiles = Array.from(fileList).filter((f) => {
      const ext = getFileExtension(f.name);
      return ALLOWED_EXTENSIONS.includes(ext);
    });
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); };
  const handleBrowse = () => fileInputRef.current?.click();
  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));
  const clearAll = () => setFiles([]);

  const handleAnalyze = async () => {
    if (files.length === 0) { setError("Please upload at least one file."); return; }
    setIsAnalyzing(true); setError(null); setAnalysisProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setAnalysisProgress((p) => Math.min(p + Math.random() * 15, 85));
      }, 500);

      // Detect if it's an X-ray based on filename heuristics
      const file = files[0];
      const isXray = file.name.toLowerCase().includes("xray") ||
                     file.name.toLowerCase().includes("x-ray") ||
                     file.name.toLowerCase().includes("chest") ||
                     analysisType === "xray";

      let result;
      if (isXray && getFileExtension(file.name) !== "pdf") {
        result = await analyzeXray(file, language);
      } else {
        result = await analyzeReport(file, language);
      }

      if (user) {
        await addDoc(collection(db, "users", user.uid, "reports"), {
          title: file.name,
          subtitle: analysisType === "xray" ? "X-Ray Analysis" : "Medical Report",
          status: "Completed",
          createdAt: new Date().toISOString()
        });
      }

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      setTimeout(() => {
        setResult(result.type, result);
        navigate("/reports");
      }, 500);

    } catch (err) {
      setError(err.message);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  return (
    <div style={{ backgroundColor: "#f8fafb", color: "#2a3437", minHeight: "100vh" }}>
      <Header />

      <main className="pt-28 pb-24 px-6 max-w-6xl mx-auto">
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-5xl font-extrabold font-headline tracking-tight mb-4">{t('upload.title')}</h1>
          <p className="text-lg max-w-2xl" style={{ color: "#566164" }}>{t('upload.subtitle')}</p>
        </div>

        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 font-headline font-semibold mb-10 hover:underline" style={{ color: "#2a3437" }}>
          <Icon name="arrow_back" /> {t('upload.backToHome')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-2xl" style={{ backgroundColor: "#f0f4f6" }}>
              <p className="text-xs uppercase font-bold tracking-widest mb-4" style={{ color: "#566164" }}>{t('upload.processingLang')}</p>
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border" style={{ borderColor: "rgba(169,180,183,0.2)" }}>
                <Icon name="language" style={{ color: "#1e667f" }} />
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-transparent border-none outline-none flex-1 text-sm font-bold cursor-pointer" style={{ color: "#2a3437" }}>
                  <option>English (Default)</option>
                  <option>Hindi</option>
                </select>
              </div>
              <p className="text-xs mt-3" style={{ color: "#566164" }}>{t('upload.comfortLang')}</p>
            </div>
            <div className="p-6 rounded-2xl" style={{ backgroundColor: "#f0f4f6" }}>
              <p className="text-xs uppercase font-bold tracking-widest mb-4" style={{ color: "#566164" }}>{t('upload.analysisType')}</p>
              <div className="flex gap-3">
                <button onClick={() => setAnalysisType("report")} className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${analysisType === "report" ? "shadow" : ""}`} style={{ backgroundColor: analysisType === "report" ? "#bde9ff" : "white", color: analysisType === "report" ? "#055972" : "#566164" }}>
                  📄 Report
                </button>
                <button onClick={() => setAnalysisType("xray")} className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${analysisType === "xray" ? "shadow" : ""}`} style={{ backgroundColor: analysisType === "xray" ? "#bde9ff" : "white", color: analysisType === "xray" ? "#055972" : "#566164" }}>
                  🩻 X-Ray
                </button>
              </div>
            </div>
            <div className="p-6 rounded-2xl" style={{ backgroundColor: "#e8eff1" }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon name="verified_user" style={{ color: "#1e667f" }} />
                <h3 className="font-headline font-bold" style={{ color: "#1e667f" }}>{t('upload.privacyFirst')}</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#1e667f" }}>{t('upload.privacyDesc')}</p>
            </div>
          </div>

          {/* Right Panel — Upload Zone */}
          <div className="lg:col-span-8 space-y-6">
            {/* Drop Zone */}
            <div
              onClick={handleBrowse}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="cursor-pointer p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-300 text-center"
              style={{
                borderColor: isDragging ? "#1e667f" : "rgba(169,180,183,0.3)",
                backgroundColor: isDragging ? "rgba(189,233,255,0.15)" : "#f0f4f6",
                minHeight: "280px",
              }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: "#d9e4e8" }}>
                <Icon name="cloud_upload" className="text-3xl" style={{ color: "#1e667f" }} />
              </div>
              <h3 className="text-2xl font-headline font-bold mb-2">{t('upload.dragDrop')}</h3>
              <p style={{ color: "#566164" }}>{t('upload.orBrowse')} <span className="underline font-bold">{t('upload.browsFiles')}</span> {t('upload.fromDevice')}</p>
              <div className="flex gap-3 mt-4 flex-wrap justify-center">
                {ALLOWED_EXTENSIONS.map((ext) => (
                  <span key={ext} className="px-3 py-1 text-xs font-bold rounded-full uppercase" style={{ backgroundColor: "#d9e4e8", color: "#465459" }}>{ext}</span>
                ))}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={(e) => handleFiles(e.target.files)} />
            </div>

            {/* Analysis Progress */}
            {isAnalyzing && (
              <div className="p-6 rounded-2xl animate-fade-in" style={{ backgroundColor: "#f0f4f6" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#bde9ff" }}>
                      <Icon name="description" style={{ color: "#055972" }} />
                    </div>
                    <div>
                      <h4 className="font-headline font-bold">{files[0]?.name}</h4>
                      <p className="text-sm" style={{ color: "#566164" }}>
                        {analysisProgress < 100 ? "Analyzing..." : "Complete!"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xl font-headline font-bold" style={{ color: "#1e667f" }}>{Math.round(analysisProgress)}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#d9e4e8" }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${analysisProgress}%`, backgroundColor: "#1e667f" }} />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 rounded-2xl animate-fade-in flex items-center gap-3" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
                <Icon name="error" style={{ color: "#dc2626" }} />
                <p className="font-semibold text-sm" style={{ color: "#b91c1c" }}>{error}</p>
              </div>
            )}

            {/* File List */}
            {files.length > 0 && !isAnalyzing && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs uppercase font-bold tracking-widest" style={{ color: "#566164" }}>{t('upload.readyForAnalysis')} ({files.length})</p>
                  <button onClick={clearAll} className="font-bold text-sm" style={{ color: "#dc2626" }}>{t('upload.clearAll')}</button>
                </div>
                <div className="space-y-3">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl" style={{ backgroundColor: "#f0f4f6" }}>
                      <div className="flex items-center gap-4">
                        <Icon name={getFileExtension(file.name) === "pdf" ? "picture_as_pdf" : "image"} style={{ color: "#566164" }} />
                        <div>
                          <p className="font-headline font-bold text-sm">{file.name}</p>
                          <p className="text-xs" style={{ color: "#566164" }}>{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button onClick={() => removeFile(idx)} className="p-1 rounded-lg hover:bg-gray-200 transition-colors">
                        <Icon name="close" style={{ color: "#566164" }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analyze Button */}
            {files.length > 0 && !isAnalyzing && (
              <div className="flex justify-end">
                <button
                  onClick={handleAnalyze}
                  className="px-10 py-4 rounded-xl font-headline font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                  style={{ background: "linear-gradient(135deg, #1e667f, #075a72)", color: "#f0f9ff" }}
                >
                  {t('upload.startAIAnalysis')}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

