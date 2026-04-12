import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { predictHeart, predictDiabetes, predictKidney, predictCBC, predictMRI, predictLungCT, getModelInfo } from "../api";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const Icon = ({ name, filled = false, className = "" }) => (
  <span className={`material-symbols-outlined${filled ? " filled" : ""} ${className}`}>{name}</span>
);

const TABS = [
  { key: "heart", label: "Heart Disease", icon: "cardiology", color: "#dc2626", bgColor: "#fef2f2", gradient: "linear-gradient(135deg, #ef4444, #dc2626)", type: "form" },
  { key: "diabetes", label: "Diabetes", icon: "bloodtype", color: "#7c3aed", bgColor: "#f5f3ff", gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)", type: "form" },
  { key: "kidney", label: "Kidney Disease", icon: "nephrology", color: "#0891b2", bgColor: "#ecfeff", gradient: "linear-gradient(135deg, #06b6d4, #0891b2)", type: "form" },
  { key: "cbc", label: "Blood Report (CBC)", icon: "labs", color: "#059669", bgColor: "#ecfdf5", gradient: "linear-gradient(135deg, #10b981, #059669)", type: "form" },
  { key: "mri", label: "MRI Brain Scan", icon: "neurology", color: "#9333ea", bgColor: "#faf5ff", gradient: "linear-gradient(135deg, #a855f7, #7c3aed)", type: "image" },
  { key: "lung", label: "Lung CT Scan", icon: "pulmonology", color: "#ea580c", bgColor: "#fff7ed", gradient: "linear-gradient(135deg, #f97316, #ea580c)", type: "image" },
];

const sideNavLinks = [
  { icon: "grid_view", label: "Home", path: "/dashboard" },
  { icon: "analytics", label: "Analysis", path: "/predict", active: true },
  { icon: "medical_services", label: "Consultants", path: "/specialists" },
  { icon: "restaurant", label: "Diet Plan", path: "/diet-plan" },
  { icon: "settings", label: "Settings", path: "/settings" },
];

const severityUI = {
  Low: { bg: "#dcfce7", color: "#15803d", icon: "check_circle", text: "No Risk Detected" },
  Moderate: { bg: "#fef3c7", color: "#92400e", icon: "info", text: "Moderate Risk" },
  High: { bg: "#fef2f2", color: "#dc2626", icon: "warning", text: "Risk Detected" },
};

const SPECIALIST_MAP = {
  heart: { specialist: "Cardiologist", icon: "cardiology", dept: "Cardiology / Heart Care", tip: "Monitor blood pressure & cholesterol regularly. Maintain a heart-healthy diet low in sodium and saturated fats." },
  diabetes: { specialist: "Endocrinologist", icon: "endocrinology", dept: "Endocrinology / Diabetes Care", tip: "Monitor blood sugar levels regularly. Maintain a balanced diet and exercise routine." },
  kidney: { specialist: "Nephrologist", icon: "nephrology", dept: "Nephrology / Kidney Care", tip: "Stay hydrated, limit salt intake, and monitor kidney function with regular blood tests." },
  cbc: { specialist: "Hematologist", icon: "labs", dept: "Hematology / Blood Disorders", tip: "Include iron-rich foods in your diet. Get regular blood tests to monitor your condition." },
  mri: { specialist: "Neurologist / Neurosurgeon", icon: "neurology", dept: "Neurology / Neurosurgery", tip: "Follow up with imaging tests as recommended. Avoid stress and maintain regular sleep patterns." },
  lung: { specialist: "Pulmonologist / Oncologist", icon: "pulmonology", dept: "Pulmonology / Chest Medicine", tip: "Avoid smoking and air pollution. Follow up with a PET scan or biopsy if recommended." },
};

export default function HealthPredictPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("heart");
  const [features, setFeatures] = useState([]);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingFeatures, setLoadingFeatures] = useState(false);

  // Image upload states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const tab = TABS.find((t) => t.key === activeTab);

  // Load features when tab changes (only for form-based tabs)
  useEffect(() => {
    setResult(null);
    setError(null);
    setFormData({});
    setSelectedImage(null);
    setImagePreview(null);

    if (tab?.type === "form") {
      setLoadingFeatures(true);
      getModelInfo(activeTab)
        .then((info) => {
          setFeatures(info.features);
          const initial = {};
          info.features.forEach((f) => { initial[f.name] = ""; });
          setFormData(initial);
        })
        .catch((err) => {
          setError("Could not load model info. Is the backend running?");
          setFeatures([]);
        })
        .finally(() => setLoadingFeatures(false));
    } else {
      setFeatures([]);
      setLoadingFeatures(false);
    }
  }, [activeTab]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Image upload handlers
  const handleImageSelect = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["png", "jpg", "jpeg"].includes(ext)) {
      setError("Invalid file type. Please upload PNG or JPG image.");
      return;
    }
    setSelectedImage(file);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleImageSelect(e.dataTransfer.files[0]);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (tab?.type === "image") {
        // Image-based prediction
        if (!selectedImage) {
          throw new Error("Please select an image to analyze.");
        }
        let res;
        if (activeTab === "mri") {
          res = await predictMRI(selectedImage);
        } else if (activeTab === "lung") {
          res = await predictLungCT(selectedImage);
        }
        setResult(res);
      } else {
        // Form-based prediction
        const numericData = {};
        for (const [key, val] of Object.entries(formData)) {
          if (val === "" || val === null || val === undefined) {
            throw new Error(`Please fill in all fields. Missing: ${key}`);
          }
          numericData[key] = parseFloat(val);
        }

        let res;
        switch (activeTab) {
          case "heart": res = await predictHeart(numericData); break;
          case "diabetes": res = await predictDiabetes(numericData); break;
          case "kidney": res = await predictKidney(numericData); break;
          case "cbc": res = await predictCBC(numericData); break;
        }
        setResult(res);
        fetchAISuggestion(res);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fillSampleData = () => {
    const samples = {
      heart: { age: 55, sex: 1, cp: 0, trestbps: 130, chol: 250, fbs: 0, restecg: 1, thalach: 150, exang: 0, oldpeak: 1.5, slope: 1, ca: 0, thal: 1 },
      diabetes: { Pregnancies: 2, Glucose: 120, BloodPressure: 70, SkinThickness: 20, Insulin: 80, BMI: 25.5, DiabetesPedigreeFunction: 0.5, Age: 45 },
      kidney: { age: 55, bp: 80, sg: 1.020, al: 0, su: 0, rbc: 1, pc: 1, pcc: 0, ba: 0, bgr: 120, bu: 36, sc: 1.2, sod: 137, pot: 4.5, hemo: 12.5, pcv: 44, wc: 7800, rc: 5.2, htn: 0, dm: 0, cad: 0, appet: 1, pe: 0, ane: 0 },
      cbc: { Gender: 1, Hemoglobin: 13.5, MCH: 27.5, MCHC: 33.0, MCV: 85.0 },
    };
    setFormData(samples[activeTab] || {});
  };

  // Render the image upload panel
  const renderImageUploadPanel = () => (
    <div className="bg-white rounded-3xl border shadow-sm p-8" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: tab.gradient }}>
            <Icon name={tab.icon} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-headline font-bold">{tab.label} Analysis</h2>
            <p className="text-xs" style={{ color: "#566164" }}>Upload a scan image for AI-powered analysis</p>
          </div>
        </div>
        {selectedImage && (
          <button onClick={clearImage} className="px-4 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105" style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>
            Clear Image
          </button>
        )}
      </div>

      {/* Drop Zone */}
      {!imagePreview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="cursor-pointer p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300 text-center"
          style={{
            borderColor: isDragging ? tab.color : "rgba(169,180,183,0.3)",
            backgroundColor: isDragging ? tab.bgColor : "#f8fafb",
            minHeight: "250px",
          }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: tab.gradient }}>
            <Icon name="cloud_upload" className="text-3xl text-white" />
          </div>
          <h3 className="text-lg font-headline font-bold mb-2">
            {activeTab === "mri" ? "Upload MRI Brain Scan" : "Upload Lung CT Scan"}
          </h3>
          <p className="text-sm mb-3" style={{ color: "#566164" }}>
            Drag & drop your scan image or <span className="underline font-bold" style={{ color: tab.color }}>browse files</span>
          </p>
          <div className="flex gap-2 justify-center">
            {["PNG", "JPG", "JPEG"].map((ext) => (
              <span key={ext} className="px-3 py-1 text-xs font-bold rounded-full uppercase" style={{ backgroundColor: tab.bgColor, color: tab.color }}>{ext}</span>
            ))}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Image Preview */}
          <div className="relative rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
            <img src={imagePreview} alt="Scan preview" className="w-full max-h-[400px] object-contain bg-gray-50" />
            <div className="absolute top-3 right-3">
              <button onClick={clearImage} className="p-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-md hover:bg-red-50 transition-colors">
                <Icon name="close" className="text-[18px]" style={{ color: "#dc2626" }} />
              </button>
            </div>
          </div>

          {/* File Info */}
          <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: tab.bgColor }}>
            <Icon name="image" style={{ color: tab.color }} />
            <div className="flex-1 min-w-0">
              <p className="font-headline font-bold text-sm truncate">{selectedImage.name}</p>
              <p className="text-xs" style={{ color: "#566164" }}>{(selectedImage.size / 1024).toFixed(1)} KB</p>
            </div>
            <Icon name="check_circle" style={{ color: tab.color }} />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 rounded-xl flex items-center gap-3 animate-fade-in" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
          <Icon name="error" style={{ color: "#dc2626" }} />
          <p className="text-sm font-semibold" style={{ color: "#b91c1c" }}>{error}</p>
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || !selectedImage}
        className="mt-8 w-full py-4 rounded-xl font-headline font-bold text-lg shadow-lg transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-60 flex items-center justify-center gap-3"
        style={{ background: tab.gradient, color: "#ffffff" }}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
            Analyzing Scan...
          </>
        ) : (
          <>
            <Icon name="biotech" /> Analyze {activeTab === "mri" ? "MRI Scan" : "CT Scan"}
          </>
        )}
      </button>
    </div>
  );

  // Render the result details section for image models
  const renderImageResultDetails = () => {
    if (!result || !result.details) return null;

    if (activeTab === "mri") {
      return (
        <div className="p-6 rounded-2xl bg-white border shadow-sm" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
          <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: "#566164" }}>Detailed Probabilities</p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold" style={{ color: "#15803d" }}>No Tumor</span>
                <span className="font-bold" style={{ color: "#15803d" }}>{(result.details.no_tumor_prob * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: "#e1eaed" }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${result.details.no_tumor_prob * 100}%`, background: "linear-gradient(135deg, #10b981, #059669)" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold" style={{ color: "#dc2626" }}>Tumor Detected</span>
                <span className="font-bold" style={{ color: "#dc2626" }}>{(result.details.tumor_prob * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: "#e1eaed" }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${result.details.tumor_prob * 100}%`, background: "linear-gradient(135deg, #ef4444, #dc2626)" }} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "lung") {
      return (
        <div className="p-6 rounded-2xl bg-white border shadow-sm" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
          <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: "#566164" }}>CT Scan Analysis</p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold" style={{ color: "#15803d" }}>Normal</span>
                <span className="font-bold" style={{ color: "#15803d" }}>{(result.details.normal_prob * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: "#e1eaed" }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${result.details.normal_prob * 100}%`, background: "linear-gradient(135deg, #10b981, #059669)" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold" style={{ color: "#f59e0b" }}>Benign Tumor</span>
                <span className="font-bold" style={{ color: "#f59e0b" }}>{(result.details.benign_prob * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: "#e1eaed" }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${result.details.benign_prob * 100}%`, background: "linear-gradient(135deg, #f59e0b, #d97706)" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold" style={{ color: "#dc2626" }}>Malignant Tumor</span>
                <span className="font-bold" style={{ color: "#dc2626" }}>{(result.details.malignant_prob * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: "#e1eaed" }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${result.details.malignant_prob * 100}%`, background: "linear-gradient(135deg, #ef4444, #dc2626)" }} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ backgroundColor: "#f8fafb", color: "#2a3437", minHeight: "100vh" }}>
      <Header />

      <div className="flex pt-20">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 max-w-5xl mx-auto px-6 py-10 pb-32">
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold font-headline tracking-tight mb-3">{t('predict.title')}</h1>
            <p style={{ color: "#566164" }}>{t('predict.subtitle')}</p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-3 mb-10">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-headline font-bold text-sm transition-all ${activeTab === t.key ? "shadow-lg scale-[1.02]" : "hover:scale-[1.01]"}`}
                style={{
                  background: activeTab === t.key ? t.gradient : "#f0f4f6",
                  color: activeTab === t.key ? "#ffffff" : "#566164",
                }}
              >
                <Icon name={t.icon} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form / Image Upload Panel */}
            <div className="lg:col-span-8">
              {tab?.type === "image" ? renderImageUploadPanel() : (
                <div className="bg-white rounded-3xl border shadow-sm p-8" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: tab.gradient }}>
                        <Icon name={tab.icon} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-headline font-bold">{tab.label} {t('predict.prediction')}</h2>
                        <p className="text-xs" style={{ color: "#566164" }}>{t('predict.enterParams')}</p>
                      </div>
                    </div>
                    <button onClick={fillSampleData} className="px-4 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105" style={{ backgroundColor: tab.bgColor, color: tab.color }}>
                      {t('predict.fillSample')}
                    </button>
                  </div>

                  {loadingFeatures ? (
                    <div className="text-center py-12">
                      <div className="inline-block w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "#d9e4e8", borderTopColor: "#1e667f" }} />
                      <p className="mt-4 text-sm" style={{ color: "#566164" }}>{t('predict.loadingForm')}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {features.map((feat) => (
                          <div key={feat.name} className="space-y-2">
                            <label className="text-sm font-semibold block" style={{ color: "#2a3437" }}>{feat.label}</label>
                            {feat.type === "select" ? (
                              <select
                                value={formData[feat.name] ?? ""}
                                onChange={(e) => handleChange(feat.name, e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border bg-white text-sm transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                style={{ borderColor: "rgba(169,180,183,0.3)", color: "#2a3437" }}
                                required
                              >
                                <option value="">Select...</option>
                                {feat.options.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="number"
                                value={formData[feat.name] ?? ""}
                                onChange={(e) => handleChange(feat.name, e.target.value)}
                                placeholder={feat.placeholder}
                                min={feat.min}
                                max={feat.max}
                                step={feat.step || "any"}
                                className="w-full px-4 py-3 rounded-xl border bg-white text-sm transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                style={{ borderColor: "rgba(169,180,183,0.3)", color: "#2a3437" }}
                                required
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {error && (
                        <div className="mt-6 p-4 rounded-xl flex items-center gap-3 animate-fade-in" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
                          <Icon name="error" style={{ color: "#dc2626" }} />
                          <p className="text-sm font-semibold" style={{ color: "#b91c1c" }}>{error}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="mt-8 w-full py-4 rounded-xl font-headline font-bold text-lg shadow-lg transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-60 flex items-center justify-center gap-3"
                        style={{ background: tab.gradient, color: "#ffffff" }}
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                            {t('predict.analyzingDots')}
                          </>
                        ) : (
                          <>
                            <Icon name="science" /> {t('predict.runPrediction')}
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-4 space-y-6">
              {result ? (
                <div className="animate-fade-in space-y-6">
                  {/* Result Card */}
                  <div className="p-8 rounded-3xl text-center" style={{ backgroundColor: severityUI[result.severity]?.bg || "#f0f4f6" }}>
                    <Icon name={severityUI[result.severity]?.icon || "info"} className="text-6xl mb-4" style={{ color: severityUI[result.severity]?.color || "#566164" }} />
                    <h3 className="text-2xl font-headline font-extrabold mb-2" style={{ color: severityUI[result.severity]?.color || "#2a3437" }}>
                      {result.label}
                    </h3>
                    {result.probability && (
                      <p className="text-sm font-bold" style={{ color: severityUI[result.severity]?.color || "#566164" }}>
                        {t('predict.confidence')}: {(result.probability * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>

                  {/* Detailed probabilities for image models */}
                  {tab?.type === "image" && renderImageResultDetails()}

                  {/* Probability Bar (form models) */}
                  {tab?.type === "form" && result.probability && (
                    <div className="p-6 rounded-2xl bg-white border shadow-sm" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
                      <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "#566164" }}>{t('predict.modelConfidence')}</p>
                      <div className="w-full h-4 rounded-full overflow-hidden" style={{ backgroundColor: "#e1eaed" }}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{
                          width: `${result.probability * 100}%`,
                          background: tab.gradient,
                        }} />
                      </div>
                      <p className="text-right mt-2 text-sm font-bold" style={{ color: tab.color }}>
                        {(result.probability * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}

                  {/* Specialist Doctor Recommendation */}
                  {(() => {
                    const spec = SPECIALIST_MAP[activeTab];
                    if (!spec) return null;
                    const isRisk = result.severity === "High" || result.severity === "Moderate";
                    return (
                      <div className="p-5 rounded-2xl border" style={{ backgroundColor: isRisk ? "#fef2f2" : "#f0f9ff", borderColor: isRisk ? "rgba(220,38,38,0.15)" : "rgba(30,102,127,0.15)" }}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isRisk ? "linear-gradient(135deg, #ef4444, #dc2626)" : "linear-gradient(135deg, #1e667f, #075a72)" }}>
                            <Icon name={spec.icon} className="text-white text-[18px]" />
                          </div>
                          <div>
                            <p className="font-headline font-bold text-sm" style={{ color: isRisk ? "#b91c1c" : "#0d5c75" }}>Consult a Specialist</p>
                            <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#566164" }}>Recommended Department</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <Icon name="stethoscope" className="text-[16px] mt-0.5" style={{ color: isRisk ? "#dc2626" : "#1e667f" }} />
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#566164" }}>Doctor</p>
                              <p className="text-sm font-bold" style={{ color: "#2a3437" }}>{spec.specialist}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Icon name="local_hospital" className="text-[16px] mt-0.5" style={{ color: isRisk ? "#dc2626" : "#1e667f" }} />
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#566164" }}>Department</p>
                              <p className="text-sm font-bold" style={{ color: "#2a3437" }}>{spec.dept}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Icon name="tips_and_updates" className="text-[16px] mt-0.5" style={{ color: "#f59e0b" }} />
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#566164" }}>Health Tip</p>
                              <p className="text-xs leading-relaxed" style={{ color: "#566164" }}>{spec.tip}</p>
                            </div>
                          </div>
                        </div>

                        {isRisk && (
                          <div className="mt-3 p-3 rounded-xl flex items-center gap-2" style={{ backgroundColor: "rgba(220,38,38,0.08)" }}>
                            <Icon name="priority_high" className="text-[16px]" style={{ color: "#dc2626" }} />
                            <p className="text-xs font-bold" style={{ color: "#b91c1c" }}>
                              Risk detected — please consult a {spec.specialist} as soon as possible.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Actions */}
                  <div className="p-6 rounded-2xl space-y-3" style={{ backgroundColor: "#f0f4f6" }}>
                    <button onClick={() => navigate("/ai-chat")} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: "linear-gradient(135deg, #1e667f, #075a72)", color: "#f0f9ff" }}>
                      {t('predict.askAIResults')}
                    </button>
                    <button onClick={() => navigate("/specialists")} className="w-full py-3 rounded-xl font-bold text-sm border" style={{ borderColor: "#d9e4e8", color: "#566164" }}>
                      {t('predict.findSpecialist')}
                    </button>
                  </div>

                  {/* Disclaimer */}
                  <div className="p-4 rounded-xl flex items-start gap-2" style={{ backgroundColor: "#fef3c7" }}>
                    <Icon name="info" className="text-sm mt-0.5" style={{ color: "#92400e" }} />
                    <p className="text-xs" style={{ color: "#92400e" }}>{result.disclaimer}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Info Card */}
                  <div className="p-8 rounded-3xl" style={{ background: tab.gradient }}>
                    <Icon name={tab.icon} className="text-4xl mb-4 text-white" />
                    <h3 className="text-xl font-headline font-bold text-white mb-3">{t('predict.aboutThisTest')}</h3>
                    <p className="text-sm leading-relaxed text-white/80">
                      {activeTab === "heart" && "Predicts the likelihood of heart disease using 13 clinical parameters. Based on the Cleveland Heart Disease dataset and Random Forest classification."}
                      {activeTab === "diabetes" && "Predicts diabetes risk using 8 health indicators from the Pima Indians Diabetes dataset. Uses Random Forest classification."}
                      {activeTab === "kidney" && "Predicts chronic kidney disease using 24 clinical features from the UCI CKD dataset. Uses XGBoost classification."}
                      {activeTab === "cbc" && "Predicts anemia from Complete Blood Count (CBC) data using 5 key blood markers. Uses Random Forest classification."}
                      {activeTab === "mri" && "Detects brain tumors from MRI scan images using a Vision Transformer (ViT) deep learning model. Upload a brain MRI scan to get an instant AI-powered analysis."}
                      {activeTab === "lung" && "Analyzes lung CT scan images to detect normal tissue, benign tumors, or malignant tumors. Uses a deep learning Keras model trained on lung CT datasets."}
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl" style={{ backgroundColor: "#f0f4f6" }}>
                    <h4 className="font-headline font-bold mb-3">{t('predict.howItWorks')}</h4>
                    <ol className="space-y-3 text-sm" style={{ color: "#566164" }}>
                      {tab?.type === "image" ? (
                        <>
                          <li className="flex gap-3"><span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: tab.bgColor, color: tab.color }}>1</span>Upload your scan image (PNG/JPG)</li>
                          <li className="flex gap-3"><span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: tab.bgColor, color: tab.color }}>2</span>Our AI model processes & analyzes the scan</li>
                          <li className="flex gap-3"><span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: tab.bgColor, color: tab.color }}>3</span>Get instant prediction with confidence scores</li>
                        </>
                      ) : (
                        <>
                          <li className="flex gap-3"><span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: tab.bgColor, color: tab.color }}>1</span>{t('predict.step1')}</li>
                          <li className="flex gap-3"><span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: tab.bgColor, color: tab.color }}>2</span>{t('predict.step2')}</li>
                          <li className="flex gap-3"><span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: tab.bgColor, color: tab.color }}>3</span>{t('predict.step3')}</li>
                        </>
                      )}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
