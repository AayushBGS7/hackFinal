import { useNavigate } from "react-router-dom";
import { useAnalysis } from "../context/AnalysisContext";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";

const Icon = ({ name, filled = false, className = "" }) => (
  <span className={`material-symbols-outlined${filled ? " filled" : ""} ${className}`}>{name}</span>
);

import Sidebar from "../components/Sidebar";

const severityConfig = {
  Low: { bg: "#dcfce7", color: "#15803d", icon: "check_circle", label: "Good" },
  Medium: { bg: "#fef3c7", color: "#92400e", icon: "warning", label: "Attention Needed" },
  High: { bg: "#fef2f2", color: "#dc2626", icon: "error", label: "Needs Attention" },
};

export default function ReportInsightsPage() {
  const navigate = useNavigate();
  const { analysisResult, analysisType } = useAnalysis();
  const { user } = useAuth();
  const { t } = useTranslation();

  const hasResult = !!analysisResult;
  const severity = hasResult ? (analysisResult.severity || "Medium") : "Low";
  const sevConfig = severityConfig[severity];

  return (
    <div style={{ backgroundColor: "#f8fafb", color: "#2a3437", minHeight: "100vh" }}>
      <Header />

      <div className="flex pt-20">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 max-w-6xl mx-auto px-6 py-10 animate-fade-in">
          {!hasResult ? (
            /* No results — show placeholder */
            <div className="text-center py-24">
              <Icon name="description" className="text-8xl mb-6" style={{ color: "#d9e4e8" }} />
              <h1 className="text-3xl font-headline font-bold mb-4">{t('reportInsights.noReportTitle')}</h1>
              <p className="mb-10" style={{ color: "#566164" }}>{t('reportInsights.noReportDesc')}</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => navigate("/upload")} className="px-8 py-4 rounded-xl font-headline font-bold shadow-lg" style={{ background: "linear-gradient(135deg, #1e667f, #075a72)", color: "#f0f9ff" }}>{t('reportInsights.uploadDoc')}</button>
                <button onClick={() => navigate("/predict")} className="px-8 py-4 rounded-xl font-headline font-bold border" style={{ borderColor: "#d9e4e8", color: "#566164" }}>{t('reportInsights.tryPredictions')}</button>
              </div>
            </div>
          ) : (
            /* Real Results */
            <>
              <div className="mb-10">
                <h1 className="text-4xl font-extrabold font-headline tracking-tight mb-3">{t('reportInsights.title')}</h1>
                <p style={{ color: "#566164" }}>{analysisType === "xray" ? t('reportInsights.subtitleXray') : t('reportInsights.subtitleMed')}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                  {/* Health Status Badge */}
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-full flex items-center gap-2" style={{ backgroundColor: sevConfig.bg, color: sevConfig.color }}>
                      <Icon name={sevConfig.icon} />
                      <span className="font-bold uppercase text-sm tracking-wider">{t('reportInsights.healthStatus', { status: sevConfig.label })}</span>
                    </div>
                  </div>

                  {/* AI Interpretation */}
                  <div className="p-8 rounded-3xl" style={{ backgroundColor: "#f0f4f6" }}>
                    <div className="flex items-center gap-2 mb-6">
                      <Icon name="smart_toy" filled style={{ color: "#1e667f" }} />
                      <h2 className="text-2xl font-headline font-bold">{t('reportInsights.aiInterpretation')}</h2>
                    </div>
                    <div className="prose prose-lg max-w-none" style={{ color: "#2a3437" }}>
                      <p className="italic text-lg leading-relaxed whitespace-pre-line">
                        "{analysisResult.hindi_explanation || analysisResult.label || "Analysis complete."}"
                      </p>
                    </div>
                  </div>

                  {/* X-ray specific — detected conditions */}
                  {analysisType === "xray" && analysisResult.detected_conditions?.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-2xl" style={{ backgroundColor: "#fef2f2", borderLeft: "4px solid #dc2626" }}>
                        <h3 className="font-headline font-bold mb-4 flex items-center gap-2"><Icon name="warning" style={{ color: "#dc2626" }} />High Confidence Findings</h3>
                        {analysisResult.detected_conditions.map((c) => (
                          <div key={c.condition} className="flex justify-between py-2 border-b border-red-100">
                            <span className="font-semibold">{c.condition}</span>
                            <span className="font-bold" style={{ color: "#dc2626" }}>{(c.probability * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                      {analysisResult.moderate_findings?.length > 0 && (
                        <div className="p-6 rounded-2xl" style={{ backgroundColor: "#fef3c7", borderLeft: "4px solid #f59e0b" }}>
                          <h3 className="font-headline font-bold mb-4 flex items-center gap-2"><Icon name="info" style={{ color: "#92400e" }} />Moderate Findings</h3>
                          {analysisResult.moderate_findings.map((c) => (
                            <div key={c.condition} className="flex justify-between py-2 border-b border-yellow-200">
                              <span className="font-semibold">{c.condition}</span>
                              <span className="font-bold" style={{ color: "#92400e" }}>{(c.probability * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="p-4 rounded-2xl flex items-start gap-3" style={{ backgroundColor: "#fef3c7" }}>
                    <Icon name="info" style={{ color: "#92400e" }} />
                    <p className="text-sm" style={{ color: "#92400e" }}>{analysisResult.disclaimer}</p>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                  {/* Severity */}
                  <div className="p-6 rounded-2xl text-center" style={{ backgroundColor: sevConfig.bg }}>
                    <Icon name={sevConfig.icon} className="text-5xl mb-2" style={{ color: sevConfig.color }} />
                    <p className="text-xs uppercase tracking-widest font-bold" style={{ color: sevConfig.color }}>{t('reportInsights.severity')}</p>
                    <p className="text-3xl font-headline font-extrabold" style={{ color: sevConfig.color }}>{severity}</p>
                  </div>

                  {/* Actions */}
                  <div className="p-6 rounded-2xl space-y-4" style={{ backgroundColor: "#f0f4f6" }}>
                    <h3 className="font-headline font-bold">{t('reportInsights.whatNext')}</h3>
                    <button onClick={() => navigate("/ai-chat", { state: { explainReport: true } })} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: "linear-gradient(135deg, #1e667f, #075a72)", color: "#f0f9ff" }}>{t('reportInsights.askAI')}</button>
                    <button onClick={() => navigate("/specialists")} className="w-full py-3 rounded-xl font-bold text-sm border" style={{ borderColor: "#d9e4e8", color: "#566164" }}>{t('reportInsights.findSpecialist')}</button>
                    <button onClick={() => navigate("/upload")} className="w-full py-3 rounded-xl font-bold text-sm border" style={{ borderColor: "#d9e4e8", color: "#566164" }}>{t('reportInsights.uploadAnother')}</button>
                  </div>

                  {/* Doctor Recommendation */}
                  <div className="p-6 rounded-2xl" style={{ backgroundColor: "#e1eaed" }}>
                    <h3 className="font-headline font-bold mb-4">{t('reportInsights.recommendedSpecialist')}</h3>
                    <p className="text-sm mb-4" style={{ color: "#566164" }}>{t('reportInsights.recommendedDesc')}</p>
                    <button onClick={() => navigate("/specialists")} className="w-full py-3 rounded-xl font-bold text-sm" style={{ backgroundColor: "#1e667f", color: "#f0f9ff" }}>{t('reportInsights.viewAllRec')}</button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

