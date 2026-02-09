import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, Download, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const DATA_TYPES = [
  { value: 'journals', label: 'Journal Entries', icon: '📓' },
  { value: 'violations', label: 'Violations', icon: '⚠️' },
  { value: 'calendar', label: 'Calendar Events', icon: '📅' }
];

export function ImportDataSection({ token, API }) {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState('journals');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(`${API}/import/templates/${selectedType}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedType}_template.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Template downloaded!");
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast.error("Please select a CSV or Excel file");
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API}/import/${selectedType}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setResult(response.data);
      
      if (response.data.imported_count > 0) {
        toast.success(`Successfully imported ${response.data.imported_count} records!`);
      } else {
        toast.warning("No records were imported. Check the file format.");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to import data");
      setResult({
        success: false,
        imported_count: 0,
        skipped_count: 0,
        errors: [error.response?.data?.detail || "Import failed"]
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="bg-white border-[#E2E8F0]" data-testid="import-data-card">
      <CardHeader>
        <CardTitle className="font-['Merriweather'] text-lg font-bold text-[#1A202C] flex items-center gap-2">
          <Upload className="w-5 h-5" /> Import Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-[#718096]">
          Import your existing records from CSV files. Download a template to see the required format.
        </p>

        {/* Data Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#1A202C]">Data Type</label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-64 border-[#E2E8F0]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATA_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <span className="flex items-center gap-2">
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="border-[#E2E8F0]"
            data-testid="download-template-btn"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="bg-[#2C3E50] hover:bg-[#34495E] text-white"
            data-testid="import-file-btn"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Select CSV File
              </>
            )}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Import Result */}
        {result && (
          <div className={`p-4 rounded-lg ${result.imported_count > 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-start gap-3">
              {result.imported_count > 0 ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium text-[#1A202C]">
                  Import Complete
                </p>
                <p className="text-sm text-[#718096] mt-1">
                  {result.imported_count} records imported
                  {result.skipped_count > 0 && `, ${result.skipped_count} skipped`}
                </p>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-[#1A202C]">Errors:</p>
                    <ul className="text-sm text-[#718096] list-disc list-inside">
                      {result.errors.slice(0, 5).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li>...and {result.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-[#F7FAFC] rounded-lg p-4 border border-[#E2E8F0]">
          <h4 className="font-semibold text-[#1A202C] mb-2">How to import:</h4>
          <ol className="text-sm text-[#718096] space-y-1 list-decimal list-inside">
            <li>Select the type of data you want to import</li>
            <li>Download the CSV template</li>
            <li>Fill in your data following the template format</li>
            <li>Upload the completed CSV file</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
