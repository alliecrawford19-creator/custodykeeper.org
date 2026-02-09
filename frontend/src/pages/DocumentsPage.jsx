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
import { Plus, FileText, Upload, Trash2, Download, Search, File, FileImage, FileType, Eye, X, Video, Music, Share2 } from "lucide-react";
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
  if (fileType.includes("video")) return <Video className="w-8 h-8 text-purple-500" />;
  if (fileType.includes("audio")) return <Music className="w-8 h-8 text-green-500" />;
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
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
      toast.info("Downloading document...");
      const response = await axios.get(`${API}/documents/${document.document_id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'json'
      });
      
      const { filename, file_type, file_data } = response.data;
      
      // Decode base64 to blob
      const byteCharacters = atob(file_data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file_type });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Document downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    }
  };

  const handleShare = async (document) => {
    try {
      toast.info("Preparing document for sharing...");
      
      // Get the file data
      const response = await axios.get(`${API}/documents/${document.document_id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'json'
      });
      
      const { filename, file_type, file_data } = response.data;
      
      // Decode base64 to blob
      const byteCharacters = atob(file_data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file_type });
      
      // Create File object for Web Share API
      const file = new File([blob], filename, { type: file_type });
      
      // Check if Web Share API is supported
      if (navigator.share) {
        try {
          await navigator.share({
            files: [file],
            title: filename,
            text: document.description || `Sharing ${filename}`
          });
          toast.success("Document shared successfully");
        } catch (shareError) {
          if (shareError.name === 'AbortError') {
            // User cancelled the share
            console.log("Share cancelled");
            toast.info("Share cancelled");
          } else {
            throw shareError;
          }
        }
      } else {
        // Fallback: Download instead
        toast.info("Sharing not available. Downloading document instead.");
        handleDownload(document);
      }
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share document. Try downloading instead.");
    }
  };

  const handlePreview = async (doc) => {
    setPreviewDoc(doc);
    setPreviewOpen(true);
    setPreviewLoading(true);
    
    try {
      const response = await axios.get(`${API}/documents/${doc.document_id}/download`, {
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
      
      setPreviewData({
        url,
        filename,
        file_type,
        blob
      });
    } catch (error) {
      toast.error("Failed to load document preview");
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewData?.url) {
      URL.revokeObjectURL(previewData.url);
    }
    setPreviewOpen(false);
    setPreviewDoc(null);
    setPreviewData(null);
  };

  const renderPreviewContent = () => {
    if (previewLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="spinner"></div>
        </div>
      );
    }

    if (!previewData) return null;

    const { url, file_type, filename } = previewData;

    // PDF Preview
    if (file_type.includes("pdf")) {
      return (
        <iframe
          src={url}
          className="w-full h-[70vh] rounded-lg border border-[#E2E8F0]"
          title={filename}
        />
      );
    }

    // Image Preview
    if (file_type.includes("image")) {
      return (
        <div className="flex items-center justify-center bg-[#F9FAFB] rounded-lg p-4">
          <img
            src={url}
            alt={filename}
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
          />
        </div>
      );
    }

    // Video Preview
    if (file_type.includes("video")) {
      return (
        <div className="flex items-center justify-center bg-[#1A202C] rounded-lg p-4">
          <video
            src={url}
            controls
            className="max-w-full max-h-[70vh] rounded-lg"
            controlsList="nodownload"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Audio Preview
    if (file_type.includes("audio")) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-[#F9FAFB] rounded-lg p-8">
          <Music className="w-20 h-20 text-green-500 mb-6" />
          <p className="text-[#1A202C] font-medium mb-4">{filename}</p>
          <audio
            src={url}
            controls
            className="w-full max-w-md"
            controlsList="nodownload"
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    // Word Documents - Show download option since browsers can't render them directly
    if (file_type.includes("word") || file_type.includes("document") || file_type.includes("msword")) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-[#F9FAFB] rounded-lg">
          <FileType className="w-16 h-16 text-blue-700 mb-4" />
          <p className="text-[#1A202C] font-medium mb-2">{filename}</p>
          <p className="text-[#718096] text-sm mb-4">Word documents cannot be previewed in browser</p>
          <Button
            onClick={() => handleDownload(previewDoc)}
            className="bg-[#2C3E50] hover:bg-[#34495E] text-white"
          >
            <Download className="w-4 h-4 mr-2" /> Download to View
          </Button>
        </div>
      );
    }

    // Default - offer download
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-[#F9FAFB] rounded-lg">
        <File className="w-16 h-16 text-gray-500 mb-4" />
        <p className="text-[#1A202C] font-medium mb-2">{filename}</p>
        <p className="text-[#718096] text-sm mb-4">This file type cannot be previewed</p>
        <Button
          onClick={() => handleDownload(previewDoc)}
          className="bg-[#2C3E50] hover:bg-[#34495E] text-white"
        >
          <Download className="w-4 h-4 mr-2" /> Download to View
        </Button>
      </div>
    );
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
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.mp4,.mov,.avi,.webm,.wmv,.3gp,.mp3,.wav,.ogg,.aac,.m4a"
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
                      onClick={() => handlePreview(doc)}
                      className="border-[#E2E8F0] text-[#2C3E50]"
                      data-testid={`view-doc-${doc.document_id}`}
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="border-[#E2E8F0] text-[#2C3E50]"
                      data-testid={`download-doc-${doc.document_id}`}
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(doc)}
                      className="border-[#E2E8F0] text-[#2C3E50]"
                      data-testid={`share-doc-${doc.document_id}`}
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.document_id)}
                      className="border-[#E2E8F0] text-red-500 hover:text-red-700 hover:bg-red-50"
                      data-testid={`delete-doc-${doc.document_id}`}
                      title="Delete"
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

        {/* Document Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={(open) => { if (!open) closePreview(); }}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="font-['Merriweather'] flex items-center gap-2">
                {previewDoc && getFileIcon(previewDoc.file_type)}
                <span className="truncate max-w-md">{previewDoc?.filename}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 overflow-auto">
              {renderPreviewContent()}
            </div>
            {previewData && !previewLoading && (
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#E2E8F0]">
                <Button
                  variant="outline"
                  onClick={() => handleShare(previewDoc)}
                  className="border-[#E2E8F0] text-[#2C3E50]"
                >
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownload(previewDoc)}
                  className="border-[#E2E8F0] text-[#2C3E50]"
                >
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
                <Button
                  onClick={closePreview}
                  className="bg-[#2C3E50] hover:bg-[#34495E] text-white"
                >
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
