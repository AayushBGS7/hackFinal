import { createContext, useContext, useState } from "react";

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisType, setAnalysisType] = useState(null); // 'report' | 'xray' | 'prediction'

  const setResult = (type, result) => {
    setAnalysisType(type);
    setAnalysisResult(result);
  };

  const clearResult = () => {
    setAnalysisType(null);
    setAnalysisResult(null);
  };

  return (
    <AnalysisContext.Provider value={{ analysisResult, analysisType, setResult, clearResult }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}

