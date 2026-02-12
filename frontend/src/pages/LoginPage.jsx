import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Eye, EyeOff, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, setUser, setToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 2FA State
  const [requires2FA, setRequires2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        navigate("/dashboard");
      }
    } catch (error) {
      // Check if 2FA is required (status 202)
      if (error.response?.status === 202 && error.response?.data?.detail?.requires_2fa) {
        setRequires2FA(true);
        // Automatically send code
        handleSendCode();
      }
    }
    
    setLoading(false);
  };

  const handleSendCode = async () => {
    setSendingCode(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      
      await axios.post(`${API}/auth/2fa/send-code`, formData);
      setCodeSent(true);
      toast.success("Verification code sent to your email");
    } catch (error) {
      toast.error("Failed to send verification code");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('code', verificationCode);
      
      const response = await axios.post(`${API}/auth/2fa/verify`, formData);
      
      if (response.data.access_token) {
        // Manually set auth state
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setToken(response.data.access_token);
        setUser(response.data.user);
        toast.success("Successfully signed in!");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setRequires2FA(false);
    setVerificationCode("");
    setCodeSent(false);
  };

  // 2FA Verification Screen
  if (requires2FA) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex">
        <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16">
          <div className="max-w-md w-full mx-auto">
            <Link to="/" className="flex items-center gap-2 mb-12">
              <Scale className="w-8 h-8 text-[#2C3E50]" />
              <span className="font-['Merriweather'] font-bold text-xl text-[#2C3E50]">CustodyKeeper</span>
            </Link>

            <div className="animate-fade-in">
              <button 
                onClick={handleBack}
                className="flex items-center gap-1 text-[#718096] hover:text-[#2C3E50] mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#E8F6F3] flex items-center justify-center">
                  <Mail className="w-6 h-6 text-[#2C3E50]" />
                </div>
                <div>
                  <h1 className="font-['Merriweather'] text-2xl font-bold text-[#1A202C]">
                    Check Your Email
                  </h1>
                  <p className="text-sm text-[#718096]">
                    We sent a code to {email}
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-[#1A202C] font-medium">
                    Verification Code
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                    className="bg-[#FDFBF7] border-[#E2E8F0] focus:border-[#2C3E50] focus:ring-[#2C3E50]/20 h-12 text-center text-2xl tracking-widest"
                    data-testid="2fa-code-input"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-full h-12 font-bold btn-hover"
                  data-testid="verify-2fa-btn"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    "Verify & Sign In"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-[#718096]">
                  Didn't receive the code?{" "}
                  <button 
                    onClick={handleSendCode}
                    disabled={sendingCode}
                    className="text-[#2C3E50] font-medium hover:underline disabled:opacity-50"
                  >
                    {sendingCode ? "Sending..." : "Resend code"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="hidden lg:block lg:flex-1 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2C3E50] to-[#1A202C]"></div>
          <div className="absolute inset-0 flex items-center justify-center p-16">
            <div className="text-center text-white">
              <Scale className="w-20 h-20 mx-auto mb-6 opacity-80" />
              <h2 className="font-['Merriweather'] text-3xl font-bold mb-4">
                Secure Access
              </h2>
              <p className="text-white/70 text-lg max-w-md">
                Two-factor authentication keeps your family court records safe.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16">
        <div className="max-w-md w-full mx-auto">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <Scale className="w-8 h-8 text-[#2C3E50]" />
            <span className="font-['Merriweather'] font-bold text-xl text-[#2C3E50]">CustodyKeeper</span>
          </Link>

          <div className="animate-fade-in">
            <h1 className="font-['Merriweather'] text-3xl font-bold text-[#1A202C] mb-2">
              Welcome Back
            </h1>
            <p className="text-[#718096] mb-8">
              Sign in to access your family court records.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#1A202C] font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[#FDFBF7] border-[#E2E8F0] focus:border-[#2C3E50] focus:ring-[#2C3E50]/20 h-12"
                  data-testid="login-email-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#1A202C] font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-[#FDFBF7] border-[#E2E8F0] focus:border-[#2C3E50] focus:ring-[#2C3E50]/20 h-12 pr-12"
                    data-testid="login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#2C3E50]"
                    data-testid="toggle-password-visibility"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-full h-12 font-bold btn-hover"
                data-testid="login-submit-btn"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing In...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-[#E2E8F0]"></div>
              <span className="text-[#718096] text-sm">or continue with</span>
              <div className="flex-1 h-px bg-[#E2E8F0]"></div>
            </div>

            {/* Google Sign In - REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH */}
            <a
              href={`https://auth.emergentagent.com/?redirect=${encodeURIComponent(window.location.origin + '/dashboard')}`}
              className="w-full flex items-center justify-center border border-[#E2E8F0] text-[#1A202C] rounded-full h-12 font-medium hover:bg-[#F9FAFB] transition-colors"
              data-testid="google-login-btn"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </a>

            <p className="mt-8 text-center text-[#718096]">
              Don't have an account?{" "}
              <Link to="/register" className="text-[#2C3E50] font-medium hover:underline" data-testid="register-link">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2C3E50] to-[#1A202C]"></div>
        <div className="absolute inset-0 flex items-center justify-center p-16">
          <div className="text-center text-white">
            <Scale className="w-20 h-20 mx-auto mb-6 opacity-80" />
            <h2 className="font-['Merriweather'] text-3xl font-bold mb-4">
              Your Records, Your Rights
            </h2>
            <p className="text-white/70 text-lg max-w-md">
              Comprehensive documentation tools designed specifically for family court proceedings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
