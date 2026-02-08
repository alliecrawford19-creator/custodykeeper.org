import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, FileText, Shield, Scale, Send } from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Parenting Journal",
      description: "Document every moment spent with your children. Create detailed records that stand up in court."
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Schedule Tracking",
      description: "Keep track of parenting time and important court dates in one organized calendar."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Violation Logging",
      description: "Record custody agreement violations with timestamps and evidence for legal proceedings."
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Document Storage",
      description: "Upload and organize court orders, evidence, and important documents securely."
    },
    {
      icon: <Scale className="w-8 h-8" />,
      title: "State Law Reference",
      description: "Quick access to your state's family court resources and legal guidelines."
    },
    {
      icon: <Send className="w-8 h-8" />,
      title: "Export & Share",
      description: "Download or email your records to attorneys, mediators, or the court."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Navigation */}
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
              <Link to="/register">
                <Button className="bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-full px-6" data-testid="nav-register-btn">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 gradient-hero">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in pb-8">
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
                    Start Documenting Free
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto border-[#E2E8F0] text-[#2C3E50] rounded-full px-8 py-6 text-lg btn-hover" data-testid="hero-login-btn">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
            <div className="animate-fade-in stagger-2 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1653130892002-02af4f13ba09?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwyfHxjYWxtJTIwcGFyZW50JTIwb3JnYW5pemluZyUyMGRvY3VtZW50c3xlbnwwfHx8fDE3NzAzOTcyMjd8MA&ixlib=rb-4.1.0&q=85"
                  alt="Organized documents and typewriter symbolizing co-parenting records"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7]/80 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="font-['Merriweather'] text-3xl sm:text-4xl font-bold text-[#1A202C] mb-4">
              Everything You Need for Family Court
            </h2>
            <p className="text-lg text-[#718096] max-w-2xl mx-auto">
              Purpose-built tools to help you document, organize, and present your case with confidence.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className={`custom-card interactive animate-fade-in stagger-${index + 1}`}
                data-testid={`feature-card-${index}`}
              >
                <div className="w-14 h-14 rounded-xl bg-[#E8F6F3] flex items-center justify-center text-[#2C3E50] mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-['Merriweather'] text-xl font-bold text-[#1A202C] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[#718096]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journal Feature Highlight */}
      <section className="py-20 px-4 bg-[#FDFBF7]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 animate-fade-in">
              <img 
                src="https://images.unsplash.com/photo-1633442495686-e8b67cffab53?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzV8MHwxfHNlYXJjaHw0fHx3cml0aW5nJTIwaW4lMjBqb3VybmFsJTIwZGlhcnl8ZW58MHx8fHwxNzcwMzk3MjMyfDA&ixlib=rb-4.1.0&q=85"
                alt="Person writing in a notebook"
                className="rounded-2xl shadow-xl w-full"
              />
            </div>
            <div className="order-1 lg:order-2 animate-fade-in stagger-2">
              <span className="badge badge-primary mb-4">Journaling</span>
              <h2 className="font-['Merriweather'] text-3xl sm:text-4xl font-bold text-[#1A202C] mb-6">
                Document Every Moment That Matters
              </h2>
              <p className="text-lg text-[#718096] mb-6">
                Create detailed entries about your time with your children. Include dates, activities, moods, and observations. Build a comprehensive record that demonstrates your involvement and commitment.
              </p>
              <ul className="space-y-3 text-[#718096]">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E8F6F3] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#2C3E50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Timestamped entries for legal validity
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E8F6F3] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#2C3E50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Track children involved and activities
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E8F6F3] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#2C3E50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Export complete journals for attorneys
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Calendar Feature Highlight */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <span className="badge badge-primary mb-4">Scheduling</span>
              <h2 className="font-['Merriweather'] text-3xl sm:text-4xl font-bold text-[#1A202C] mb-6">
                Never Miss a Parenting Moment
              </h2>
              <p className="text-lg text-[#718096] mb-6">
                Keep track of your custody schedule, court dates, and important events. Our calendar helps you stay organized and ensures you're always prepared for what's ahead.
              </p>
              <ul className="space-y-3 text-[#718096]">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E8F6F3] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#2C3E50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Track parenting time and court dates
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E8F6F3] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#2C3E50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Set reminders for court appearances
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E8F6F3] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#2C3E50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Document schedule compliance
                </li>
              </ul>
            </div>
            <div className="animate-fade-in stagger-2">
              <img 
                src="https://images.unsplash.com/photo-1610888662651-05dbdec7cfae?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBjYWxlbmRhciUyMHNjaGVkdWxlfGVufDB8fHx8MTc3MDM5NzIzOHww&ixlib=rb-4.1.0&q=85"
                alt="Wall calendar"
                className="rounded-2xl shadow-xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-[#E8F6F3]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="font-['Merriweather'] text-3xl sm:text-4xl font-bold text-[#1A202C] mb-4">
              Trusted by Parents Like You
            </h2>
            <p className="text-lg text-[#718096]">
              See how CustodyKeeper has helped families navigate difficult times.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="custom-card animate-fade-in" data-testid="testimonial-1">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1770058428154-9eee8a6a1fbb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODd8MHwxfHNlYXJjaHwyfHxmcmllbmRseSUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0fGVufDB8fHx8MTc3MDM5NzI0NHww&ixlib=rb-4.1.0&q=85"
                  alt="Testimonial avatar"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-[#1A202C]">Sarah M.</p>
                  <p className="text-sm text-[#718096]">California</p>
                </div>
              </div>
              <p className="text-[#718096] italic">
                "The journal feature helped me document everything my attorney needed. Having organized records made such a difference in my custody case."
              </p>
            </div>
            <div className="custom-card animate-fade-in stagger-2" data-testid="testimonial-2">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1770363758469-386b78e979e2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODd8MHwxfHNlYXJjaHwzfHxmcmllbmRseSUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0fGVufDB8fHx8MTc3MDM5NzI0NHww&ixlib=rb-4.1.0&q=85"
                  alt="Testimonial avatar"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-[#1A202C]">Jennifer L.</p>
                  <p className="text-sm text-[#718096]">Texas</p>
                </div>
              </div>
              <p className="text-[#718096] italic">
                "Being able to log violations and export them directly to my lawyer saved so much time. This app understands what parents going through custody disputes actually need."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-[#2C3E50]">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h2 className="font-['Merriweather'] text-3xl sm:text-4xl font-bold text-white mb-6">
            Start Protecting Your Parental Rights Today
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Join thousands of parents who trust CustodyKeeper to document, organize, and prepare for family court.
          </p>
          <Link to="/register">
            <Button className="bg-white text-[#2C3E50] hover:bg-[#E8F6F3] rounded-full px-10 py-6 text-lg font-bold shadow-lg btn-hover" data-testid="cta-get-started-btn">
              Create Your Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-[#1A202C]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-center items-center gap-6">
            <div className="flex items-center gap-2">
              <Scale className="w-6 h-6 text-white" />
              <span className="font-['Merriweather'] font-bold text-lg text-white">CustodyKeeper</span>
            </div>
            <p className="text-[#718096] text-sm">
              © {new Date().getFullYear()} CustodyKeeper. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
