import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, API } from "@/App";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Clock,
  BookOpen,
  AlertTriangle,
  Calendar,
  FileText,
  Filter,
  Search,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";

const RECORD_TYPES = [
  { value: "all", label: "All Records", icon: Clock },
  { value: "journal", label: "Journal Entries", icon: BookOpen },
  { value: "violation", label: "Violations", icon: AlertTriangle },
  { value: "event", label: "Calendar Events", icon: Calendar },
  { value: "document", label: "Documents", icon: FileText },
];

export default function TimelinePage() {
  const { token } = useAuth();
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = newest first
  const [expandedItems, setExpandedItems] = useState(new Set());

  useEffect(() => {
    fetchAllRecords();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [records, filterType, searchQuery, dateFrom, dateTo, sortOrder]);

  const fetchAllRecords = async () => {
    setLoading(true);
    try {
      const [journalsRes, violationsRes, eventsRes, documentsRes] = await Promise.all([
        axios.get(`${API}/journals`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/violations`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/calendar`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/documents`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      // Normalize all records into a unified format
      const allRecords = [
        ...journalsRes.data.map(item => ({
          id: item.journal_id,
          type: "journal",
          title: item.title,
          content: item.content,
          date: item.date,
          icon: BookOpen,
          color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
          metadata: { mood: item.mood, children: item.children_involved }
        })),
        ...violationsRes.data.map(item => ({
          id: item.violation_id,
          type: "violation",
          title: `${item.type} Violation`,
          content: item.description,
          date: item.date,
          icon: AlertTriangle,
          color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
          metadata: { severity: item.severity, witnesses: item.witnesses }
        })),
        ...eventsRes.data.map(item => ({
          id: item.event_id,
          type: "event",
          title: item.title,
          content: item.notes || `${item.event_type} event`,
          date: item.start_date,
          icon: Calendar,
          color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          metadata: { location: item.location, event_type: item.event_type }
        })),
        ...documentsRes.data.map(item => ({
          id: item.document_id,
          type: "document",
          title: item.file_name,
          content: item.description || "Document uploaded",
          date: item.uploaded_at?.split("T")[0] || new Date().toISOString().split("T")[0],
          icon: FileText,
          color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
          metadata: { file_type: item.file_type, category: item.category }
        })),
      ];

      setRecords(allRecords);
    } catch (error) {
      toast.error("Failed to load timeline data");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...records];

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(r => r.type === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.content.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if (dateFrom) {
      const fromDate = startOfDay(parseISO(dateFrom));
      filtered = filtered.filter(r => !isBefore(parseISO(r.date), fromDate));
    }
    if (dateTo) {
      const toDate = endOfDay(parseISO(dateTo));
      filtered = filtered.filter(r => !isAfter(parseISO(r.date), toDate));
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    setFilteredRecords(filtered);
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setFilterType("all");
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
            <h1 className="font-['Merriweather'] text-2xl sm:text-3xl font-bold text-foreground">
              Timeline
            </h1>
            <p className="text-muted-foreground mt-1">
              View all your records in chronological order
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
              className="flex items-center gap-2"
              data-testid="sort-toggle"
            >
              {sortOrder === "desc" ? (
                <>
                  <ChevronDown className="w-4 h-4" /> Newest First
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4" /> Oldest First
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border" data-testid="filters-card">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="timeline-search"
                />
              </div>

              {/* Type Filter */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger data-testid="type-filter">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {RECORD_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date From */}
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From date"
                data-testid="date-from"
              />

              {/* Date To */}
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To date"
                data-testid="date-to"
              />
            </div>

            {(filterType !== "all" || searchQuery || dateFrom || dateTo) && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {filteredRecords.length} of {records.length} records
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-primary hover:text-primary/80"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <div className="relative" data-testid="timeline-container">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border hidden sm:block"></div>

          {filteredRecords.length > 0 ? (
            <div className="space-y-4">
              {filteredRecords.map((record, index) => {
                const Icon = record.icon;
                const isExpanded = expandedItems.has(record.id);
                
                return (
                  <div
                    key={`${record.type}-${record.id}`}
                    className="relative flex gap-4 animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    data-testid={`timeline-item-${record.id}`}
                  >
                    {/* Timeline dot */}
                    <div className="hidden sm:flex flex-shrink-0 w-12 h-12 rounded-full bg-card border-2 border-border items-center justify-center z-10">
                      <Icon className={`w-5 h-5 ${record.color.split(" ")[1]}`} />
                    </div>

                    {/* Content card */}
                    <Card 
                      className="flex-1 bg-card border-border cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => toggleExpand(record.id)}
                    >
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`badge ${record.color}`}>
                                {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(parseISO(record.date), "MMM d, yyyy")}
                              </span>
                            </div>
                            <h3 className="font-semibold text-foreground mt-2 truncate">
                              {record.title}
                            </h3>
                            <p className={`text-sm text-muted-foreground mt-1 ${isExpanded ? "" : "line-clamp-2"}`}>
                              {record.content}
                            </p>
                            
                            {/* Expanded metadata */}
                            {isExpanded && record.metadata && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  {record.metadata.mood && (
                                    <span className="px-2 py-1 bg-secondary rounded">
                                      Mood: {record.metadata.mood}
                                    </span>
                                  )}
                                  {record.metadata.severity && (
                                    <span className="px-2 py-1 bg-secondary rounded">
                                      Severity: {record.metadata.severity}
                                    </span>
                                  )}
                                  {record.metadata.location && (
                                    <span className="px-2 py-1 bg-secondary rounded">
                                      Location: {record.metadata.location}
                                    </span>
                                  )}
                                  {record.metadata.event_type && (
                                    <span className="px-2 py-1 bg-secondary rounded">
                                      Type: {record.metadata.event_type}
                                    </span>
                                  )}
                                  {record.metadata.category && (
                                    <span className="px-2 py-1 bg-secondary rounded">
                                      Category: {record.metadata.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0 sm:hidden">
                            <div className={`w-10 h-10 rounded-full ${record.color.split(" ")[0]} flex items-center justify-center`}>
                              <Icon className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-12">
                <div className="empty-state">
                  <Clock className="w-12 h-12 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mt-4">
                    {records.length === 0 
                      ? "No records yet. Start by adding journal entries, violations, or events."
                      : "No records match your filters."}
                  </p>
                  {(filterType !== "all" || searchQuery || dateFrom || dateTo) && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
