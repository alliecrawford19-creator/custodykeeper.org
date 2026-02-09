import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, API } from "@/App";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Share2, 
  Plus, 
  Copy, 
  Trash2, 
  ExternalLink, 
  Shield, 
  Clock,
  BookOpen,
  AlertTriangle,
  FileText,
  Calendar,
  Eye,
  Printer,
  Download
} from "lucide-react";
import { format, parseISO } from "date-fns";

const PERMISSION_LABELS = {
  "read_only": { label: "View Only", icon: Eye, description: "Can only view records" },
  "read_print": { label: "View & Print", icon: Printer, description: "Can view and print records" },
  "read_print_download": { label: "Full Access", icon: Download, description: "Can view, print, and download documents" }
};

export default function SharingPage() {
  const { token } = useAuth();
  const [shareTokens, setShareTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    expires_days: 30,
    include_journals: true,
    include_violations: true,
    include_documents: true,
    include_calendar: true,
    permission_level: "read_print"
  });

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await axios.get(`${API}/share/tokens`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShareTokens(response.data);
    } catch (error) {
      console.error("Failed to fetch share tokens:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/share/tokens`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Share link created successfully");
      setDialogOpen(false);
      setFormData({
        name: "",
        expires_days: 30,
        include_journals: true,
        include_violations: true,
        include_documents: true,
        include_calendar: true,
        permission_level: "read_print"
      });
      fetchTokens();
    } catch (error) {
      toast.error("Failed to create share link");
    }
  };

  const handleRevoke = async (tokenId) => {
    if (!confirm("Are you sure you want to revoke this share link?")) return;
    try {
      await axios.delete(`${API}/share/tokens/${tokenId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Share link revoked");
      fetchTokens();
    } catch (error) {
      toast.error("Failed to revoke share link");
    }
  };

  const copyShareLink = (shareToken) => {
    const shareUrl = `${window.location.origin}/shared/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard");
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2C3E50]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-['Merriweather'] text-2xl sm:text-3xl font-bold text-[#1A202C]">
              Attorney Sharing
            </h1>
            <p className="text-[#718096] mt-1">
              Create secure, read-only links to share your records with attorneys
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-full"
                data-testid="create-share-btn"
              >
                <Plus className="w-4 h-4 mr-2" /> Create Share Link
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="font-['Merriweather']">Create Share Link</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Recipient Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Attorney John Smith"
                    required
                    className="border-[#E2E8F0]"
                    data-testid="share-name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Link Expires In</Label>
                  <Select
                    value={String(formData.expires_days)}
                    onValueChange={(value) => setFormData({ ...formData, expires_days: parseInt(value) })}
                  >
                    <SelectTrigger className="border-[#E2E8F0]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Permission Level</Label>
                  <Select
                    value={formData.permission_level}
                    onValueChange={(value) => setFormData({ ...formData, permission_level: value })}
                  >
                    <SelectTrigger className="border-[#E2E8F0]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read_only">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          <span>View Only</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="read_print">
                        <div className="flex items-center gap-2">
                          <Printer className="w-4 h-4" />
                          <span>View & Print</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="read_print_download">
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          <span>Full Access (View, Print, Download)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[#9CA3AF]">
                    {PERMISSION_LABELS[formData.permission_level]?.description}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="text-sm font-medium">Include in Share</Label>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#718096]" />
                      <span className="text-sm">Journal Entries</span>
                    </div>
                    <Switch
                      checked={formData.include_journals}
                      onCheckedChange={(checked) => setFormData({ ...formData, include_journals: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#718096]" />
                      <span className="text-sm">Violations</span>
                    </div>
                    <Switch
                      checked={formData.include_violations}
                      onCheckedChange={(checked) => setFormData({ ...formData, include_violations: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#718096]" />
                      <span className="text-sm">Documents</span>
                    </div>
                    <Switch
                      checked={formData.include_documents}
                      onCheckedChange={(checked) => setFormData({ ...formData, include_documents: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#718096]" />
                      <span className="text-sm">Calendar Events</span>
                    </div>
                    <Switch
                      checked={formData.include_calendar}
                      onCheckedChange={(checked) => setFormData({ ...formData, include_calendar: checked })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#2C3E50] hover:bg-[#34495E]">
                    Create Link
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Card */}
        <Card className="bg-[#E8F6F3] border-none">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-[#2C3E50] flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-[#1A202C]">Secure Sharing</h3>
                <p className="text-sm text-[#718096] mt-1">
                  Share links provide read-only access to your selected records. Recipients cannot 
                  modify any data. Links automatically expire and can be revoked at any time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share Links List */}
        <Card className="bg-white border-[#E2E8F0]">
          <CardHeader>
            <CardTitle className="font-['Merriweather'] text-lg font-bold text-[#1A202C]">
              Active Share Links
            </CardTitle>
            <CardDescription>
              Manage your shared access links
            </CardDescription>
          </CardHeader>
          <CardContent>
            {shareTokens.filter(t => t.is_active).length > 0 ? (
              <div className="space-y-4">
                {shareTokens.filter(t => t.is_active).map(shareToken => (
                  <div
                    key={shareToken.token_id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#FDFBF7] rounded-xl border border-[#E2E8F0] gap-4"
                    data-testid={`share-token-${shareToken.token_id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-[#2C3E50]" />
                        <p className="font-semibold text-[#1A202C]">{shareToken.name}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {shareToken.include_journals && (
                          <span className="badge badge-primary">Journals</span>
                        )}
                        {shareToken.include_violations && (
                          <span className="badge badge-danger">Violations</span>
                        )}
                        {shareToken.include_documents && (
                          <span className="badge badge-warning">Documents</span>
                        )}
                        {shareToken.include_calendar && (
                          <span className="badge bg-green-100 text-green-700">Calendar</span>
                        )}
                        <span className="badge bg-purple-100 text-purple-700">
                          {PERMISSION_LABELS[shareToken.permission_level || "read_only"]?.label || "View Only"}
                        </span>
                      </div>
                      <p className="text-xs text-[#718096] mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires: {format(parseISO(shareToken.expires_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyShareLink(shareToken.share_token)}
                        className="border-[#E2E8F0] text-[#1A202C]"
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-[#E2E8F0] text-[#1A202C]"
                      >
                        <a href={`/shared/${shareToken.share_token}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-1" /> Preview
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(shareToken.token_id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state py-8">
                <Share2 className="w-12 h-12 text-[#718096] opacity-50" />
                <p className="text-[#718096] mt-4">No active share links</p>
                <Button
                  onClick={() => setDialogOpen(true)}
                  className="mt-4 bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-full"
                >
                  <Plus className="w-4 h-4 mr-2" /> Create Your First Share Link
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
