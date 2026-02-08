import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, API } from "@/App";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Users, Search, Trash2, Edit2, Phone, Mail, MapPin, X, Camera, User } from "lucide-react";

export default function ContactsPage() {
  const { token } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phones: [{ phone: "", label: "mobile" }],
    email: "",
    notes: "",
    photo: ""
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await axios.get(`${API}/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContacts(response.data);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

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

  const addPhoneField = () => {
    setFormData({
      ...formData,
      phones: [...formData.phones, { phone: "", label: "mobile" }]
    });
  };

  const removePhoneField = (index) => {
    const newPhones = formData.phones.filter((_, i) => i !== index);
    setFormData({ ...formData, phones: newPhones });
  };

  const updatePhoneField = (index, field, value) => {
    const newPhones = [...formData.phones];
    newPhones[index][field] = value;
    setFormData({ ...formData, phones: newPhones });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await axios.put(`${API}/contacts/${editingContact.contact_id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Contact updated successfully");
      } else {
        await axios.post(`${API}/contacts`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Contact added successfully");
      }
      setDialogOpen(false);
      resetForm();
      fetchContacts();
    } catch (error) {
      console.error("Failed to save contact:", error);
      toast.error("Failed to save contact");
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      address: contact.address,
      phones: contact.phones.length > 0 ? contact.phones : [{ phone: "", label: "mobile" }],
      email: contact.email,
      notes: contact.notes,
      photo: contact.photo || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async (contactId) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      try {
        await axios.delete(`${API}/contacts/${contactId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Contact deleted successfully");
        fetchContacts();
      } catch (error) {
        console.error("Failed to delete contact:", error);
        toast.error("Failed to delete contact");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      phones: [{ phone: "", label: "mobile" }],
      email: "",
      notes: "",
      photo: ""
    });
    setEditingContact(null);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="space-y-6 animate-fade-in" data-testid="contacts-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-['Merriweather'] text-2xl sm:text-3xl font-bold text-[#1A202C]">
              Contacts
            </h1>
            <p className="text-[#718096] mt-1">
              Manage important contacts for your family court case
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-full btn-hover" data-testid="add-contact-btn">
                <Plus className="w-4 h-4 mr-2" /> Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-['Merriweather'] text-xl">
                  {editingContact ? "Edit Contact" : "Add New Contact"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* Photo Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    {formData.photo ? (
                      <img 
                        src={formData.photo} 
                        alt="Contact" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-[#E8F6F3]"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-[#E8F6F3] flex items-center justify-center">
                        <User className="w-12 h-12 text-[#718096]" />
                      </div>
                    )}
                    <label htmlFor="photo-upload" className="absolute bottom-0 right-0 w-8 h-8 bg-[#2C3E50] hover:bg-[#34495E] rounded-full flex items-center justify-center cursor-pointer">
                      <Camera className="w-4 h-4 text-white" />
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-[#718096]">Click camera to upload photo (max 10MB)</p>
                </div>

                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="mt-1"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1"
                    rows={2}
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>

                {/* Phone Numbers */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Phone Numbers</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPhoneField}
                      className="text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Phone
                    </Button>
                  </div>
                  {formData.phones.map((phone, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={phone.phone}
                        onChange={(e) => updatePhoneField(index, "phone", e.target.value)}
                        placeholder="(555) 123-4567"
                        className="flex-1"
                      />
                      <select
                        value={phone.label}
                        onChange={(e) => updatePhoneField(index, "label", e.target.value)}
                        className="px-3 py-2 border border-[#E2E8F0] rounded-md"
                      >
                        <option value="mobile">Mobile</option>
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </select>
                      {formData.phones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePhoneField(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-1"
                    rows={3}
                    placeholder="Attorney, therapist, witness, etc."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-[#2C3E50] hover:bg-[#34495E]">
                    {editingContact ? "Update Contact" : "Add Contact"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#718096]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="pl-12 h-12 bg-white border-[#E2E8F0]"
            data-testid="search-contacts"
          />
        </div>

        {/* Contacts Grid */}
        {filteredContacts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact) => (
              <Card
                key={contact.contact_id}
                className="bg-white border-[#E2E8F0] card-hover"
                data-testid={`contact-card-${contact.contact_id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {contact.photo ? (
                      <img 
                        src={contact.photo} 
                        alt={contact.name}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#E8F6F3] flex items-center justify-center flex-shrink-0">
                        <User className="w-8 h-8 text-[#2C3E50]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#1A202C] truncate">{contact.name}</h3>
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm text-[#718096] mt-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phones && contact.phones.length > 0 && contact.phones[0].phone && (
                        <div className="flex items-center gap-2 text-sm text-[#718096] mt-1">
                          <Phone className="w-3 h-3" />
                          <span>{contact.phones[0].phone}</span>
                          <span className="text-xs text-[#A0AEC0]">({contact.phones[0].label})</span>
                        </div>
                      )}
                      {contact.address && (
                        <div className="flex items-center gap-2 text-sm text-[#718096] mt-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{contact.address}</span>
                        </div>
                      )}
                      {contact.notes && (
                        <p className="text-xs text-[#A0AEC0] mt-2 line-clamp-2">{contact.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-[#E2E8F0]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(contact)}
                      className="flex-1"
                      data-testid={`edit-contact-${contact.contact_id}`}
                    >
                      <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(contact.contact_id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      data-testid={`delete-contact-${contact.contact_id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white border-[#E2E8F0]">
            <CardContent className="py-16">
              <div className="empty-state">
                <Users className="w-16 h-16 text-[#718096] opacity-50" />
                <h3 className="font-['Merriweather'] text-xl font-bold text-[#1A202C] mt-4">
                  No contacts yet
                </h3>
                <p className="text-[#718096] mt-2">
                  Add attorneys, therapists, witnesses, and other important contacts
                </p>
                <Button
                  onClick={() => setDialogOpen(true)}
                  className="mt-4 bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-full"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Your First Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
