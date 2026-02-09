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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Calendar as CalendarIcon, MapPin, X, Trash2, Edit2, Users, Repeat } from "lucide-react";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, addDays, addWeeks } from "date-fns";

const EVENT_TYPES = [
  { value: "family_court", label: "Family Court", color: "bg-[#FEE2E2] text-[#991B1B]" },
  { value: "child_support_court", label: "Child Support Court", color: "bg-[#FED7AA] text-[#9A3412]" },
  { value: "attorney", label: "Attorney Meeting", color: "bg-[#DBEAFE] text-[#1E40AF]" },
  { value: "visitation", label: "Visitation", color: "bg-[#E8F6F3] text-[#2C3E50]" },
  { value: "medical", label: "Medical Appointment", color: "bg-[#FCE7F3] text-[#9D174D]" },
  { value: "school", label: "School Event", color: "bg-[#FEF3C7] text-[#92400E]" },
  { value: "other", label: "Other", color: "bg-[#F3F4F6] text-[#374151]" },
];

const RECURRENCE_PATTERNS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 Weeks" },
  { value: "monthly", label: "Monthly" },
];

// Color palette for grouped children events
const GROUP_COLORS = [
  "#8B5CF6", "#EC4899", "#F97316", "#14B8A6", "#6366F1",
  "#EF4444", "#22C55E", "#0EA5E9", "#F59E0B", "#A855F7"
];

export default function CalendarPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [recurringEditDialogOpen, setRecurringEditDialogOpen] = useState(false);
  const [pendingEditEvent, setPendingEditEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    start_date: "",
    end_date: "",
    event_type: "visitation",
    children_involved: [],
    notes: "",
    location: "",
    recurring: false,
    recurrence_pattern: "",
    recurrence_end_date: "",
    custom_color: ""
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
      const payload = {
        ...formData,
        children_involved: formData.children_involved
      };
      
      if (editingEvent) {
        await axios.put(`${API}/calendar/${editingEvent.event_id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Event updated successfully");
      } else {
        await axios.post(`${API}/calendar`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Event created successfully");
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(editingEvent ? "Failed to update event" : "Failed to create event");
    }
  };

  const handleEdit = (event) => {
    // Check if this is a recurring event instance
    if (event.isRecurringInstance) {
      // This is an instance of a recurring event - ask user what to edit
      setPendingEditEvent(event);
      setRecurringEditDialogOpen(true);
      setViewDialogOpen(false);
    } else if (event.recurring && event.recurrence_pattern) {
      // This is the original recurring event
      setPendingEditEvent(event);
      setRecurringEditDialogOpen(true);
      setViewDialogOpen(false);
    } else {
      // Regular non-recurring event
      proceedWithEdit(event);
    }
  };

  const proceedWithEdit = (event, editType = 'all') => {
    const originalEvent = event.originalEventId 
      ? events.find(e => e.event_id === event.originalEventId) 
      : event;
    
    if (editType === 'single' && event.isRecurringInstance) {
      // Create a new non-recurring event for this single instance
      setEditingEvent(null); // Will create new event
      setFormData({
        title: originalEvent.title,
        start_date: event.start_date,
        end_date: event.end_date,
        event_type: originalEvent.event_type,
        children_involved: originalEvent.children_involved || [],
        notes: originalEvent.notes || "",
        location: originalEvent.location || "",
        recurring: false,
        recurrence_pattern: "",
        recurrence_end_date: "",
        custom_color: originalEvent.custom_color || ""
      });
    } else {
      // Edit the original/all recurring events
      setEditingEvent(originalEvent);
      setFormData({
        title: originalEvent.title,
        start_date: originalEvent.start_date,
        end_date: originalEvent.end_date,
        event_type: originalEvent.event_type,
        children_involved: originalEvent.children_involved || [],
        notes: originalEvent.notes || "",
        location: originalEvent.location || "",
        recurring: originalEvent.recurring || false,
        recurrence_pattern: originalEvent.recurrence_pattern || "",
        recurrence_end_date: originalEvent.recurrence_end_date || "",
        custom_color: originalEvent.custom_color || ""
      });
    }
    
    setRecurringEditDialogOpen(false);
    setPendingEditEvent(null);
    setDialogOpen(true);
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
      event_type: "visitation",
      children_involved: [],
      notes: "",
      location: "",
      recurring: false,
      recurrence_pattern: "",
      recurrence_end_date: "",
      custom_color: ""
    });
    setEditingEvent(null);
  };

  const openNewEventDialog = (date = null) => {
    resetForm();
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      setFormData(prev => ({ ...prev, start_date: dateStr, end_date: dateStr }));
    }
    setDialogOpen(true);
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setViewDialogOpen(true);
  };

  const toggleChildInvolved = (childId) => {
    setFormData(prev => {
      const isSelected = prev.children_involved.includes(childId);
      return {
        ...prev,
        children_involved: isSelected
          ? prev.children_involved.filter(id => id !== childId)
          : [...prev.children_involved, childId]
      };
    });
  };

  // Get the display color for an event based on children involved
  const getEventDisplayColor = (event) => {
    // If custom color is set (for grouped events), use it
    if (event.custom_color) {
      return event.custom_color;
    }
    
    // If single child is involved, use their color
    if (event.children_involved && event.children_involved.length === 1) {
      const child = children.find(c => c.child_id === event.children_involved[0]);
      if (child?.color) {
        return child.color;
      }
    }
    
    // Default: use event type color
    return null;
  };

  // Generate recurring event instances for a given date
  const getRecurringInstancesForDate = (event, date) => {
    if (!event.recurring || !event.recurrence_pattern) return [];
    
    const eventStart = parseISO(event.start_date);
    const recurrenceEnd = event.recurrence_end_date ? parseISO(event.recurrence_end_date) : addMonths(eventStart, 6);
    
    // Don't show instances before original event or after recurrence end
    if (date < eventStart || date > recurrenceEnd) return [];
    
    // Check if this date falls on a recurrence
    const daysDiff = Math.floor((date - eventStart) / (1000 * 60 * 60 * 24));
    
    let isRecurrenceDay = false;
    switch (event.recurrence_pattern) {
      case 'daily':
        isRecurrenceDay = daysDiff >= 0;
        break;
      case 'weekly':
        isRecurrenceDay = daysDiff >= 0 && daysDiff % 7 === 0;
        break;
      case 'biweekly':
        isRecurrenceDay = daysDiff >= 0 && daysDiff % 14 === 0;
        break;
      case 'monthly':
        isRecurrenceDay = daysDiff >= 0 && date.getDate() === eventStart.getDate();
        break;
      default:
        isRecurrenceDay = false;
    }
    
    if (isRecurrenceDay && !isSameDay(date, eventStart)) {
      return [{
        ...event,
        event_id: `${event.event_id}-${format(date, 'yyyy-MM-dd')}`,
        start_date: format(date, 'yyyy-MM-dd'),
        end_date: format(date, 'yyyy-MM-dd'),
        isRecurringInstance: true,
        originalEventId: event.event_id
      }];
    }
    
    return [];
  };

  const getEventsForDate = (date) => {
    const directEvents = events.filter(event => {
      const eventDate = parseISO(event.start_date);
      return isSameDay(eventDate, date);
    });
    
    // Add recurring event instances
    const recurringInstances = events
      .filter(event => event.recurring && event.recurrence_pattern)
      .flatMap(event => getRecurringInstancesForDate(event, date));
    
    return [...directEvents, ...recurringInstances];
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
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button
                className="bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-full btn-hover"
                onClick={() => openNewEventDialog()}
                data-testid="add-event-btn"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-['Merriweather']">
                  {editingEvent ? "Edit Event" : "Add Calendar Event"}
                </DialogTitle>
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

                {/* Children Selection */}
                {children.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="w-4 h-4" /> Children Involved
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {children.map(child => (
                        <div
                          key={child.child_id}
                          onClick={() => toggleChildInvolved(child.child_id)}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                            formData.children_involved.includes(child.child_id)
                              ? 'border-[#2C3E50] bg-[#E8F6F3]'
                              : 'border-[#E2E8F0] hover:border-[#2C3E50]/50'
                          }`}
                        >
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: child.color || '#3B82F6' }}
                          />
                          <span className="text-sm truncate">{child.name}</span>
                          {formData.children_involved.includes(child.child_id) && (
                            <span className="ml-auto text-[#2C3E50]">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-[#718096]">
                      Select children to associate with this event. Single child events use their color.
                    </p>
                  </div>
                )}

                {/* Custom Color for Group Events */}
                {formData.children_involved.length > 1 && (
                  <div className="space-y-2">
                    <Label>Group Event Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {GROUP_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, custom_color: color })}
                          className={`w-8 h-8 rounded-full transition-all ${
                            formData.custom_color === color 
                              ? 'ring-2 ring-offset-2 ring-[#2C3E50] scale-110' 
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-[#718096]">
                      Choose a unique color for this group event on the calendar.
                    </p>
                  </div>
                )}

                {/* Recurring Event */}
                <div className="space-y-4 p-4 bg-[#FDFBF7] rounded-lg border border-[#E2E8F0]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-[#2C3E50]" />
                      <Label className="font-medium">Recurring Event</Label>
                    </div>
                    <Switch
                      checked={formData.recurring}
                      onCheckedChange={(checked) => setFormData({ 
                        ...formData, 
                        recurring: checked,
                        recurrence_pattern: checked ? 'weekly' : '',
                        recurrence_end_date: ''
                      })}
                      data-testid="recurring-toggle"
                    />
                  </div>
                  
                  {formData.recurring && (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Repeat Pattern</Label>
                        <Select
                          value={formData.recurrence_pattern}
                          onValueChange={(value) => setFormData({ ...formData, recurrence_pattern: value })}
                        >
                          <SelectTrigger className="border-[#E2E8F0]" data-testid="recurrence-pattern-select">
                            <SelectValue placeholder="Select pattern" />
                          </SelectTrigger>
                          <SelectContent>
                            {RECURRENCE_PATTERNS.map(pattern => (
                              <SelectItem key={pattern.value} value={pattern.value}>
                                {pattern.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>End Repeat (optional)</Label>
                        <Input
                          type="date"
                          value={formData.recurrence_end_date}
                          onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                          min={formData.start_date}
                          className="border-[#E2E8F0]"
                          data-testid="recurrence-end-date"
                        />
                        <p className="text-xs text-[#718096]">
                          If not set, events will repeat for 6 months.
                        </p>
                      </div>
                    </div>
                  )}
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
                    onClick={() => { setDialogOpen(false); resetForm(); }}
                    className="border-[#E2E8F0]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#2C3E50] hover:bg-[#34495E] text-white"
                    data-testid="save-event-btn"
                  >
                    {editingEvent ? "Update Event" : "Save Event"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Calendar */}
        <Card className="bg-white border-[#E2E8F0]" data-testid="calendar-card">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="border-[#E2E8F0]"
                data-testid="prev-month-btn"
              >
                ←
              </Button>
              <h2 className="font-['Merriweather'] text-lg sm:text-xl font-bold text-[#1A202C]">
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
          <CardContent className="px-2 sm:px-6">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="text-center text-xs sm:text-sm font-semibold text-[#718096] py-2">
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
                    className={`min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 border-r border-b border-[#E2E8F0] cursor-pointer hover:bg-[#FDFBF7] transition-colors ${
                      !isCurrentMonth ? "bg-[#F9FAFB]" : ""
                    }`}
                    onClick={() => openNewEventDialog(day)}
                    data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                  >
                    <div className={`text-xs sm:text-sm mb-1 ${
                      isToday 
                        ? "w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-[#2C3E50] text-white flex items-center justify-center text-xs" 
                        : isCurrentMonth ? "text-[#1A202C]" : "text-[#9CA3AF]"
                    }`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      {dayEvents.slice(0, window.innerWidth < 640 ? 2 : 3).map(event => {
                        const customColor = getEventDisplayColor(event);
                        return (
                          <div
                            key={event.event_id}
                            className={`text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded truncate cursor-pointer hover:opacity-80 ${!customColor ? getEventTypeColor(event.event_type) : 'text-white'}`}
                            style={customColor ? { backgroundColor: customColor } : {}}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewEvent(event);
                            }}
                          >
                            <span className="hidden sm:inline">{event.title}</span>
                            <span className="sm:hidden">{event.title.substring(0, 3)}</span>
                          </div>
                        );
                      })}
                      {dayEvents.length > (window.innerWidth < 640 ? 2 : 3) && (
                        <div className="text-[10px] sm:text-xs text-[#718096]">+{dayEvents.length - (window.innerWidth < 640 ? 2 : 3)}</div>
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
          <CardContent className="py-4 px-2 sm:px-6">
            <div className="flex flex-wrap gap-2 sm:gap-4 justify-center sm:justify-start">
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
                {events.map(event => {
                  const customColor = getEventDisplayColor(event);
                  const eventChildren = event.children_involved?.map(id => 
                    children.find(c => c.child_id === id)
                  ).filter(Boolean);
                  
                  return (
                    <div
                      key={event.event_id}
                      className="flex items-center justify-between p-4 bg-[#FDFBF7] rounded-xl border border-[#E2E8F0] cursor-pointer hover:border-[#2C3E50]/30 transition-all"
                      onClick={() => handleViewEvent(event)}
                      data-testid={`event-item-${event.event_id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-3 h-12 rounded-full"
                          style={{ backgroundColor: customColor || undefined }}
                          {...(!customColor && { className: `w-3 h-12 rounded-full ${getEventTypeColor(event.event_type).split(" ")[0]}` })}
                        ></div>
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
                          {eventChildren && eventChildren.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              {eventChildren.map(child => (
                                <span 
                                  key={child.child_id}
                                  className="text-xs px-2 py-0.5 rounded-full text-white"
                                  style={{ backgroundColor: child.color || '#3B82F6' }}
                                >
                                  {child.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className={`badge ${getEventTypeColor(event.event_type)}`}>
                          {EVENT_TYPES.find(t => t.value === event.event_type)?.label || event.event_type}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(event)}
                          className="text-[#2C3E50] hover:text-[#34495E] hover:bg-[#E8F6F3]"
                          data-testid={`edit-event-${event.event_id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
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
                  );
                })}
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

        {/* View Event Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-['Merriweather']">Event Details</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4 mt-4">
                <div>
                  <h3 className="font-semibold text-lg text-[#1A202C]">{selectedEvent.title}</h3>
                  <span className={`badge ${getEventTypeColor(selectedEvent.event_type)} mt-2 inline-block`}>
                    {EVENT_TYPES.find(t => t.value === selectedEvent.event_type)?.label || selectedEvent.event_type}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[#718096]">
                    <CalendarIcon className="w-4 h-4" />
                    <span>
                      {format(parseISO(selectedEvent.start_date), "MMMM d, yyyy")}
                      {selectedEvent.start_date !== selectedEvent.end_date && 
                        ` - ${format(parseISO(selectedEvent.end_date), "MMMM d, yyyy")}`
                      }
                    </span>
                  </div>
                  
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2 text-[#718096]">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                  
                  {selectedEvent.children_involved && selectedEvent.children_involved.length > 0 && (
                    <div className="flex items-start gap-2 text-[#718096]">
                      <Users className="w-4 h-4 mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {selectedEvent.children_involved.map(childId => {
                          const child = children.find(c => c.child_id === childId);
                          return child ? (
                            <span 
                              key={childId}
                              className="text-xs px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: child.color || '#3B82F6' }}
                            >
                              {child.name}
                            </span>
                          ) : null;
                        })}
                      </div>
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
                    onClick={() => setViewDialogOpen(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => handleEdit(selectedEvent)}
                    className="flex-1 bg-[#2C3E50] hover:bg-[#34495E]"
                  >
                    <Edit2 className="w-4 h-4 mr-2" /> Edit Event
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Recurring Edit Choice Dialog */}
        <Dialog open={recurringEditDialogOpen} onOpenChange={setRecurringEditDialogOpen}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="font-['Merriweather']">Edit Recurring Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-[#718096]">
                This is a recurring event. Would you like to edit just this occurrence or all occurrences?
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => proceedWithEdit(pendingEditEvent, 'single')}
                  variant="outline"
                  className="w-full justify-start h-auto py-4"
                >
                  <div className="text-left">
                    <p className="font-semibold">This event only</p>
                    <p className="text-sm text-[#718096]">Create a one-time exception for this date</p>
                  </div>
                </Button>
                
                <Button
                  onClick={() => proceedWithEdit(pendingEditEvent, 'all')}
                  variant="outline"
                  className="w-full justify-start h-auto py-4"
                >
                  <div className="text-left">
                    <p className="font-semibold">All events in series</p>
                    <p className="text-sm text-[#718096]">Changes will apply to all occurrences</p>
                  </div>
                </Button>
              </div>
              
              <Button
                variant="ghost"
                onClick={() => {
                  setRecurringEditDialogOpen(false);
                  setPendingEditEvent(null);
                }}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
