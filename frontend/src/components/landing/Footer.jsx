import { Scale } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 px-4 bg-[#1A202C]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-white" />
            <span className="font-['Merriweather'] font-bold text-lg text-white">CustodyKeeper</span>
          </div>
          <a 
            href="mailto:custodykeeper.feedback@gmail.com" 
            className="text-[#718096] hover:text-white transition-colors text-sm underline"
          >
            Contact Us
          </a>
          <p className="text-[#718096] text-sm">
            © {new Date().getFullYear()} CustodyKeeper. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
