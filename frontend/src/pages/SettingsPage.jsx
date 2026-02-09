import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, API } from "@/App";
import { Layout } from "@/components/Layout";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { ChildrenSection } from "@/components/settings/ChildrenSection";
import { ExportDataSection } from "@/components/settings/ExportDataSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { LanguageSection } from "@/components/settings/LanguageSection";
import { useTranslation } from "react-i18next";

export default function SettingsPage() {
  const { user, token, setUser } = useAuth();
  const { t } = useTranslation();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const response = await axios.get(`${API}/children`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChildren(response.data);
    } catch (error) {
      console.error("Failed to fetch children:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in" data-testid="settings-page">
        {/* Header */}
        <div>
          <h1 className="font-['Merriweather'] text-2xl sm:text-3xl font-bold text-[#1A202C]">
            {t('settings.title')}
          </h1>
          <p className="text-[#718096] mt-1">{t('settings.subtitle')}</p>
        </div>

        {/* Language Section */}
        <LanguageSection />

        {/* Profile Section */}
        <ProfileSection 
          user={user} 
          token={token} 
          API={API} 
          setUser={setUser} 
        />

        {/* Security Section */}
        <SecuritySection 
          token={token} 
          API={API}
          userEmail={user?.email}
        />

        {/* Children Section */}
        <ChildrenSection 
          children={children} 
          token={token} 
          API={API} 
          fetchChildren={fetchChildren} 
        />

        {/* Export Data Section */}
        <ExportDataSection 
          token={token} 
          API={API} 
        />
      </div>
    </Layout>
  );
}
