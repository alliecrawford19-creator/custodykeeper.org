import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Scale, 
  BookOpen, 
  AlertTriangle, 
  FileText, 
  Calendar,
  Clock,
  MapPin,
  Shield,
  Download
} from "lucide-react";
import { format, parseISO } from "date-fns";

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function SharedViewPage() {
  const { shareToken } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('journals');

  useEffect(() => {
    fetchSharedData();
  }, [shareToken]);

  const fetchSharedData = async () => {
    try {
      const response = await axios.get(`${API}/shared/${shareToken}`);
      setData(response.data);
      // Set initial tab based on what's included
      if (response.data.journals?.length > 0) setActiveTab('journals');
      else if (response.data.violations?.length > 0) setActiveTab('violations');
      else if (response.data.documents?.length > 0) setActiveTab('documents');
      else if (response.data.events?.length > 0) setActiveTab('events');
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load shared data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2C3E50]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 bg-white">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="font-['Merriweather'] text-xl font-bold text-[#1A202C] mb-2">
              Access Denied
            </h2>
            <p className="text-[#718096]">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'journals', label: 'Journals', icon: BookOpen, data: data?.journals },
    { id: 'violations', label: 'Violations', icon: AlertTriangle, data: data?.violations },
    { id: 'documents', label: 'Documents', icon: FileText, data: data?.documents },
    { id: 'events', label: 'Events', icon: Calendar, data: data?.events },
  ].filter(tab => tab.data?.length > 0);

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] py-4">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-8 h-8 text-[#2C3E50]" />
            <span className="font-['Merriweather'] font-bold text-xl text-[#2C3E50]">
              CustodyKeeper
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#718096]">
            <Shield className="w-4 h-4" />
            <span>Read-Only View</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <Card className="bg-[#E8F6F3] border-none mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-[#718096]">Shared by</p>
                <p className="font-semibold text-[#1A202C]">{data.shared_by}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#718096]">
                <Clock className="w-4 h-4" />
                <span>Expires: {format(parseISO(data.expires_at), "MMM d, yyyy")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? "bg-[#2C3E50] text-white" : ""}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label} ({tab.data.length})
              </Button>
            );
          })}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'journals' && data.journals?.map(journal => (
            <Card key={journal.journal_id} className="bg-white border-[#E2E8F0]">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-[#1A202C]">{journal.title}</h3>
                  <span className="text-sm text-[#718096]">
                    {format(parseISO(journal.date), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="text-[#4A5568] whitespace-pre-wrap">{journal.content}</p>
                {journal.photos?.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {journal.photos.map((photo, i) => (
                      <img 
                        key={i} 
                        src={photo} 
                        alt={`Evidence ${i+1}`}
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <span className="badge badge-primary">{journal.mood}</span>
                  {journal.location && (
                    <span className="text-sm text-[#718096] flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {journal.location}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {activeTab === 'violations' && data.violations?.map(violation => (
            <Card key={violation.violation_id} className="bg-white border-[#E2E8F0]">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-[#1A202C]">
                    {violation.type || violation.title}
                  </h3>
                  <span className={`badge ${
                    violation.severity === 'high' ? 'badge-danger' :
                    violation.severity === 'medium' ? 'badge-warning' : 'badge-primary'
                  }`}>
                    {violation.severity} severity
                  </span>
                </div>
                <p className="text-sm text-[#718096] mb-2">
                  {format(parseISO(violation.date), "MMMM d, yyyy")}
                </p>
                <p className="text-[#4A5568] whitespace-pre-wrap">{violation.description}</p>
                {violation.witnesses && (
                  <p className="text-sm text-[#718096] mt-3">
                    <strong>Witnesses:</strong> {violation.witnesses}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}

          {activeTab === 'documents' && data.documents?.map(doc => (
            <Card key={doc.document_id} className="bg-white border-[#E2E8F0]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-[#2C3E50]" />
                    <div>
                      <p className="font-semibold text-[#1A202C]">{doc.file_name}</p>
                      <p className="text-sm text-[#718096]">{doc.description}</p>
                    </div>
                  </div>
                  <Button variant="outline" asChild size="sm">
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-1" /> View
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {activeTab === 'events' && data.events?.map(event => (
            <Card key={event.event_id} className="bg-white border-[#E2E8F0]">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-[#1A202C]">{event.title}</h3>
                  <span className="badge badge-primary">
                    {event.event_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-sm text-[#718096] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(parseISO(event.start_date), "MMM d, yyyy")}
                  {event.start_date !== event.end_date && 
                    ` - ${format(parseISO(event.end_date), "MMM d, yyyy")}`
                  }
                </p>
                {event.location && (
                  <p className="text-sm text-[#718096] flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {event.location}
                  </p>
                )}
                {event.notes && (
                  <p className="text-[#4A5568] mt-2">{event.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-4 mt-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-[#718096]">
          <p>This is a read-only shared view from CustodyKeeper</p>
        </div>
      </footer>
    </div>
  );
}
