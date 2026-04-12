/**
 * api.js — Centralized API helper for all backend calls
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

/**
 * POST JSON data to an endpoint
 */
export async function postJSON(endpoint, data) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Request failed");
  return json;
}

/**
 * POST form data (file upload) to an endpoint
 */
export async function postFile(endpoint, file, additionalData = {}, fieldName = "file") {
  const formData = new FormData();
  formData.append(fieldName, file);
  for (const key in additionalData) {
    formData.append(key, additionalData[key]);
  }
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "ngrok-skip-browser-warning": "true"
    },
    body: formData,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Upload failed");
  return json;
}

/**
 * GET JSON from an endpoint
 */
export async function getJSON(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "ngrok-skip-browser-warning": "true"
    }
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Request failed");
  return json;
}

// ---- Specific API calls ----

export const loginAPI = (data) => postJSON("/login", data);
export const predictHeart = (data) => postJSON("/predict/heart", data);
export const predictDiabetes = (data) => postJSON("/predict/diabetes", data);
export const predictKidney = (data) => postJSON("/predict/kidney", data);
export const predictCBC = (data) => postJSON("/predict/cbc", data);
export const analyzeReport = (file, language) => postFile("/analyze-report", file, { language });
export const analyzeXray = (file, language) => postFile("/analyze-xray", file, { language });
export const predictMRI = (file) => postFile("/predict/mri", file);
export const predictLungCT = (file) => postFile("/predict/lung-ct", file);
export const generateDiet = (data) => postJSON("/generate-diet", data);
export const aiChat = (message, history = []) => postJSON("/ai-chat", { message, history });
export const getModelInfo = (name) => getJSON(`/model-info/${name}`);
export const getAISuggestion = (data) => postJSON("/ai-suggestion", data);
export const healthCheck = () => fetch(`${API_BASE}/health`, {
  headers: { "ngrok-skip-browser-warning": "true" }
}).then(r => r.json());

