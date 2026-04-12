import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Icon = ({ name, className = "" }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, resetPassword } = useAuth();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [resetMessage, setResetMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResetMessage("");
    try {
      if (isRegistering) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || "Failed to authenticate. Please check your details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address in the field below to reset your password.");
      setResetMessage("");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await resetPassword(email);
      setResetMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f8fafb" }}>
      {/* Left Form Side */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-24">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-10 text-center md:text-left">
            <h1 
              className="text-3xl font-extrabold tracking-tight cursor-pointer font-headline flex items-center justify-center md:justify-start gap-2" 
              style={{ color: "#0d5c75", letterSpacing: "-0.02em" }} 
              onClick={() => navigate("/")}
            >
              <Icon name="local_hospital" className="text-4xl" />
              Health Saathi
            </h1>
            <p className="mt-4 text-xl font-bold" style={{ color: "#2a3437" }}>
              {isRegistering ? "Create your account" : "Welcome back"}
            </p>
            <p className="mt-2 text-sm" style={{ color: "#566164" }}>
              Enter your clinical credentials to access the secure portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegistering && (
              <div className="space-y-2">
                <label className="text-sm font-semibold" style={{ color: "#2a3437" }}>Full Name</label>
                <div className="flex items-center px-4 py-3 bg-white rounded-xl border focus-within:ring-2 transition-all shadow-sm" style={{ borderColor: "rgba(169,180,183,0.3)" }}>
                  <Icon name="person" className="mr-3" style={{ color: "#566164" }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm placeholder-gray-400"
                    style={{ color: "#2a3437" }}
                    placeholder="John Doe"
                    required={isRegistering}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold" style={{ color: "#2a3437" }}>Email Address</label>
              <div className="flex items-center px-4 py-3 bg-white rounded-xl border focus-within:ring-2 transition-all shadow-sm" style={{ borderColor: "rgba(169,180,183,0.3)" }}>
                <Icon name="mail" className="mr-3" style={{ color: "#566164" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm placeholder-gray-400"
                  style={{ color: "#2a3437" }}
                  placeholder="name@clinical.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold" style={{ color: "#2a3437" }}>Password</label>
                {!isRegistering && (
                  <button type="button" onClick={handleResetPassword} className="text-xs font-bold hover:underline" style={{ color: "#1e667f" }}>Forgot Password?</button>
                )}
              </div>
              <div className="flex items-center px-4 py-3 bg-white rounded-xl border focus-within:ring-2 transition-all shadow-sm" style={{ borderColor: "rgba(169,180,183,0.3)" }}>
                <Icon name="lock" className="mr-3" style={{ color: "#566164" }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm placeholder-gray-400"
                  style={{ color: "#2a3437" }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {resetMessage && (
              <div className="p-3 rounded-xl flex items-center gap-3 animate-fade-in" style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                <Icon name="check_circle" style={{ color: "#059669" }} />
                <p className="text-sm font-semibold" style={{ color: "#047857" }}>{resetMessage}</p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl flex items-center gap-3 animate-fade-in" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
                <Icon name="error" style={{ color: "#dc2626" }} />
                <p className="text-sm font-semibold" style={{ color: "#b91c1c" }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-headline font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #1e667f, #075a72)", color: "#f0f9ff" }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
              ) : (
                isRegistering ? "Register" : "Authenticate"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm" style={{ color: "#566164" }}>
            {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="font-bold hover:underline" 
              style={{ color: "#1e667f", background: "none", border: "none", cursor: "pointer" }}
              type="button"
            >
              {isRegistering ? "Log in here" : "Register here"}
            </button>
          </p>

          {/* Glass pill progress decoration underneath */}
          <div className="mt-12 mx-auto w-48 glass-pill p-4 rounded-2xl border flex items-center gap-3 opacity-60 pointer-events-none" style={{ borderColor: "rgba(169,180,183,0.15)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#bde9ff" }}>
              <Icon name="shield" className="text-sm" style={{ color: "#055972" }} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold" style={{ color: "#2a3437" }}>Secure Login</p>
              <p className="text-[9px]" style={{ color: "#566164" }}>HIPAA Compliant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Visual Side */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ backgroundColor: "#e8eff1" }}>
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhoVAgTY1Ej3dNl8T79EttZUCIfdJ7llw_XT9G1AdCOuWVKDJvYNuNCJpzCHOKhg8C6lEpYzvq_F75fnxhP80NIZX18zmV_VuvraqSGxc39_se13VUA4wPKjOafvBhPxbLhuJpoK0k698WQMpCzq-LUWjV5Qcl-TsklyQDwRt_j-R57r59D8o6szuh2eeaHpxnUEJU-FdDGaFZ-G1WsW_nBt_VCJS2uYWBkQjVa93OerPy4B_1xZsgPsXFdXDKiLki2118_k8Y" 
          alt="Clinical Environment" 
          className="w-full h-full object-cover grayscale opacity-40 mix-blend-multiply"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(30,102,127,0.8), rgba(7,90,114,0.9))" }} />
        
        <div className="absolute inset-0 flex flex-col justify-center px-16 text-white text-opacity-90">
          <div className="glass-panel p-10 rounded-[2rem] border border-white/20 shadow-2xl max-w-lg mb-8 backdrop-blur-2xl bg-white/10">
            <Icon name="vital_signs" className="text-5xl mb-6 text-white" />
            <h2 className="text-4xl font-headline font-bold mb-4 leading-tight">Clarity when you need it most.</h2>
            <p className="text-lg opacity-80 leading-relaxed font-body">The high-end editorial experience for medical diagnostic data. Log in to transform complex reports into actionable insights.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

