import { useState, useEffect } from "react";
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
import { Plus, AlertTriangle, Search, Trash2, Download, Clock, FileWarning, Edit2, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PrintableExport } from "@/components/PrintableExport";
import { generateCourtReadyPDF } from "@/utils/pdfExport";

const VIOLATION_TYPES = [
  { value: "parenting_time_denial", label: "Parenting Time Denial" },
  { value: "custody_interference", label: "Custody Interference" },
  { value: "parental_alienation", label: "Parental Alienation" },
  { value: "communication_blocking", label: "Blocking Communication with Child" },
  { value: "false_allegations", label: "False Allegations" },
  { value: "schedule_violation", label: "Schedule/Order Violation" },
  { value: "late_pickup_dropoff", label: "Late Pickup/Drop-off" },
  { value: "no_show", label: "No Show for Exchange" },
  { value: "child_support_nonpayment", label: "Child Support Non-Payment" },
  { value: "child_support_late", label: "Child Support Late Payment" },
  { value: "medical_decision_violation", label: "Medical Decision Violation" },
  { value: "education_decision_violation", label: "Education Decision Violation" },
  { value: "relocation_violation", label: "Unauthorized Relocation" },
  { value: "third_party_interference", label: "Third Party Interference" },
  { value: "verbal_abuse", label: "Verbal Abuse/Harassment" },
  { value: "threats", label: "Threats/Intimidation" },
  { value: "badmouthing", label: "Badmouthing Parent to Child" },
  { value: "withholding_information", label: "Withholding Information" },
  { value: "other", label: "Other Violation" },
];

const SEVERITY_LEVELS = [
  { value: "low", label: "Low", color: "severity-low" },
  { value: "medium", label: "Medium", color: "severity-medium" },
  { value: "high", label: "High", color: "severity-high" },
];

export default function ViolationsPage() {
  const { token, user } = useAuth();
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingViolation, setEditingViolation] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    violation_type: "parenting_time_denial",
    description: "",
    date: new Date().toISOString().split("T")[0],
    severity: "medium",
    witnesses: "",
    evidence_notes: ""
  });

  const handlePDFExport = () => {
    if (filteredViolations.length === 0) {
      toast.error("No violations to export");
      return;
    }
    try {
      const fileName = generateCourtReadyPDF({
        title: "Violation Log Records",
        records: filteredViolations,
        type: "violation",
        userName: user?.full_name,
        userState: user?.state
      });
      toast.success(`PDF exported: ${fileName}`);
    } catch (error) {
      toast.error("Failed to generate PDF");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  const fetchViolations = async () => {
    try {
      const response = await axios.get(`${API}/violations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setViolations(response.data);
    } catch (error) {
      console.error("Failed to fetch violations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingViolation) {
        await axios.put(`${API}/violations/${editingViolation.violation_id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Violation updated successfully");
      } else {
        await axios.post(`${API}/violations`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Violation logged successfully");
      }
      setDialogOpen(false);
      resetForm();
      fetchViolations();
    } catch (error) {
      toast.error(editingViolation ? "Failed to update violation" : "Failed to log violation");
    }
  };

  const handleEdit = (violation) => {
    setEditingViolation(violation);
    setFormData({
      title: violation.title,
      violation_type: violation.violation_type,
      description: violation.description,
      date: violation.date,
      severity: violation.severity,
      witnesses: violation.witnesses || "",
      evidence_notes: violation.evidence_notes || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async (violationId) => {
    if (!confirm("Are you sure you want to delete this violation record?")) return;
    try {
      await axios.delete(`${API}/violations/${violationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Violation deleted");
      fetchViolations();
    } catch (error) {
      toast.error("Failed to delete violation");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      violation_type: "custody_interference",
      severity: "medium",
      witnesses: "",
      evidence_notes: ""
    });
    setEditingViolation(null);
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API}/export/violations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `violations-export-${format(new Date(), "yyyy-MM-dd")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Violations exported successfully");
    } catch (error) {
      toast.error("Failed to export violations");
    }
  };

  const filteredViolations = violations.filter(violation => {
    const matchesSearch = 
      violation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      violation.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = filterSeverity === "all" || violation.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityColor = (severity) => {
    return SEVERITY_LEVELS.find(s => s.value === severity)?.color || "severity-medium";
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
      <div className="space-y-6 animate-fade-in" data-testid="violations-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-['Merriweather'] text-2xl sm:text-3xl font-bold text-[#1A202C]">
              Violation Log
            </h1>
            <p className="text-[#718096] mt-1">Document custody agreement violations for legal proceedings</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={handleExport}
              className="border-[#E2E8F0] text-[#2C3E50]"
              data-testid="export-violations-btn"
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button
              variant="outline"
              onClick={handlePDFExport}
              className="border-[#E2E8F0] text-[#2C3E50]"
              data-testid="pdf-export-violations-btn"
            >
              <FileText className="w-4 h-4 mr-2" /> PDF
            </Button>
            <PrintableExport 
              title="Violation Log" 
              records={filteredViolations} 
              type="violation"
            />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-[#D35400] hover:bg-[#E67E22] text-white rounded-full btn-hover"
                  data-testid="log-violation-btn"
                >
                  <Plus className="w-4 h-4 mr-2" /> Log Violation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-['Merriweather'] flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#D35400]" />
                    {editingViolation ? "Edit Violation" : "Log Custody Violation"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Violation Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Denied weekend parenting time"
                      required
                      className="border-[#E2E8F0]"
                      data-testid="violation-title-input"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        className="border-[#E2E8F0]"
                        data-testid="violation-date-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={formData.violation_type}
                        onValueChange={(value) => setFormData({ ...formData, violation_type: value })}
                      >
                        <SelectTrigger className="border-[#E2E8F0]" data-testid="violation-type-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VIOLATION_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <Select
                        value={formData.severity}
                        onValueChange={(value) => setFormData({ ...formData, severity: value })}
                      >
                        <SelectTrigger className="border-[#E2E8F0]" data-testid="violation-severity-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SEVERITY_LEVELS.map(level => (
                            <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what happened in detail. Include times, locations, and any communication..."
                      required
                      className="border-[#E2E8F0] min-h-[150px]"
                      data-testid="violation-description-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Witnesses (optional)</Label>
                    <Input
                      value={formData.witnesses}
                      onChange={(e) => setFormData({ ...formData, witnesses: e.target.value })}
                      placeholder="Names and contact info of any witnesses"
                      className="border-[#E2E8F0]"
                      data-testid="violation-witnesses-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Evidence Notes (optional)</Label>
                    <Textarea
                      value={formData.evidence_notes}
                      onChange={(e) => setFormData({ ...formData, evidence_notes: e.target.value })}
                      placeholder="Note any screenshots, texts, photos, or other evidence you have..."
                      className="border-[#E2E8F0] min-h-[80px]"
                      data-testid="violation-evidence-input"
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
                      className="bg-[#D35400] hover:bg-[#E67E22] text-white"
                      data-testid="save-violation-btn"
                    >
                      Log Violation
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#718096]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search violations..."
              className="pl-12 h-12 bg-white border-[#E2E8F0]"
              data-testid="violation-search-input"
            />
          </div>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-full sm:w-48 h-12 bg-white border-[#E2E8F0]" data-testid="filter-severity-select">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              {SEVERITY_LEVELS.map(level => (
                <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {SEVERITY_LEVELS.map(level => {
            const count = violations.filter(v => v.severity === level.value).length;
            return (
              <Card key={level.value} className="bg-white border-[#E2E8F0]">
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-bold ${
                    level.value === "high" ? "text-red-600" :
                    level.value === "medium" ? "text-amber-600" : "text-green-600"
                  }`}>{count}</p>
                  <p className="text-sm text-[#718096]">{level.label} Severity</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Violations List */}
        {filteredViolations.length > 0 ? (
          <div className="space-y-4">
            {filteredViolations.map((violation, index) => (
              <Card
                key={violation.violation_id}
                className={`bg-white border-[#E2E8F0] border-l-4 ${
                  violation.severity === "high" ? "border-l-red-500" :
                  violation.severity === "medium" ? "border-l-amber-500" : "border-l-green-500"
                } card-hover animate-fade-in stagger-${Math.min(index + 1, 5)}`}
                data-testid={`violation-card-${violation.violation_id}`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="font-['Merriweather'] text-xl font-bold text-[#1A202C]">
                          {violation.title}
                        </h3>
                        <span className={`badge ${getSeverityColor(violation.severity)}`}>
                          {SEVERITY_LEVELS.find(s => s.value === violation.severity)?.label}
                        </span>
                        <span className="badge badge-primary">
                          {VIOLATION_TYPES.find(t => t.value === violation.violation_type)?.label}
                        </span>
                      </div>
                      <p className="text-[#718096] whitespace-pre-wrap">
                        {violation.description}
                      </p>
                      {violation.witnesses && (
                        <p className="text-sm text-[#718096] mt-3">
                          <span className="font-semibold">Witnesses:</span> {violation.witnesses}
                        </p>
                      )}
                      {violation.evidence_notes && (
                        <p className="text-sm text-[#718096] mt-2">
                          <span className="font-semibold">Evidence:</span> {violation.evidence_notes}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-4 text-sm text-[#718096]">
                        <Clock className="w-4 h-4" />
                        {format(parseISO(violation.date), "MMMM d, yyyy")}
                      </div>
                    </div>
                    <div className="flex sm:flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(violation)}
                        className="border-[#E2E8F0] text-[#2C3E50] hover:bg-[#E8F6F3]"
                        data-testid={`edit-violation-${violation.violation_id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(violation.violation_id)}
                        className="border-[#E2E8F0] text-red-500 hover:text-red-700 hover:bg-red-50"
                        data-testid={`delete-violation-${violation.violation_id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white border-[#E2E8F0]">
            <CardContent className="py-16">
              <div className="empty-state">
                <FileWarning className="w-16 h-16 text-[#718096] opacity-50" />
                <h3 className="font-['Merriweather'] text-xl font-bold text-[#1A202C] mt-4">
                  {searchQuery || filterSeverity !== "all" ? "No matching violations" : "No violations logged"}
                </h3>
                <p className="text-[#718096] mt-2">
                  {searchQuery || filterSeverity !== "all" 
                    ? "Try adjusting your filters" 
                    : "Log violations as they occur for evidentiary purposes"}
                </p>
                {!searchQuery && filterSeverity === "all" && (
                  <Button
                    onClick={() => setDialogOpen(true)}
                    className="mt-6 bg-[#D35400] hover:bg-[#E67E22] text-white rounded-full"
                    data-testid="empty-log-violation-btn"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Log First Violation
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
