import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { aiChat } from "../api";
import { useAuth } from "../context/AuthContext";
import { useAnalysis } from "../context/AnalysisContext";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const Icon = ({ name, filled = false, className = "" }) => (
  <span className={`material-symbols-outlined${filled ? " filled" : ""} ${className}`}>{name}</span>
);

export default function AIChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { analysisResult, analysisType } = useAnalysis();
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const { t } = useTranslation();

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your Health Saathi AI assistant. I can help you understand your medical reports, answer health questions, or provide general health guidance. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (location.state?.explainReport && analysisResult && messages.length === 1) {
      window.history.replaceState({}, '');
      triggerAutoExplain();
    }
  }, [location.state, analysisResult]);

  const toggleRecording = () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Voice Recognition. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalStr = inputValue ? inputValue + " " : "";

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      let interimTrans = "";
      let finalTrans = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTrans += event.results[i][0].transcript;
        } else {
          interimTrans += event.results[i][0].transcript;
        }
      }
      finalStr += finalTrans;
      setInputValue(finalStr + interimTrans);
    };

    recognition.onerror = (e) => {
      console.error(e.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const triggerAutoExplain = async () => {
    setIsLoading(true);
    const userMsg = { role: "user", content: "Please explain my recent report results in detail.", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages(prev => [...prev, userMsg]);
    
    try {
      const contextStr = `The user is asking for an explanation of their recent ${analysisType} report. The report details are: ${JSON.stringify(analysisResult)}. Please provide a clear, easy-to-understand, and empathetic explanation of these results directly to the user.`;
      
      const result = await aiChat(contextStr, [{role: "assistant", content: "Hello!"}]);
      const aiMsg = { role: "assistant", content: result.reply, time: result.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Sorry, I encountered an error: ${err.message}. Please try again.`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const userMsg = { role: "user", content: text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      let textForApi = text;
      
      if (history.length === 1 && analysisResult) {
        textForApi = `[Context: User's recent ${analysisType} report data: ${JSON.stringify(analysisResult)}] \n\nUser Question: ${text}`;
      }
      
      const result = await aiChat(textForApi, history);
      const aiMsg = { role: "assistant", content: result.reply, time: result.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Sorry, I encountered an error: ${err.message}. Please try again.`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  return (
    <div style={{ backgroundColor: "#f8fafb", color: "#2a3437", minHeight: "100vh" }}>
      <Header />

      <div className="flex pt-20">
        <Sidebar />

        <main className="flex-1 max-w-4xl mx-auto px-6 flex flex-col" style={{ height: "calc(100vh - 5rem)" }}>
          {/* Chat Header */}
          <div className="py-6 flex items-center gap-4 border-b" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#bde9ff" }}>
              <Icon name="smart_toy" filled style={{ color: "#055972" }} />
            </div>
            <div>
              <h1 className="text-2xl font-headline font-bold">{t('aiChat.title')}</h1>
              <p className="text-sm" style={{ color: "#566164" }}>{t('aiChat.subtitle')}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-6 space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} animate-fade-in`}>
                <div className={`max-w-[80%] p-5 rounded-2xl shadow-sm ${msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"}`} style={{ backgroundColor: msg.role === "user" ? "#f0f4f6" : "#bde9ff", color: msg.role === "user" ? "#2a3437" : "#055972" }}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
                <p className="mt-2 text-xs uppercase tracking-wider" style={{ color: "#566164" }}>{msg.role === "user" ? t('aiChat.you') : t('aiChat.clinicalAI')} • {msg.time}</p>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start animate-fade-in">
                <div className="max-w-[80%] p-5 rounded-2xl rounded-bl-sm" style={{ backgroundColor: "#bde9ff", color: "#055972" }}>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#055972", animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#055972", animationDelay: "200ms" }} />
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#055972", animationDelay: "400ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="py-4 border-t" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border shadow-sm" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('aiChat.placeholder')}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm py-2"
                style={{ color: "#2a3437", maxHeight: "100px" }}
              />
              <button
                onClick={toggleRecording}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${isRecording ? "bg-red-50 text-red-500 border border-red-200 animate-pulse shadow-sm" : "bg-transparent text-[#566164] hover:bg-gray-100"}`}
                title="Voice Input"
              >
                <Icon name="mic" />
              </button>
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #1e667f, #075a72)", color: "#f0f9ff" }}
              >
                <Icon name="send" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

