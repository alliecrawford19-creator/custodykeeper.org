import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Scale, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Get session_id from URL fragment
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get("session_id");

        if (!sessionId) {
          toast.error("Invalid authentication response");
          navigate("/login");
          return;
        }

        // Exchange session_id for user data and token
        const response = await axios.post(`${API}/auth/google/session`, {
          session_id: sessionId
        });

        if (response.data.access_token && response.data.user) {
          // Store auth data
          localStorage.setItem("token", response.data.access_token);
          localStorage.setItem("user", JSON.stringify(response.data.user));
          
          // Update auth context
          setToken(response.data.access_token);
          setUser(response.data.user);
          
          toast.success("Welcome back!");
          
          // Navigate to dashboard with user data to skip auth check
          navigate("/dashboard", { state: { user: response.data.user } });
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        toast.error(error.response?.data?.detail || "Authentication failed");
        navigate("/login");
      }
    };

    processAuth();
  }, [navigate, setUser, setToken]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <Scale className="w-16 h-16 text-[#2C3E50] mx-auto mb-6 animate-pulse" />
        <h1 className="font-['Merriweather'] text-2xl font-bold text-[#1A202C] mb-2">
          Signing you in...
        </h1>
        <p className="text-[#718096]">Please wait while we verify your credentials</p>
        <Loader2 className="w-6 h-6 text-[#2C3E50] mx-auto mt-6 animate-spin" />
      </div>
    </div>
  );
}
