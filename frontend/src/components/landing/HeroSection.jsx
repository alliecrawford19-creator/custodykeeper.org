import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="pt-32 pb-24 px-4 gradient-hero">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in order-1 lg:order-1 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?crop=entropy&cs=srgb&fm=jpg&ixid=M3w0NjAzMjh8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBsYXclMjBkb2N1bWVudHMlMjBnYXZlbHxlbnwwfHx8fDE3Mzk1MDAwMDB8MA&ixlib=rb-4.1.0&q=85"
                alt="Legal documents and gavel"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7]/80 to-transparent"></div>
            </div>
          </div>
          
          <div className="animate-fade-in pb-8 order-2 lg:order-2">
            <h1 className="font-['Merriweather'] text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1A202C] leading-tight mb-6">
              Your Family Court<br />
              <span className="text-[#2C3E50]">Documentation Partner</span>
            </h1>
            <p className="text-lg text-[#718096] mb-8 max-w-lg">
              Keep comprehensive records of parenting time, document violations, and organize court materials—all in one secure place designed for family court litigation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pb-6">
              <Link to="/register" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-full px-8 py-6 text-lg font-bold shadow-lg btn-hover" data-testid="hero-get-started-btn">
                  Start Documenting Today
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto border-[#E2E8F0] text-[#2C3E50] rounded-full px-8 py-6 text-lg btn-hover" data-testid="hero-login-btn">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
