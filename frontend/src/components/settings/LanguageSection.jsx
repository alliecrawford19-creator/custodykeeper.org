import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import { languages } from "@/i18n";

export function LanguageSection() {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <Card className="bg-white border-[#E2E8F0]" data-testid="language-card">
      <CardHeader>
        <CardTitle className="font-['Merriweather'] text-lg font-bold text-[#1A202C] flex items-center gap-2">
          <Globe className="w-5 h-5" /> {t('settings.language')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Select
            value={i18n.language}
            onValueChange={handleLanguageChange}
          >
            <SelectTrigger className="w-full sm:w-64 border-[#E2E8F0] bg-white text-[#1A202C]" data-testid="language-select">
              <SelectValue>
                <span className="flex items-center gap-2 text-[#1A202C]">
                  <span>{currentLanguage.nativeName}</span>
                  <span className="text-[#718096]">({currentLanguage.name})</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2 text-[#1A202C]">
                    <span>{lang.nativeName}</span>
                    <span className="text-[#718096]">({lang.name})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-[#718096]">
            {t('settings.selectLanguage')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
