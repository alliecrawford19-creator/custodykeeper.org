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
import { User, Plus, Trash2, Users, Calendar, Camera, Edit2, X } from "lucide-react";
import { format, parseISO, differenceInYears } from "date-fns";

export default function SettingsPage() {
  const { user, token, setUser } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [profilePhotoDialogOpen, setProfilePhotoDialogOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(user?.photo || "");
  const [formData, setFormData] = useState({
    name: "",
    date_of_birth: "",
    notes: "",
    photo: "",
    color: "#3B82F6"
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

  const handlePhotoUpload = (e, isProfile = false) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Photo size must be less than 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isProfile) {
          setProfilePhoto(reader.result);
        } else {
          setFormData({ ...formData, photo: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePhotoSave = async () => {
    try {
      if (!profilePhoto) {
        toast.error("Please select a photo first");
        return;
      }
      
      const response = await axios.put(`${API}/auth/profile`, 
        { photo: profilePhoto },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      toast.success("Profile photo updated successfully");
      setProfilePhotoDialogOpen(false);
      
      // Update user context with the returned user data
      if (setUser && response.data.user) {
        setUser(response.data.user);
      }
      
      // Force reload to reflect changes immediately
      window.location.reload();
    } catch (error) {
      console.error("Failed to update profile photo:", error);
      toast.error(error.response?.data?.detail || "Failed to update profile photo");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingChild) {
        await axios.put(`${API}/children/${editingChild.child_id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Child updated successfully");
      } else {
        await axios.post(`${API}/children`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Child added successfully");
      }
      setDialogOpen(false);
      resetForm();
      fetchChildren();
    } catch (error) {
      toast.error(editingChild ? "Failed to update child" : "Failed to add child");
    }
  };

  const handleEdit = (child) => {
    setEditingChild(child);
    setFormData({
      name: child.name,
      date_of_birth: child.date_of_birth,
      notes: child.notes || "",
      photo: child.photo || "",
      color: child.color || "#3B82F6"
    });
    setDialogOpen(true);
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
      notes: "",
      photo: "",
      color: "#3B82F6"
    });
    setEditingChild(null);
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
            <div className="flex items-center gap-6 pb-4 border-b border-[#E2E8F0]">
              <div className="relative">
                {user?.photo ? (
                  <img 
                    src={user.photo} 
                    alt={user.full_name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-[#E8F6F3]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#E8F6F3] flex items-center justify-center border-4 border-[#E8F6F3]">
                    <User className="w-10 h-10 text-[#2C3E50]" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#1A202C]">{user?.full_name}</h3>
                <p className="text-sm text-[#718096]">{user?.email}</p>
                <Dialog open={profilePhotoDialogOpen} onOpenChange={setProfilePhotoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setProfilePhoto(user?.photo || "")}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {user?.photo ? "Change Photo" : "Add Photo"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-['Merriweather']">Update Profile Photo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          {profilePhoto ? (
                            <img 
                              src={profilePhoto} 
                              alt="Profile preview"
                              className="w-32 h-32 rounded-full object-cover border-4 border-[#E8F6F3]"
                            />
                          ) : (
                            <div className="w-32 h-32 rounded-full bg-[#E8F6F3] flex items-center justify-center">
                              <User className="w-16 h-16 text-[#718096]" />
                            </div>
                          )}
                          <label htmlFor="profile-photo-upload" className="absolute bottom-0 right-0 w-10 h-10 bg-[#2C3E50] hover:bg-[#34495E] rounded-full flex items-center justify-center cursor-pointer">
                            <Camera className="w-5 h-5 text-white" />
                            <input
                              id="profile-photo-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handlePhotoUpload(e, true)}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-[#718096] text-center">Click camera to upload photo (max 10MB)</p>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setProfilePhotoDialogOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleProfilePhotoSave}
                          className="flex-1 bg-[#2C3E50] hover:bg-[#34495E]"
                        >
                          Save Photo
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
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
                  <DialogTitle className="font-['Merriweather']">
                    {editingChild ? "Edit Child" : "Add Child"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  {/* Photo Upload */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      {formData.photo ? (
                        <img 
                          src={formData.photo} 
                          alt="Child"
                          className="w-24 h-24 rounded-full object-cover border-4 border-[#E8F6F3]"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-[#E8F6F3] flex items-center justify-center">
                          <User className="w-12 h-12 text-[#718096]" />
                        </div>
                      )}
                      <label htmlFor="child-photo-upload" className="absolute bottom-0 right-0 w-8 h-8 bg-[#2C3E50] hover:bg-[#34495E] rounded-full flex items-center justify-center cursor-pointer">
                        <Camera className="w-4 h-4 text-white" />
                        <input
                          id="child-photo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-[#718096]">Click camera to upload photo</p>
                  </div>

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
                      {editingChild ? "Update Child" : "Add Child"}
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
                      {child.photo ? (
                        <img 
                          src={child.photo} 
                          alt={child.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#E8F6F3] flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-[#2C3E50]" />
                        </div>
                      )}
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
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(child)}
                        className="text-[#2C3E50] hover:text-[#34495E] hover:bg-[#E8F6F3]"
                        data-testid={`edit-child-${child.child_id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
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

      </div>
    </Layout>
  );
}
