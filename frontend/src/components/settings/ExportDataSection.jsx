import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileArchive, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export function ExportDataSection({ token, API }) {
  const [exporting, setExporting] = useState(false);

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const response = await axios.get(`${API}/export/all`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from header or generate one
      const contentDisposition = response.headers['content-disposition'];
      let filename = `CustodyKeeper_Export_${new Date().toISOString().split('T')[0]}.zip`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="bg-white border-[#E2E8F0]" data-testid="export-data-card">
      <CardHeader>
        <CardTitle className="font-['Merriweather'] text-lg font-bold text-[#1A202C] flex items-center gap-2">
          <FileArchive className="w-5 h-5" /> Export Your Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-[#718096]">
          Download all your CustodyKeeper data as a ZIP archive. This includes your journals, 
          violations, calendar events, documents, contacts, and account information.
        </p>
        
        <div className="bg-[#F7FAFC] rounded-lg p-4 border border-[#E2E8F0]">
          <h4 className="font-semibold text-[#1A202C] mb-2">What's included:</h4>
          <ul className="text-sm text-[#718096] space-y-1">
            <li>• Account profile information</li>
            <li>• Children's profiles</li>
            <li>• All journal entries</li>
            <li>• All violation records</li>
            <li>• All calendar events</li>
            <li>• All contacts</li>
            <li>• All uploaded documents</li>
          </ul>
        </div>
        
        <Button
          onClick={handleExportAll}
          disabled={exporting}
          className="w-full sm:w-auto bg-[#2C3E50] hover:bg-[#34495E] text-white"
          data-testid="export-all-btn"
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Preparing Export...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download All Data (ZIP)
            </>
          )}
        </Button>
        
        <p className="text-xs text-[#9CA3AF]">
          Your data will be downloaded as a secure ZIP file. Keep this file safe as it contains sensitive information.
        </p>
      </CardContent>
    </Card>
  );
}
