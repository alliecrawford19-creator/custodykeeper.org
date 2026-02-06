import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth, API } from "@/App";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  BookOpen,
  AlertTriangle,
  FileText,
  Users,
  Plus,
  ArrowRight,
  Clock,
  Gavel
} from "lucide-react";
import { format, parseISO, differenceInDays, differenceInHours } from "date-fns";

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      return format(parseISO(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr) => {
    try {
      return format(parseISO(dateStr), "h:mm a");
    } catch {
      return "";
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
      <div className="space-y-8 animate-fade-in" data-testid="dashboard-page">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-[#E8F6F3] to-[#FDFBF7] rounded-2xl p-8 border border-[#E2E8F0]">
          <h1 className="font-['Merriweather'] text-2xl sm:text-3xl font-bold text-[#1A202C] mb-2">
            Welcome back, {user?.full_name?.split(" ")[0]}
          </h1>
          <p className="text-[#718096]">
            Here's an overview of your family court records and upcoming events.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-white border-[#E2E8F0] card-hover" data-testid="stat-children">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[#E8F6F3] flex items-center justify-center">
                <Users className="w-5 h-5 text-[#2C3E50]" />
              </div>
              <p className="text-2xl font-bold text-[#1A202C]">{stats?.counts?.children || 0}</p>
              <p className="text-xs text-[#718096]">Children</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-[#E2E8F0] card-hover" data-testid="stat-journals">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[#E8F6F3] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#2C3E50]" />
              </div>
              <p className="text-2xl font-bold text-[#1A202C]">{stats?.counts?.journals || 0}</p>
              <p className="text-xs text-[#718096]">Journal Entries</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-[#E2E8F0] card-hover" data-testid="stat-violations">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[#FEE2E2] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#D35400]" />
              </div>
              <p className="text-2xl font-bold text-[#1A202C]">{stats?.counts?.violations || 0}</p>
              <p className="text-xs text-[#718096]">Violations</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-[#E2E8F0] card-hover" data-testid="stat-documents">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[#E8F6F3] flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#2C3E50]" />
              </div>
              <p className="text-2xl font-bold text-[#1A202C]">{stats?.counts?.documents || 0}</p>
              <p className="text-xs text-[#718096]">Documents</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-[#E2E8F0] card-hover" data-testid="stat-events">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[#E8F6F3] flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#2C3E50]" />
              </div>
              <p className="text-2xl font-bold text-[#1A202C]">{stats?.counts?.events || 0}</p>
              <p className="text-xs text-[#718096]">Events</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <Card className="lg:col-span-2 bg-white border-[#E2E8F0]" data-testid="upcoming-events-card">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="font-['Merriweather'] text-lg font-bold text-[#1A202C]">
                Upcoming Parenting Time
              </CardTitle>
              <Link to="/calendar">
                <Button variant="ghost" size="sm" className="text-[#2C3E50]" data-testid="view-calendar-btn">
                  View Calendar <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.upcoming_events?.length > 0 ? (
                <div className="space-y-3">
                  {stats.upcoming_events.map((event) => (
                    <div
                      key={event.event_id}
                      className="flex items-center gap-4 p-4 bg-[#FDFBF7] rounded-xl border border-[#E2E8F0]"
                      data-testid={`event-${event.event_id}`}
                    >
                      <div className="w-12 h-12 rounded-lg bg-[#E8F6F3] flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-[#2C3E50]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1A202C] truncate">{event.title}</p>
                        <p className="text-sm text-[#718096]">
                          {formatDate(event.start_date)}
                          {event.location && ` • ${event.location}`}
                        </p>
                      </div>
                      <span className={`badge ${
                        event.event_type === "court_date" ? "badge-danger" :
                        event.event_type === "parenting_time" ? "badge-primary" : "badge-warning"
                      }`}>
                        {event.event_type.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state py-8">
                  <Calendar className="w-12 h-12 text-[#718096] opacity-50" />
                  <p className="text-[#718096] mt-4">No upcoming events</p>
                  <Link to="/calendar">
                    <Button className="mt-4 bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-full" data-testid="add-event-btn">
                      <Plus className="w-4 h-4 mr-2" /> Add Event
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white border-[#E2E8F0]" data-testid="quick-actions-card">
            <CardHeader>
              <CardTitle className="font-['Merriweather'] text-lg font-bold text-[#1A202C]">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/journal" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 border-[#E2E8F0] hover:bg-[#E8F6F3] hover:border-[#2C3E50]/30"
                  data-testid="quick-add-journal"
                >
                  <BookOpen className="w-5 h-5 text-[#2C3E50]" />
                  <span className="text-[#1A202C]">Add Journal Entry</span>
                </Button>
              </Link>
              <Link to="/violations" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 border-[#E2E8F0] hover:bg-[#FEE2E2] hover:border-[#D35400]/30"
                  data-testid="quick-log-violation"
                >
                  <AlertTriangle className="w-5 h-5 text-[#D35400]" />
                  <span className="text-[#1A202C]">Log Violation</span>
                </Button>
              </Link>
              <Link to="/documents" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 border-[#E2E8F0] hover:bg-[#E8F6F3] hover:border-[#2C3E50]/30"
                  data-testid="quick-upload-doc"
                >
                  <FileText className="w-5 h-5 text-[#2C3E50]" />
                  <span className="text-[#1A202C]">Upload Document</span>
                </Button>
              </Link>
              <Link to="/calendar" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 border-[#E2E8F0] hover:bg-[#E8F6F3] hover:border-[#2C3E50]/30"
                  data-testid="quick-add-event"
                >
                  <Calendar className="w-5 h-5 text-[#2C3E50]" />
                  <span className="text-[#1A202C]">Schedule Event</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Journals */}
          <Card className="bg-white border-[#E2E8F0]" data-testid="recent-journals-card">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="font-['Merriweather'] text-lg font-bold text-[#1A202C]">
                Recent Journal Entries
              </CardTitle>
              <Link to="/journal">
                <Button variant="ghost" size="sm" className="text-[#2C3E50]" data-testid="view-journals-btn">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.recent_journals?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_journals.slice(0, 3).map((journal) => (
                    <div
                      key={journal.journal_id}
                      className="p-4 bg-[#FDFBF7] rounded-xl border border-[#E2E8F0]"
                      data-testid={`recent-journal-${journal.journal_id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#1A202C] truncate">{journal.title}</p>
                          <p className="text-sm text-[#718096] line-clamp-2 mt-1">{journal.content}</p>
                        </div>
                        <span className="text-xs text-[#718096] whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(journal.date)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state py-8">
                  <BookOpen className="w-12 h-12 text-[#718096] opacity-50" />
                  <p className="text-[#718096] mt-4">No journal entries yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Violations */}
          <Card className="bg-white border-[#E2E8F0]" data-testid="recent-violations-card">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="font-['Merriweather'] text-lg font-bold text-[#1A202C]">
                Recent Violations
              </CardTitle>
              <Link to="/violations">
                <Button variant="ghost" size="sm" className="text-[#2C3E50]" data-testid="view-violations-btn">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.recent_violations?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_violations.slice(0, 3).map((violation) => (
                    <div
                      key={violation.violation_id}
                      className="p-4 bg-[#FDFBF7] rounded-xl border border-[#E2E8F0]"
                      data-testid={`recent-violation-${violation.violation_id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[#1A202C] truncate">{violation.title}</p>
                            <span className={`badge text-xs ${
                              violation.severity === "high" ? "severity-high" :
                              violation.severity === "medium" ? "severity-medium" : "severity-low"
                            }`}>
                              {violation.severity}
                            </span>
                          </div>
                          <p className="text-sm text-[#718096] line-clamp-2 mt-1">{violation.description}</p>
                        </div>
                        <span className="text-xs text-[#718096] whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(violation.date)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state py-8">
                  <AlertTriangle className="w-12 h-12 text-[#718096] opacity-50" />
                  <p className="text-[#718096] mt-4">No violations logged</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
