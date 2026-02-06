import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, API } from "@/App";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Calendar as CalendarIcon, MapPin, X, Trash2 } from "lucide-react";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";

const EVENT_TYPES = [
  { value: "parenting_time", label: "Parenting Time", color: "bg-[#E8F6F3] text-[#2C3E50]" },
  { value: "family_court", label: "Family Court", color: "bg-[#FEE2E2] text-[#991B1B]" },
  { value: "child_support_court", label: "Child Support Court", color: "bg-[#FED7AA] text-[#9A3412]" },
  { value: "attorney", label: "Attorney Meeting", color: "bg-[#DBEAFE] text-[#1E40AF]" },
  { value: "exchange", label: "Child Exchange", color: "bg-[#FEF3C7] text-[#92400E]" },
  { value: "other", label: "Other", color: "bg-[#F3F4F6] text-[#374151]" },
];

export default function CalendarPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    start_date: "",
    end_date: "",
    event_type: "parenting_time",
    children_involved: [],
    notes: "",
    location: "",
    recurring: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, childrenRes] = await Promise.all([
        axios.get(`${API}/calendar`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/children`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setEvents(eventsRes.data);
      setChildren(childrenRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/calendar`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Event created successfully");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Failed to create event");
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await axios.delete(`${API}/calendar/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Event deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      start_date: "",
      end_date: "",
      event_type: "parenting_time",
      children_involved: [],
      notes: "",
      location: "",
      recurring: false
    });
  };

  const openNewEventDialog = (date = null) => {
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      setFormData(prev => ({ ...prev, start_date: dateStr, end_date: dateStr }));
    }
    setDialogOpen(true);
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.start_date);
      return isSameDay(eventDate, date);
    });
  };

  const getEventTypeColor = (type) => {
    return EVENT_TYPES.find(t => t.value === type)?.color || EVENT_TYPES[4].color;
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

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
      <div className="space-y-6 animate-fade-in" data-testid="calendar-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-['Merriweather'] text-2xl sm:text-3xl font-bold text-[#1A202C]">
              Parenting Calendar
            </h1>
            <p className="text-[#718096] mt-1">Track parenting time, court dates, and attorney meetings</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-full btn-hover"
                onClick={() => openNewEventDialog()}
                data-testid="add-event-btn"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-['Merriweather']">Add Calendar Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Event Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Weekend with kids"
                    required
                    className="border-[#E2E8F0]"
                    data-testid="event-title-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                      className="border-[#E2E8F0]"
                      data-testid="event-start-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                      className="border-[#E2E8F0]"
                      data-testid="event-end-date"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                  >
                    <SelectTrigger className="border-[#E2E8F0]" data-testid="event-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Location (optional)</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., My home"
                    className="border-[#E2E8F0]"
                    data-testid="event-location-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional details..."
                    className="border-[#E2E8F0] min-h-[80px]"
                    data-testid="event-notes-input"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="border-[#E2E8F0]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#2C3E50] hover:bg-[#34495E] text-white"
                    data-testid="save-event-btn"
                  >
                    Save Event
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Calendar */}
        <Card className="bg-white border-[#E2E8F0]" data-testid="calendar-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="border-[#E2E8F0]"
                data-testid="prev-month-btn"
              >
                ←
              </Button>
              <h2 className="font-['Merriweather'] text-xl font-bold text-[#1A202C]">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="border-[#E2E8F0]"
                data-testid="next-month-btn"
              >
                →
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
              className="text-[#2C3E50]"
              data-testid="today-btn"
            >
              Today
            </Button>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-[#718096] py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 border-t border-l border-[#E2E8F0]">
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDate(day);
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={idx}
                    className={`min-h-[100px] p-2 border-r border-b border-[#E2E8F0] cursor-pointer hover:bg-[#FDFBF7] transition-colors ${
                      !isCurrentMonth ? "bg-[#F9FAFB]" : ""
                    }`}
                    onClick={() => openNewEventDialog(day)}
                    data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                  >
                    <div className={`text-sm mb-1 ${
                      isToday 
                        ? "w-7 h-7 rounded-full bg-[#2C3E50] text-white flex items-center justify-center" 
                        : isCurrentMonth ? "text-[#1A202C]" : "text-[#9CA3AF]"
                    }`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.event_id}
                          className={`text-xs px-2 py-1 rounded truncate ${getEventTypeColor(event.event_type)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(event);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-[#718096]">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Event Legend */}
        <Card className="bg-white border-[#E2E8F0]">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4">
              {EVENT_TYPES.map(type => (
                <div key={type.value} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${type.color.split(" ")[0]}`}></div>
                  <span className="text-sm text-[#718096]">{type.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events List */}
        <Card className="bg-white border-[#E2E8F0]" data-testid="events-list-card">
          <CardHeader>
            <CardTitle className="font-['Merriweather'] text-lg font-bold text-[#1A202C]">
              All Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map(event => (
                  <div
                    key={event.event_id}
                    className="flex items-center justify-between p-4 bg-[#FDFBF7] rounded-xl border border-[#E2E8F0]"
                    data-testid={`event-item-${event.event_id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-12 rounded-full ${getEventTypeColor(event.event_type).split(" ")[0]}`}></div>
                      <div>
                        <p className="font-semibold text-[#1A202C]">{event.title}</p>
                        <p className="text-sm text-[#718096]">
                          {format(parseISO(event.start_date), "MMM d, yyyy")}
                          {event.start_date !== event.end_date && ` - ${format(parseISO(event.end_date), "MMM d, yyyy")}`}
                        </p>
                        {event.location && (
                          <p className="text-sm text-[#718096] flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" /> {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${getEventTypeColor(event.event_type)}`}>
                        {EVENT_TYPES.find(t => t.value === event.event_type)?.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(event.event_id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        data-testid={`delete-event-${event.event_id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state py-8">
                <CalendarIcon className="w-12 h-12 text-[#718096] opacity-50" />
                <p className="text-[#718096] mt-4">No events scheduled</p>
                <Button
                  onClick={() => openNewEventDialog()}
                  className="mt-4 bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-full"
                  data-testid="empty-add-event-btn"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Your First Event
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
