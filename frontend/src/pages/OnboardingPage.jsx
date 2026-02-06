import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Scale, User, FileText, Check, Plus, Trash2, Upload, ChevronRight, ChevronLeft } from "lucide-react";
import { format } from "date-fns";

// Predefined colors for children
const CHILD_COLORS = [
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Green" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EF4444", label: "Red" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#F97316", label: "Orange" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [step, setStep] = useState(1);
  const [children, setChildren] = useState([]);
  const [childForm, setChildForm] = useState({
    name: "",
    date_of_birth: "",
    notes: "",
    color: CHILD_COLORS[0].value
  });
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);

  // Check if user has already completed onboarding
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await axios.get(`${API}/children`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.length > 0) {
        // User has already added children, they can skip onboarding
        // But we still show the page for new users
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    }
  };

  const handleAddChild = async () => {
    if (!childForm.name || !childForm.date_of_birth) {
      toast.error("Please enter child's name and date of birth");
      return;
    }

    try {
      const response = await axios.post(`${API}/children`, {
        name: childForm.name,
        date_of_birth: childForm.date_of_birth,
        notes: childForm.notes,
        color: childForm.color
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setChildren([...children, response.data]);
      setChildForm({
        name: "",
        date_of_birth: "",
        notes: "",
        color: CHILD_COLORS[children.length % CHILD_COLORS.length].value
      });
      toast.success(`${childForm.name} added successfully`);
    } catch (error) {
      toast.error("Failed to add child");
    }
  };

  const handleRemoveChild = async (childId) => {
    try {
      await axios.delete(`${API}/children/${childId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChildren(children.filter(c => c.child_id !== childId));
      toast.success("Child removed");
    } catch (error) {
      toast.error("Failed to remove child");
    }
  };

  const handleFileUpload = async (e, childId = null) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "custody_agreement");
    formData.append("description", childId ? `Custody agreement for child ID: ${childId}` : "Custody agreement");

    try {
      const response = await axios.post(`${API}/documents`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      setDocuments([...documents, { ...response.data, childId }]);
      toast.success("Custody agreement uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = () => {
    toast.success("Setup complete! Welcome to CustodyKeeper");
    navigate("/dashboard");
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Scale className="w-10 h-10 text-[#2C3E50]" />
          <span className="font-['Merriweather'] font-bold text-2xl text-[#2C3E50]">CustodyKeeper</span>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s ? "bg-[#2C3E50] text-white" : "bg-[#E2E8F0] text-[#718096]"
              }`}>
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 ${step > s ? "bg-[#2C3E50]" : "bg-[#E2E8F0]"}`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Add Children */}
        {step === 1 && (
          <Card className="bg-white border-[#E2E8F0] animate-fade-in" data-testid="onboarding-step-1">
            <CardHeader>
              <CardTitle className="font-['Merriweather'] text-xl font-bold text-[#1A202C] text-center">
                Add Your Children
              </CardTitle>
              <p className="text-center text-[#718096]">
                Add each child you share custody of. Each child will have their own color for easy identification on the calendar.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Added Children */}
              {children.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-[#718096]">Children Added:</Label>
                  {children.map((child) => (
                    <div
                      key={child.child_id}
                      className="flex items-center justify-between p-3 bg-[#FDFBF7] rounded-lg border border-[#E2E8F0]"
                      data-testid={`added-child-${child.child_id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: child.color || CHILD_COLORS[0].value }}
                        ></div>
                        <span className="font-medium text-[#1A202C]">{child.name}</span>
                        <span className="text-sm text-[#718096]">
                          DOB: {format(new Date(child.date_of_birth), "MMM d, yyyy")}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveChild(child.child_id)}
                        className="text-red-500 hover:text-red-700"
                        data-testid={`remove-child-${child.child_id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Child Form */}
              <div className="space-y-4 p-4 bg-[#FDFBF7] rounded-lg border border-[#E2E8F0]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Child's Name</Label>
                    <Input
                      value={childForm.name}
                      onChange={(e) => setChildForm({ ...childForm, name: e.target.value })}
                      placeholder="Full name"
                      className="border-[#E2E8F0]"
                      data-testid="child-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={childForm.date_of_birth}
                      onChange={(e) => setChildForm({ ...childForm, date_of_birth: e.target.value })}
                      className="border-[#E2E8F0]"
                      data-testid="child-dob-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color for Calendar</Label>
                  <div className="flex gap-2 flex-wrap">
                    {CHILD_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setChildForm({ ...childForm, color: color.value })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          childForm.color === color.value ? "border-[#1A202C] scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                        data-testid={`color-${color.label.toLowerCase()}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    value={childForm.notes}
                    onChange={(e) => setChildForm({ ...childForm, notes: e.target.value })}
                    placeholder="Any relevant notes about this child"
                    className="border-[#E2E8F0]"
                    data-testid="child-notes-input"
                  />
                </div>
                <Button
                  onClick={handleAddChild}
                  className="w-full bg-[#2C3E50] hover:bg-[#34495E] text-white"
                  data-testid="add-child-btn"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Child
                </Button>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-[#718096]"
                  data-testid="skip-btn"
                >
                  Skip for now
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={children.length === 0}
                  className="bg-[#2C3E50] hover:bg-[#34495E] text-white"
                  data-testid="next-step-btn"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Upload Custody Agreements */}
        {step === 2 && (
          <Card className="bg-white border-[#E2E8F0] animate-fade-in" data-testid="onboarding-step-2">
            <CardHeader>
              <CardTitle className="font-['Merriweather'] text-xl font-bold text-[#1A202C] text-center">
                Upload Custody Agreements
              </CardTitle>
              <p className="text-center text-[#718096]">
                Upload your current custody agreement(s). If you have multiple custody agreements 
                (different co-parents), you can upload each one separately.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Children and their agreements */}
              <div className="space-y-4">
                {children.map((child, index) => (
                  <div key={child.child_id} className="p-4 bg-[#FDFBF7] rounded-lg border border-[#E2E8F0]">
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: child.color || CHILD_COLORS[index % CHILD_COLORS.length].value }}
                      ></div>
                      <span className="font-medium text-[#1A202C]">{child.name}'s Custody Agreement</span>
                    </div>
                    
                    {documents.filter(d => d.childId === child.child_id).length > 0 ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="w-5 h-5" />
                        <span>Agreement uploaded</span>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          id={`file-${child.child_id}`}
                          onChange={(e) => handleFileUpload(e, child.child_id)}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          className="hidden"
                        />
                        <label
                          htmlFor={`file-${child.child_id}`}
                          className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-[#E2E8F0] rounded-lg cursor-pointer hover:border-[#2C3E50]/50 transition-colors"
                        >
                          <Upload className="w-5 h-5 text-[#718096]" />
                          <span className="text-[#718096]">Click to upload custody agreement</span>
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* General upload for additional agreements */}
              <div className="p-4 bg-[#FDFBF7] rounded-lg border border-[#E2E8F0]">
                <p className="font-medium text-[#1A202C] mb-3">Additional Custody Agreement</p>
                <p className="text-sm text-[#718096] mb-3">
                  If you have custody agreements covering multiple children or from different court orders, upload them here.
                </p>
                <input
                  type="file"
                  id="file-general"
                  onChange={(e) => handleFileUpload(e, null)}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                />
                <label
                  htmlFor="file-general"
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-[#E2E8F0] rounded-lg cursor-pointer hover:border-[#2C3E50]/50 transition-colors"
                >
                  <Upload className="w-5 h-5 text-[#718096]" />
                  <span className="text-[#718096]">Upload additional agreement</span>
                </label>
              </div>

              {uploading && (
                <div className="flex items-center justify-center gap-2 text-[#718096]">
                  <div className="spinner w-5 h-5"></div>
                  <span>Uploading...</span>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="text-[#718096]"
                  data-testid="prev-step-btn"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="bg-[#2C3E50] hover:bg-[#34495E] text-white"
                  data-testid="next-step-btn"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <Card className="bg-white border-[#E2E8F0] animate-fade-in" data-testid="onboarding-step-3">
            <CardHeader>
              <CardTitle className="font-['Merriweather'] text-xl font-bold text-[#1A202C] text-center">
                You're All Set!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#E8F6F3] flex items-center justify-center">
                  <Check className="w-10 h-10 text-[#2C3E50]" />
                </div>
                <p className="text-[#718096] mb-6">
                  Great job! Your account is set up. Here's what you can do next:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-[#FDFBF7] rounded-lg border border-[#E2E8F0]">
                  <p className="font-medium text-[#1A202C]">📅 Add Parenting Time to Calendar</p>
                  <p className="text-sm text-[#718096]">
                    Schedule your parenting time, court dates, and attorney meetings
                  </p>
                </div>
                <div className="p-4 bg-[#FDFBF7] rounded-lg border border-[#E2E8F0]">
                  <p className="font-medium text-[#1A202C]">📝 Start Your Parenting Journal</p>
                  <p className="text-sm text-[#718096]">
                    Document your time with your children for court records
                  </p>
                </div>
                <div className="p-4 bg-[#FDFBF7] rounded-lg border border-[#E2E8F0]">
                  <p className="font-medium text-[#1A202C]">⚠️ Log Any Violations</p>
                  <p className="text-sm text-[#718096]">
                    Keep track of custody agreement violations with dates and evidence
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-[#E8F6F3] rounded-lg">
                <p className="font-medium text-[#2C3E50] mb-2">Your Setup Summary:</p>
                <ul className="text-sm text-[#718096] space-y-1">
                  <li>✓ {children.length} child{children.length !== 1 ? "ren" : ""} added</li>
                  <li>✓ {documents.length} custody agreement{documents.length !== 1 ? "s" : ""} uploaded</li>
                  <li>✓ Account ready for {user?.state} family court</li>
                </ul>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
                  className="text-[#718096]"
                  data-testid="prev-step-btn"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button
                  onClick={handleComplete}
                  className="bg-[#2C3E50] hover:bg-[#34495E] text-white"
                  data-testid="complete-setup-btn"
                >
                  Go to Dashboard <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
