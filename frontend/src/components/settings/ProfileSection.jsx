import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User, Camera } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import axios from "axios";

export function ProfileSection({ user, token, API, setUser }) {
  const [profilePhotoDialogOpen, setProfilePhotoDialogOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(user?.photo || "");

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Photo size must be less than 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
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
      
      if (setUser && response.data.user) {
        setUser(response.data.user);
      }
      
      window.location.reload();
    } catch (error) {
      console.error("Failed to update profile photo:", error);
      toast.error(error.response?.data?.detail || "Failed to update profile photo");
    }
  };

  return (
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
                          onChange={handlePhotoUpload}
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
  );
}
