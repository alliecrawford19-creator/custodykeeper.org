import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Send, Mail } from "lucide-react";
import axios from "axios";
import { API } from "@/App";

export const EmailShareDialog = ({ 
  open, 
  onOpenChange, 
  contentType, 
  contentIds, 
  token,
  defaultSubject 
}) => {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(defaultSubject || `CustodyKeeper ${contentType} Export`);
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      await axios.post(
        `${API}/send-email`,
        {
          recipient_email: email,
          subject: subject,
          content_type: contentType,
          content_ids: contentIds
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Email sent to ${email}`);
      onOpenChange(false);
      setEmail("");
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to send email. Please check email configuration.";
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-['Merriweather'] flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#2C3E50]" />
            Email {contentType === "journals" ? "Journals" : "Violations"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSend} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Recipient Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="attorney@lawfirm.com"
              required
              className="border-[#E2E8F0]"
              data-testid="email-recipient-input"
            />
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="border-[#E2E8F0]"
              data-testid="email-subject-input"
            />
          </div>

          <p className="text-sm text-[#718096]">
            {contentIds.length > 0 
              ? `${contentIds.length} ${contentType === "journals" ? "journal entries" : "violations"} will be included`
              : `All ${contentType === "journals" ? "journal entries" : "violations"} will be included`
            }
          </p>

          <div className="bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-lg p-3">
            <p className="text-sm text-[#92400E]">
              Note: Email service requires configuration. Contact support if emails are not being delivered.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#E2E8F0]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sending}
              className="bg-[#2C3E50] hover:bg-[#34495E] text-white"
              data-testid="send-email-btn"
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sending...
                </span>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" /> Send Email
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
