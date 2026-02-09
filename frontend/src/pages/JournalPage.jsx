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
import { Plus, BookOpen, Search, Trash2, Edit2, Download, Clock, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PrintableExport } from "@/components/PrintableExport";

const MOOD_OPTIONS = [
  { value: "happy", label: "Happy", color: "mood-happy" },
  { value: "excited", label: "Excited", color: "mood-happy" },
  { value: "calm", label: "Calm", color: "mood-neutral" },
  { value: "content", label: "Content", color: "mood-neutral" },
  { value: "neutral", label: "Neutral", color: "mood-neutral" },
  { value: "tired", label: "Tired", color: "mood-neutral" },
  { value: "anxious", label: "Anxious", color: "mood-concerned" },
  { value: "upset", label: "Upset", color: "mood-concerned" },
  { value: "sad", label: "Sad", color: "mood-sad" },
  { value: "withdrawn", label: "Withdrawn", color: "mood-sad" },
  { value: "angry", label: "Angry", color: "mood-concerned" },
  { value: "fearful", label: "Fearful", color: "mood-concerned" },
  { value: "confused", label: "Confused", color: "mood-concerned" },
  { value: "resistant", label: "Resistant to Visit", color: "mood-concerned" },
];

export default function JournalPage() {
  const { token } = useAuth();
  const [journals, setJournals] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [childFilter, setChildFilter] = useState("all"); // Multi-child filter
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    date: format(new Date(), "yyyy-MM-dd"),
    children_involved: [],
    mood: "neutral",
    location: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [journalsRes, childrenRes] = await Promise.all([
        axios.get(`${API}/journals`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/children`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setJournals(journalsRes.data);
      setChildren(childrenRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter journals by search query and child
  const filteredJournals = journals.filter(journal => {
    const matchesSearch = !searchQuery || 
      journal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      journal.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesChild = childFilter === "all" || 
      (journal.children_involved && journal.children_involved.includes(childFilter));
    
    return matchesSearch && matchesChild;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingJournal) {
        await axios.put(`${API}/journals/${editingJournal.journal_id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Journal entry updated");
      } else {
        await axios.post(`${API}/journals`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Journal entry created");
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Failed to save journal entry");
    }
  };

  const handleDelete = async (journalId) => {
    if (!confirm("Are you sure you want to delete this journal entry?")) return;
    try {
      await axios.delete(`${API}/journals/${journalId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Journal entry deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete journal entry");
    }
  };

  const handleEdit = (journal) => {
    setEditingJournal(journal);
    setFormData({
      title: journal.title,
      content: journal.content,
      date: journal.date,
      children_involved: journal.children_involved,
      mood: journal.mood,
      location: journal.location
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingJournal(null);
    setFormData({
      title: "",
      content: "",
      date: format(new Date(), "yyyy-MM-dd"),
      children_involved: [],
      mood: "neutral",
      location: ""
    });
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API}/export/journals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `journals-export-${format(new Date(), "yyyy-MM-dd")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Journals exported successfully");
    } catch (error) {
      toast.error("Failed to export journals");
    }
  };

  const filteredJournals = journals.filter(journal =>
    journal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    journal.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMoodColor = (mood) => {
    return MOOD_OPTIONS.find(m => m.value === mood)?.color || "mood-neutral";
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
      <div className="space-y-6 animate-fade-in" data-testid="journal-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-['Merriweather'] text-2xl sm:text-3xl font-bold text-[#1A202C]">
              Parenting Journal
            </h1>
            <p className="text-[#718096] mt-1">Document your time with your children</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleExport}
              className="border-[#E2E8F0] text-[#2C3E50]"
              data-testid="export-journals-btn"
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button
                  className="bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-full btn-hover"
                  data-testid="add-journal-btn"
                >
                  <Plus className="w-4 h-4 mr-2" /> New Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-['Merriweather']">
                    {editingJournal ? "Edit Journal Entry" : "New Journal Entry"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1 space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Weekend at the park"
                        required
                        className="border-[#E2E8F0]"
                        data-testid="journal-title-input"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        className="border-[#E2E8F0]"
                        data-testid="journal-date-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mood</Label>
                      <Select
                        value={formData.mood}
                        onValueChange={(value) => setFormData({ ...formData, mood: value })}
                      >
                        <SelectTrigger className="border-[#E2E8F0]" data-testid="journal-mood-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MOOD_OPTIONS.map(mood => (
                            <SelectItem key={mood.value} value={mood.value}>{mood.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Location (optional)</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., City Park"
                        className="border-[#E2E8F0]"
                        data-testid="journal-location-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Journal Entry</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Describe your time with your children in detail. Include activities, conversations, and observations..."
                      required
                      className="border-[#E2E8F0] min-h-[200px]"
                      data-testid="journal-content-input"
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
                      className="bg-[#2C3E50] hover:bg-[#34495E] text-white"
                      data-testid="save-journal-btn"
                    >
                      {editingJournal ? "Update Entry" : "Save Entry"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search journal entries..."
              className="pl-12 h-12 bg-card border-border"
              data-testid="journal-search-input"
            />
          </div>
          {children.length > 0 && (
            <Select value={childFilter} onValueChange={setChildFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-12" data-testid="child-filter">
                <SelectValue placeholder="Filter by child" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Children</SelectItem>
                {children.map(child => (
                  <SelectItem key={child.child_id} value={child.child_id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: child.color || '#3B82F6' }}
                      />
                      {child.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Active Filters Display */}
        {(searchQuery || childFilter !== "all") && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {filteredJournals.length} of {journals.length} entries
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearchQuery(""); setChildFilter("all"); }}
              className="text-primary hover:text-primary/80"
            >
              Clear filters
            </Button>
          </div>
        )}

        {/* Journal Entries */}
        {filteredJournals.length > 0 ? (
          <div className="space-y-4">
            {filteredJournals.map((journal, index) => (
              <Card
                key={journal.journal_id}
                className={`bg-white border-[#E2E8F0] card-hover animate-fade-in stagger-${Math.min(index + 1, 5)}`}
                data-testid={`journal-card-${journal.journal_id}`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-['Merriweather'] text-xl font-bold text-[#1A202C]">
                          {journal.title}
                        </h3>
                        <span className={`badge ${getMoodColor(journal.mood)}`}>
                          {MOOD_OPTIONS.find(m => m.value === journal.mood)?.label}
                        </span>
                      </div>
                      <p className="text-[#718096] whitespace-pre-wrap line-clamp-4">
                        {journal.content}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-[#718096]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(parseISO(journal.date), "MMMM d, yyyy")}
                        </span>
                        {journal.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {journal.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex sm:flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(journal)}
                        className="border-[#E2E8F0] text-[#2C3E50]"
                        data-testid={`edit-journal-${journal.journal_id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(journal.journal_id)}
                        className="border-[#E2E8F0] text-red-500 hover:text-red-700 hover:bg-red-50"
                        data-testid={`delete-journal-${journal.journal_id}`}
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
                <BookOpen className="w-16 h-16 text-[#718096] opacity-50" />
                <h3 className="font-['Merriweather'] text-xl font-bold text-[#1A202C] mt-4">
                  {searchQuery ? "No matching entries" : "No journal entries yet"}
                </h3>
                <p className="text-[#718096] mt-2">
                  {searchQuery ? "Try adjusting your search" : "Start documenting your parenting time"}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setDialogOpen(true)}
                    className="mt-6 bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-full"
                    data-testid="empty-add-journal-btn"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Create Your First Entry
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
