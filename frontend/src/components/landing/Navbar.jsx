import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scale } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <Scale className="w-8 h-8 text-[#2C3E50]" />
            <span className="font-['Merriweather'] font-bold text-xl text-[#2C3E50]">CustodyKeeper</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-[#2C3E50] hover:bg-[#E8F6F3]" data-testid="nav-login-btn">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
