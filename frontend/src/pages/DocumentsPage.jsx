import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth, API } from "@/App";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, FileText, Upload, Trash2, Download, Search, File, FileImage, FileType } from "lucide-react";
import { format, parseISO } from "date-fns";

const DOCUMENT_CATEGORIES = [
  { value: "custody_agreement", label: "Custody Agreement/Parenting Plan" },
  { value: "court_order", label: "Court Order" },
  { value: "child_support_order", label: "Child Support Order" },
  { value: "motion_filing", label: "Motion/Filing" },
  { value: "attorney_correspondence", label: "Attorney Correspondence" },
  { value: "text_messages", label: "Text Messages/Screenshots" },
  { value: "email_communication", label: "Email Communication" },
  { value: "photos_evidence", label: "Photos/Evidence" },
  { value: "video_evidence", label: "Video Evidence" },
  { value: "audio_recording", label: "Audio Recording" },
  { value: "witness_statement", label: "Witness Statement" },
  { value: "police_report", label: "Police Report" },
  { value: "medical_records", label: "Medical Records" },
  { value: "therapy_records", label: "Therapy/Counseling Records" },
  { value: "school_records", label: "School Records" },
  { value: "financial_records", label: "Financial Records" },
  { value: "income_verification", label: "Income Verification" },
  { value: "expense_receipts", label: "Expense Receipts" },
  { value: "calendar_proof", label: "Calendar/Schedule Proof" },
  { value: "other", label: "Other Document" },
];

const getFileIcon = (fileType) => {
  if (fileType.includes("pdf")) return <FileText className="w-8 h-8 text-red-500" />;
  if (fileType.includes("image")) return <FileImage className="w-8 h-8 text-blue-500" />;
  if (fileType.includes("word") || fileType.includes("document")) return <FileType className="w-8 h-8 text-blue-700" />;
  return <File className="w-8 h-8 text-gray-500" />;
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export default function DocumentsPage() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    category: "court_order",
    description: ""
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 10MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    const formDataObj = new FormData();
    formDataObj.append("file", selectedFile);
    formDataObj.append("category", formData.category);
    formDataObj.append("description", formData.description);

    try {
      await axios.post(`${API}/documents`, formDataObj, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      toast.success("Document uploaded successfully");
      setDialogOpen(false);
      resetForm();
      fetchDocuments();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await axios.delete(`${API}/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Document deleted");
      fetchDocuments();
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  const handleDownload = async (document) => {
    try {
      const response = await axios.get(`${API}/documents/${document.document_id}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { filename, file_type, file_data } = response.data;
      const byteCharacters = atob(file_data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file_type });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download document");
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFormData({
      category: "court_order",
      description: ""
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

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
      <div className="space-y-6 animate-fade-in" data-testid="documents-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-['Merriweather'] text-2xl sm:text-3xl font-bold text-[#1A202C]">
              Documents
            </h1>
            <p className="text-[#718096] mt-1">Store and organize court orders and evidence</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button
                className="bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-full btn-hover"
                data-testid="upload-document-btn"
              >
                <Upload className="w-4 h-4 mr-2" /> Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-['Merriweather']">Upload Document</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>File</Label>
                  <div
                    className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-6 text-center hover:border-[#2C3E50]/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="hidden"
                      data-testid="file-input"
                    />
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        {getFileIcon(selectedFile.type)}
                        <div className="text-left">
                          <p className="font-medium text-[#1A202C]">{selectedFile.name}</p>
                          <p className="text-sm text-[#718096]">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 mx-auto text-[#718096] mb-3" />
                        <p className="text-[#718096]">Click to select a file</p>
                        <p className="text-sm text-[#9CA3AF] mt-1">PDF, Images, Word docs (max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="border-[#E2E8F0]" data-testid="document-category-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the document..."
                    className="border-[#E2E8F0] min-h-[80px]"
                    data-testid="document-description-input"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setDialogOpen(false); resetForm(); }}
                    className="border-[#E2E8F0]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedFile || uploading}
                    className="bg-[#2C3E50] hover:bg-[#34495E] text-white"
                    data-testid="submit-upload-btn"
                  >
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Uploading...
                      </span>
                    ) : (
                      "Upload"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#718096]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="pl-12 h-12 bg-white border-[#E2E8F0]"
              data-testid="document-search-input"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-48 h-12 bg-white border-[#E2E8F0]" data-testid="filter-category-select">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {DOCUMENT_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc, index) => (
              <Card
                key={doc.document_id}
                className={`bg-white border-[#E2E8F0] card-hover animate-fade-in stagger-${Math.min(index + 1, 5)}`}
                data-testid={`document-card-${doc.document_id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getFileIcon(doc.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1A202C] truncate">{doc.filename}</p>
                      <p className="text-sm text-[#718096] mt-1">
                        {DOCUMENT_CATEGORIES.find(c => c.value === doc.category)?.label}
                      </p>
                      {doc.description && (
                        <p className="text-sm text-[#718096] mt-1 line-clamp-2">{doc.description}</p>
                      )}
                      <p className="text-xs text-[#9CA3AF] mt-2">
                        {formatFileSize(doc.file_size)} • {format(parseISO(doc.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[#E2E8F0]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="border-[#E2E8F0] text-[#2C3E50]"
                      data-testid={`download-doc-${doc.document_id}`}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.document_id)}
                      className="border-[#E2E8F0] text-red-500 hover:text-red-700 hover:bg-red-50"
                      data-testid={`delete-doc-${doc.document_id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white border-[#E2E8F0]">
            <CardContent className="py-16">
              <div className="empty-state">
                <FileText className="w-16 h-16 text-[#718096] opacity-50" />
                <h3 className="font-['Merriweather'] text-xl font-bold text-[#1A202C] mt-4">
                  {searchQuery || filterCategory !== "all" ? "No matching documents" : "No documents uploaded"}
                </h3>
                <p className="text-[#718096] mt-2">
                  {searchQuery || filterCategory !== "all" 
                    ? "Try adjusting your filters" 
                    : "Upload court orders, evidence, and other important files"}
                </p>
                {!searchQuery && filterCategory === "all" && (
                  <Button
                    onClick={() => setDialogOpen(true)}
                    className="mt-6 bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-full"
                    data-testid="empty-upload-btn"
                  >
                    <Upload className="w-4 h-4 mr-2" /> Upload Your First Document
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
