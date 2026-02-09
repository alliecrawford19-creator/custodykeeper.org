import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Scale,
  LayoutDashboard,
  Calendar,
  BookOpen,
  AlertTriangle,
  FileText,
  Gavel,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  UserPlus,
  MessageSquare,
  Moon,
  Sun,
  Clock,
  Share2
} from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/calendar", label: "Calendar", icon: Calendar },
  { path: "/journal", label: "Journal", icon: BookOpen },
  { path: "/violations", label: "Violations", icon: AlertTriangle },
  { path: "/documents", label: "Documents", icon: FileText },
  { path: "/contacts", label: "Contacts", icon: UserPlus },
  { path: "/timeline", label: "Timeline", icon: Clock },
  { path: "/sharing", label: "Sharing", icon: Share2 },
  { path: "/state-laws", label: "Support & Advocacy", icon: Gavel },
];

export const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  
  // Local theme state with localStorage persistence
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("custodykeeper-theme") || "light";
    }
    return "light";
  });

  useEffect(() => {
    localStorage.setItem("custodykeeper-theme", theme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2">
              <Scale className="w-8 h-8 text-primary" />
              <span className="font-['Merriweather'] font-bold text-xl text-foreground hidden sm:block">
                CustodyKeeper
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-secondary text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground"
                data-testid="theme-toggle"
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-2 text-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 transition-colors"
                  data-testid="user-menu-trigger"
                >
                  {user?.photo ? (
                    <img 
                      src={user.photo} 
                      alt={user.full_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium">{user?.full_name}</span>
                  <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white text-[#1A202C]">
                  <div className="px-2 py-2">
                    <p className="text-sm font-medium text-[#1A202C]">{user?.full_name}</p>
                    <p className="text-xs text-[#718096]">{user?.email}</p>
                    <p className="text-xs text-[#718096] mt-1">{user?.state}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2 cursor-pointer text-[#1A202C]" data-testid="menu-settings">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setContactDialogOpen(true)}
                    className="flex items-center gap-2 cursor-pointer text-[#1A202C]"
                    data-testid="menu-contact"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Contact Us
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 cursor-pointer text-destructive"
                    data-testid="menu-logout"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
                data-testid="mobile-menu-toggle"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card animate-fade-in">
            <div className="px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-secondary text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Contact Us Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Merriweather'] text-xl">Contact Us</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
              <MessageSquare className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Feedback & Suggestions</p>
                <a 
                  href="mailto:custodykeeper.feedback@gmail.com"
                  className="text-sm text-primary hover:underline"
                >
                  custodykeeper.feedback@gmail.com
                </a>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">This email is for feedback purposes only</p>
              <p>
                We value your input! Share your feedback, suggestions, and ideas to help us improve CustodyKeeper. 
                Your opinions guide our future updates and changes.
              </p>
            </div>

            <Button
              onClick={() => setContactDialogOpen(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
