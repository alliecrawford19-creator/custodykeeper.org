import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { User, Plus, Trash2, Users, Calendar, Camera, Edit2 } from "lucide-react";
import { format, parseISO, differenceInYears } from "date-fns";
import axios from "axios";

const CHILD_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16", 
  "#22C55E", "#10B981", "#14B8A6", "#06B6D4", "#0EA5E9",
  "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#D946EF",
  "#EC4899", "#F43F5E", "#FB7185", "#FDA4AF", "#FCA5A5",
  "#FDBA74", "#FCD34D", "#FDE047", "#BEF264", "#86EFAC",
  "#6EE7B7", "#5EEAD4", "#67E8F9", "#7DD3FC", "#93C5FD",
  "#A5B4FC", "#C4B5FD", "#D8B4FE", "#F0ABFC", "#F9A8D4",
  "#FE2C55", "#FF6B35", "#FFD23F", "#00B4D8", "#90E0EF",
  "#CAF0F8", "#ADE8F4", "#48CAE4", "#00B4D8", "#0077B6",
  "#023E8A", "#03045E", "#7209B7", "#560BAD", "#480CA8"
];

export function ChildrenSection({ children, token, API, fetchChildren }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    date_of_birth: "",
    notes: "",
    photo: "",
    color: "#3B82F6"
  });

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Photo size must be less than 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
      };
      reader.readAsDataURL(file);
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

  return (
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

              <div className="space-y-2">
                <Label>Color Tag (optional)</Label>
                <div className="grid grid-cols-10 gap-2">
                  {CHILD_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        formData.color === color 
                          ? 'ring-2 ring-offset-2 ring-[#2C3E50] scale-110' 
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#718096]">Selected color will appear next to child's name</p>
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
                      style={{ border: `3px solid ${child.color || '#3B82F6'}` }}
                    />
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-full bg-[#E8F6F3] flex items-center justify-center flex-shrink-0"
                      style={{ border: `3px solid ${child.color || '#3B82F6'}` }}
                    >
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
  );
}
