import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth, API } from "@/App";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  BookOpen,
  AlertTriangle,
  FileText,
  Users,
  Plus,
  ArrowRight,
  Clock,
  Gavel,
  UserPlus,
  MapPin,
  Edit2
} from "lucide-react";
import { format, parseISO, differenceInDays, differenceInHours } from "date-fns";

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

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

  // Get next court date from upcoming events (family court or child support court)
  const getNextCourtDate = () => {
    if (!stats?.upcoming_events) return null;
    const courtEvent = stats.upcoming_events.find(e => 
      e.event_type === "family_court" || 
      e.event_type === "child_support_court" ||
      e.event_type === "court_date"
    );
    return courtEvent || null;
  };

  const getCountdown = (dateStr) => {
    try {
      const eventDate = parseISO(dateStr);
      const now = new Date();
      const days = differenceInDays(eventDate, now);
      const hours = differenceInHours(eventDate, now) % 24;
      
      if (days < 0) return { days: 0, hours: 0, isPast: true };
      return { days, hours, isPast: false };
    } catch {
      return { days: 0, hours: 0, isPast: true };
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

  const nextCourtDate = getNextCourtDate();

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

        {/* Court Date Countdown */}
        {nextCourtDate && (
          <Card className="bg-[#2C3E50] border-none overflow-hidden" data-testid="court-countdown-card">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center gap-6 p-6">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Gavel className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Next Court Date</p>
                    <h2 className="font-['Merriweather'] text-2xl font-bold text-white mt-1">
                      {nextCourtDate.title}
                    </h2>
                    <p className="text-white/70 mt-1">
                      {formatDate(nextCourtDate.start_date)}
                      {nextCourtDate.location && ` • ${nextCourtDate.location}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-6 bg-white/5">
                  {(() => {
                    const countdown = getCountdown(nextCourtDate.start_date);
                    if (countdown.isPast) {
                      return (
                        <div className="text-center px-6">
                          <p className="text-white/70 text-sm">This event has passed</p>
                        </div>
                      );
                    }
                    return (
                      <>
                        <div className="text-center px-4">
                          <p className="text-4xl font-bold text-white">{countdown.days}</p>
                          <p className="text-white/70 text-sm">Days</p>
                        </div>
                        <div className="text-4xl text-white/30 font-light">:</div>
                        <div className="text-center px-4">
                          <p className="text-4xl font-bold text-white">{countdown.hours}</p>
                          <p className="text-white/70 text-sm">Hours</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link to="/settings" className="block">
            <Card className="bg-white border-[#E2E8F0] card-hover cursor-pointer transition-all hover:shadow-md hover:border-[#2C3E50]/30" data-testid="stat-children">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[#E8F6F3] flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#2C3E50]" />
                </div>
                <p className="text-2xl font-bold text-[#1A202C]">{stats?.counts?.children || 0}</p>
                <p className="text-xs text-[#718096]">Children</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/journal" className="block">
            <Card className="bg-white border-[#E2E8F0] card-hover cursor-pointer transition-all hover:shadow-md hover:border-[#2C3E50]/30" data-testid="stat-journals">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[#E8F6F3] flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[#2C3E50]" />
                </div>
                <p className="text-2xl font-bold text-[#1A202C]">{stats?.counts?.journals || 0}</p>
                <p className="text-xs text-[#718096]">Journal Entries</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/violations" className="block">
            <Card className="bg-white border-[#E2E8F0] card-hover cursor-pointer transition-all hover:shadow-md hover:border-[#D35400]/30" data-testid="stat-violations">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[#FEE2E2] flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#D35400]" />
                </div>
                <p className="text-2xl font-bold text-[#1A202C]">{stats?.counts?.violations || 0}</p>
                <p className="text-xs text-[#718096]">Violations</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/documents" className="block">
            <Card className="bg-white border-[#E2E8F0] card-hover cursor-pointer transition-all hover:shadow-md hover:border-[#2C3E50]/30" data-testid="stat-documents">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[#E8F6F3] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#2C3E50]" />
                </div>
                <p className="text-2xl font-bold text-[#1A202C]">{stats?.counts?.documents || 0}</p>
                <p className="text-xs text-[#718096]">Documents</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/calendar" className="block">
            <Card className="bg-white border-[#E2E8F0] card-hover cursor-pointer transition-all hover:shadow-md hover:border-[#2C3E50]/30" data-testid="stat-events">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[#E8F6F3] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#2C3E50]" />
                </div>
                <p className="text-2xl font-bold text-[#1A202C]">{stats?.counts?.events || 0}</p>
                <p className="text-xs text-[#718096]">Events</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/contacts" className="block">
            <Card className="bg-white border-[#E2E8F0] card-hover cursor-pointer transition-all hover:shadow-md hover:border-[#2C3E50]/30" data-testid="stat-contacts">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[#E8F6F3] flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-[#2C3E50]" />
                </div>
                <p className="text-2xl font-bold text-[#1A202C]">{stats?.counts?.contacts || 0}</p>
                <p className="text-xs text-[#718096]">Contacts</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6">
          {/* Upcoming Events */}
          <Card className="bg-white border-[#E2E8F0]" data-testid="upcoming-events-card">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="font-['Merriweather'] text-lg font-bold text-[#1A202C]">
                Upcoming Events
              </CardTitle>
              <Link to="/calendar">
                <Button variant="ghost" size="sm" className="text-[#2C3E50]" data-testid="view-calendar-btn">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.upcoming_events?.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-4">
                  {stats.upcoming_events.slice(0, 3).map((event) => (
                    <div
                      key={event.event_id}
                      className="flex flex-col gap-3 p-4 bg-[#FDFBF7] rounded-xl border border-[#E2E8F0] cursor-pointer hover:border-[#2C3E50]/30 hover:shadow-md transition-all"
                      onClick={() => {
                        setSelectedEvent(event);
                        setEventDialogOpen(true);
                      }}
                      data-testid={`event-${event.event_id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-[#E8F6F3] flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-6 h-6 text-[#2C3E50]" />
                        </div>
                        <span className={`badge ${
                          event.event_type === "family_court" || event.event_type === "child_support_court" ? "badge-danger" :
                          event.event_type === "visitation" ? "badge-primary" : "badge-warning"
                        }`}>
                          {event.event_type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1A202C] truncate">{event.title}</p>
                        <p className="text-sm text-[#718096] mt-1">
                          {formatDate(event.start_date)}
                        </p>
                        {event.location && (
                          <p className="text-sm text-[#718096] truncate mt-1">{event.location}</p>
                        )}
                      </div>
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
        </div>

        {/* Event Detail Dialog */}
        <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-['Merriweather']">Event Details</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4 mt-4">
                <div>
                  <h3 className="font-semibold text-lg text-[#1A202C]">{selectedEvent.title}</h3>
                  <span className={`badge ${
                    selectedEvent.event_type === "family_court" || selectedEvent.event_type === "child_support_court" 
                      ? "badge-danger" 
                      : selectedEvent.event_type === "visitation" 
                        ? "badge-primary" 
                        : "badge-warning"
                  } mt-2 inline-block`}>
                    {selectedEvent.event_type.replace(/_/g, " ")}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[#718096]">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDate(selectedEvent.start_date)}
                      {selectedEvent.start_date !== selectedEvent.end_date && 
                        ` - ${formatDate(selectedEvent.end_date)}`
                      }
                    </span>
                  </div>
                  
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2 text-[#718096]">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                </div>
                
                {selectedEvent.notes && (
                  <div className="pt-2 border-t border-[#E2E8F0]">
                    <p className="text-sm text-[#718096] whitespace-pre-wrap">{selectedEvent.notes}</p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setEventDialogOpen(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Link to="/calendar" className="flex-1">
                    <Button className="w-full bg-[#2C3E50] hover:bg-[#34495E]">
                      <Edit2 className="w-4 h-4 mr-2" /> Edit in Calendar
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
