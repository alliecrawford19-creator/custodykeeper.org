import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, API } from "@/App";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { User, Plus, Trash2, Users, Calendar } from "lucide-react";
import { format, parseISO, differenceInYears } from "date-fns";

export default function SettingsPage() {
  const { user, token } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    date_of_birth: "",
    notes: ""
  });

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const response = await axios.get(`${API}/children`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChildren(response.data);
    } catch (error) {
      console.error("Failed to fetch children:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/children`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Child added successfully");
      setDialogOpen(false);
      resetForm();
      fetchChildren();
    } catch (error) {
      toast.error("Failed to add child");
    }
  };

  const handleDelete = async (childId) => {
    if (!confirm("Are you sure you want to remove this child?")) return;
    try {
      await axios.delete(`${API}/children/${childId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Child removed");
      fetchChildren();
    } catch (error) {
      toast.error("Failed to remove child");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      date_of_birth: "",
      notes: ""
    });
  };

  const calculateAge = (dateOfBirth) => {
    try {
      return differenceInYears(new Date(), parseISO(dateOfBirth));
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
      <div className="space-y-6 animate-fade-in" data-testid="settings-page">
        {/* Header */}
        <div>
          <h1 className="font-['Merriweather'] text-2xl sm:text-3xl font-bold text-[#1A202C]">
            Settings
          </h1>
          <p className="text-[#718096] mt-1">Manage your account and children's information</p>
        </div>

        {/* Profile Section */}
        <Card className="bg-white border-[#E2E8F0]" data-testid="profile-card">
          <CardHeader>
            <CardTitle className="font-['Merriweather'] text-lg font-bold text-[#1A202C] flex items-center gap-2">
              <User className="w-5 h-5" /> Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#718096]">Full Name</Label>
                <p className="font-medium text-[#1A202C]">{user?.full_name}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[#718096]">Email</Label>
                <p className="font-medium text-[#1A202C]">{user?.email}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[#718096]">State</Label>
                <p className="font-medium text-[#1A202C]">{user?.state}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[#718096]">Member Since</Label>
                <p className="font-medium text-[#1A202C]">
                  {user?.created_at ? format(parseISO(user.created_at), "MMMM d, yyyy") : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Children Section */}
        <Card className="bg-white border-[#E2E8F0]" data-testid="children-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-['Merriweather'] text-lg font-bold text-[#1A202C] flex items-center gap-2">
              <Users className="w-5 h-5" /> Your Children
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button
                  className="bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-full btn-hover"
                  data-testid="add-child-btn"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Child
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-['Merriweather']">Add Child</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Child's Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Full name"
                      required
                      className="border-[#E2E8F0]"
                      data-testid="child-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      required
                      className="border-[#E2E8F0]"
                      data-testid="child-dob-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Input
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any relevant notes"
                      className="border-[#E2E8F0]"
                      data-testid="child-notes-input"
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
                      data-testid="save-child-btn"
                    >
                      Add Child
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {children.length > 0 ? (
              <div className="space-y-3">
                {children.map((child) => (
                  <div
                    key={child.child_id}
                    className="flex items-center justify-between p-4 bg-[#FDFBF7] rounded-xl border border-[#E2E8F0]"
                    data-testid={`child-item-${child.child_id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#E8F6F3] flex items-center justify-center">
                        <User className="w-6 h-6 text-[#2C3E50]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1A202C]">{child.name}</p>
                        <p className="text-sm text-[#718096] flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(parseISO(child.date_of_birth), "MMMM d, yyyy")}
                          <span className="text-[#9CA3AF]">
                            ({calculateAge(child.date_of_birth)} years old)
                          </span>
                        </p>
                        {child.notes && (
                          <p className="text-sm text-[#718096] mt-1">{child.notes}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(child.child_id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      data-testid={`delete-child-${child.child_id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state py-8">
                <Users className="w-12 h-12 text-[#718096] opacity-50" />
                <p className="text-[#718096] mt-4">No children added yet</p>
                <p className="text-sm text-[#9CA3AF]">Add your children to track them in journal entries</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Settings Info */}
        <Card className="bg-[#FDFBF7] border-[#E2E8F0]">
          <CardContent className="p-6">
            <h3 className="font-['Merriweather'] font-bold text-[#1A202C] mb-2">
              Email Sharing
            </h3>
            <p className="text-[#718096] text-sm">
              You can email your journal entries and violation logs directly to attorneys, mediators, 
              or other parties. Use the export features on the Journal and Violations pages to share 
              your records. Email service requires configuration - contact support if you need assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
