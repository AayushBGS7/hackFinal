import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAnalysis } from "../context/AnalysisContext";
import { generateDiet } from "../api";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const Icon = ({ name, filled = false, className = "" }) => (
  <span className={`material-symbols-outlined${filled ? " filled" : ""} ${className}`}>{name}</span>
);
export default function DietPlanPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { analysisResult } = useAnalysis();
  const { t } = useTranslation();
  
  const [dietPlan, setDietPlan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (analysisResult) {
      if (!dietPlan && !isLoading) {
        fetchDietPlan();
      }
    }
  }, [analysisResult]);

  const fetchDietPlan = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const context = analysisResult?.hindi_explanation || JSON.stringify(analysisResult);
      const res = await generateDiet({ context, language: "English" });
      
      // Basic markdown bold strip
      const cleanPlan = res.diet_plan.replace(/\*\*(.*?)\*\*/g, "$1");
      setDietPlan(cleanPlan);
    } catch (err) {
      setError(err.message || t('dietPlan.failed'));
    } finally {
      setIsLoading(false);
    }
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
            <h1 className="text-4xl font-extrabold font-headline tracking-tight mb-3">{t('dietPlan.title')}</h1>
            <p style={{ color: "#566164" }}>{t('dietPlan.subtitle')}</p>
          </div>

          {!analysisResult ? (
            <div className="p-12 text-center rounded-3xl" style={{ backgroundColor: "#f0f4f6", border: "1px dashed rgba(169,180,183,0.3)" }}>
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6" style={{ backgroundColor: "#bde9ff" }}>
                <Icon name="restaurant" className="text-3xl" style={{ color: "#055972" }} />
              </div>
              <h2 className="text-2xl font-headline font-bold mb-3">{t('dietPlan.noContextTitle')}</h2>
              <p className="max-w-md mx-auto mb-8" style={{ color: "#566164" }}>{t('dietPlan.noContextDesc')}</p>
              <button onClick={() => navigate("/upload")} className="px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-md text-white" style={{ background: "linear-gradient(135deg, #1e667f, #075a72)" }}>
                {t('dietPlan.startAnalysis')}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              
              <div className="p-8 rounded-3xl relative overflow-hidden" style={{ backgroundColor: "white", borderColor: "rgba(169,180,183,0.15)", borderWidth: "1px" }}>
                {isLoading ? (
                   <div className="flex flex-col items-center justify-center py-12">
                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: "#1e667f" }}></div>
                     <h3 className="font-headline font-bold text-lg" style={{ color: "#1e667f" }}>{t('dietPlan.craftingPlan')}</h3>
                     <p className="text-sm" style={{ color: "#566164" }}>{t('dietPlan.analyzingContext')}</p>
                   </div>
                ) : error ? (
                   <div className="p-6 rounded-2xl flex items-center gap-3" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
                    <Icon name="error" style={{ color: "#dc2626" }} />
                    <p className="font-semibold text-sm" style={{ color: "#b91c1c" }}>{error}</p>
                    <button onClick={fetchDietPlan} className="ml-auto underline font-bold text-sm" style={{ color: "#b91c1c" }}>{t('dietPlan.retry')}</button>
                  </div>
                ) : (
                  <div>
                     <h2 className="text-2xl font-headline font-bold mb-6 flex items-center gap-3" style={{ color: "#0d5c75" }}>
                        <Icon name="verified" style={{ color: "#1e667f" }}/>
                        {t('dietPlan.aiRecommendation')}
                     </h2>
                     <div className="prose prose-lg max-w-none whitespace-pre-line text-lg leading-relaxed mt-4" style={{ color: "#2a3437" }}>
                       {dietPlan}
                     </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
