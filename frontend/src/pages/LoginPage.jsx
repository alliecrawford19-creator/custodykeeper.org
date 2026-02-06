import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      navigate("/dashboard");
    }
    
    setLoading(false);
  };

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
