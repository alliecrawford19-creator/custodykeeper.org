import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export function SecuritySection({ token, API, userEmail }) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API}/auth/2fa/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTwoFactorEnabled(response.data.enabled);
    } catch (error) {
      console.error("Failed to fetch 2FA status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async (enabled) => {
    setUpdating(true);
    try {
      const endpoint = enabled ? `${API}/auth/2fa/enable` : `${API}/auth/2fa/disable`;
      await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTwoFactorEnabled(enabled);
      toast.success(enabled 
        ? "Two-factor authentication enabled. You'll receive a code via email on your next login." 
        : "Two-factor authentication disabled."
      );
    } catch (error) {
      toast.error("Failed to update security settings");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border-[#E2E8F0]">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#718096]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-[#E2E8F0]" data-testid="security-card">
      <CardHeader>
        <CardTitle className="font-['Merriweather'] text-lg font-bold text-[#1A202C] flex items-center gap-2">
          <Shield className="w-5 h-5" /> Security Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Two-Factor Authentication */}
        <div className="flex items-start justify-between gap-4 p-4 bg-[#F7FAFC] rounded-lg border border-[#E2E8F0]">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#2C3E50]" />
              <Label className="font-semibold text-[#1A202C]">Two-Factor Authentication</Label>
            </div>
            <p className="text-sm text-[#718096] mt-1">
              Add an extra layer of security by requiring a verification code sent to your email when signing in.
            </p>
            {twoFactorEnabled && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Enabled - Codes will be sent to {userEmail}
              </p>
            )}
          </div>
          <Switch
            checked={twoFactorEnabled}
            onCheckedChange={handleToggle2FA}
            disabled={updating}
            data-testid="2fa-toggle"
          />
        </div>

        {/* Security Info */}
        <div className="bg-[#E8F6F3] rounded-lg p-4">
          <h4 className="font-semibold text-[#1A202C] mb-2">Why enable 2FA?</h4>
          <ul className="text-sm text-[#718096] space-y-1">
            <li>• Protects your sensitive family court records</li>
            <li>• Prevents unauthorized access even if password is compromised</li>
            <li>• Required for sharing documents with attorneys</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
