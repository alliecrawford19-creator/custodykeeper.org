import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, FileText, Shield, Scale, Send, Users, CheckCircle2, AlertTriangle, Heart } from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: <Send className="w-8 h-8" />,
      title: "Export & Share",
      description: "Download your records and share directly from your device to attorneys, mediators, or save to your computer."
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
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 gradient-hero">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image First - Top on mobile, left on desktop */}
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
            
            {/* Text Content */}
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

      {/* Documentation Makes a Difference Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-['Merriweather'] text-3xl sm:text-4xl font-bold text-[#1A202C] mb-4">
              Documentation Makes a Difference
            </h2>
            <p className="text-lg text-[#718096]">
              Family law attorneys and child custody evaluators consistently emphasize that well-documented parenting time significantly impacts court decisions.
            </p>
          </div>
          
          <div className="text-[#4A5568] space-y-4">
            <p className="text-lg">
              Detailed records of involvement, consistent communication, and active participation in children's lives demonstrate commitment and capability. CustodyKeeper provides the tools to create this comprehensive documentation, supporting your case for meaningful parenting time.
            </p>
            <p className="text-lg">
              Courts recognize that children need both parents actively involved in their lives. When you can demonstrate consistent, engaged parenting through detailed records, you strengthen your position in custody proceedings and help ensure your children benefit from the proven advantages of shared parenting arrangements.
            </p>
          </div>
        </div>
      </section>

      {/* Detailed Feature Sections */}
      
      {/* Parenting Journal Section */}
      <section className="py-20 px-4 bg-[#FDFBF7]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1 bg-[#E8F6F3] text-[#2C3E50] text-sm font-semibold rounded-full mb-4">
                Parenting Journal
              </span>
              <h2 className="font-['Merriweather'] text-3xl sm:text-4xl font-bold text-[#1A202C] mb-4">
                Document Every Moment That Matters
              </h2>
              <p className="text-lg text-[#718096] mb-6">
                Create detailed, timestamped records of your time with your children. From daily activities to special milestones, build a comprehensive journal that demonstrates your involvement and dedication.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2C3E50] mt-1 flex-shrink-0" />
                  <span className="text-[#4A5568]">Record activities, meals, and quality time spent together</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2C3E50] mt-1 flex-shrink-0" />
                  <span className="text-[#4A5568]">Track mood and behavior patterns for court records</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2C3E50] mt-1 flex-shrink-0" />
                  <span className="text-[#4A5568]">Export entries for attorney review or court presentation</span>
                </div>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1544776193-352d25ca82cd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHw1fHxwYXJlbnQlMjB3cml0aW5nJTIwam91cm5hbHxlbnwwfHx8fDE3NzA0MDAwMDB8MA&ixlib=rb-4.1.0&q=85"
                alt="Parent journaling"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Tracking Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative rounded-2xl overflow-hidden shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w0NjAzMjh8MHwxfHNlYXJjaHw0fHxjYWxlbmRhciUyMHBsYW5uZXJ8ZW58MHx8fHwxNzM5NTAzMDAwfDA&ixlib=rb-4.1.0&q=85"
                alt="Calendar and planner"
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-block px-4 py-1 bg-[#E8F6F3] text-[#2C3E50] text-sm font-semibold rounded-full mb-4">
                Scheduling
              </span>
              <h2 className="font-['Merriweather'] text-3xl sm:text-4xl font-bold text-[#1A202C] mb-4">
                Never Miss a Parenting Moment
              </h2>
              <p className="text-lg text-[#718096] mb-6">
                Keep track of your custody schedule, court dates, and important events all in one organized calendar. Never miss a pickup, drop-off, or court appearance again.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2C3E50] mt-1 flex-shrink-0" />
                  <span className="text-[#4A5568]">Track parenting time and court dates in one place</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2C3E50] mt-1 flex-shrink-0" />
                  <span className="text-[#4A5568]">Set reminders for important court appearances</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2C3E50] mt-1 flex-shrink-0" />
                  <span className="text-[#4A5568]">Document schedule compliance for legal proceedings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Violation Logging Section */}
      <section className="py-20 px-4 bg-[#FDFBF7]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1 bg-[#FEE2E2] text-[#D35400] text-sm font-semibold rounded-full mb-4">
                Violation Tracking
              </span>
              <h2 className="font-['Merriweather'] text-3xl sm:text-4xl font-bold text-[#1A202C] mb-4">
                Document Custody Order Violations
              </h2>
              <p className="text-lg text-[#718096] mb-6">
                Record and track violations of your custody agreement with detailed timestamps, severity levels, and evidence notes. Build a comprehensive record for legal proceedings.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#D35400] mt-1 flex-shrink-0" />
                  <span className="text-[#4A5568]">Log parenting time denials and schedule violations</span>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#D35400] mt-1 flex-shrink-0" />
                  <span className="text-[#4A5568]">Track patterns of interference and non-compliance</span>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#D35400] mt-1 flex-shrink-0" />
                  <span className="text-[#4A5568]">Maintain evidence and witness information securely</span>
                </div>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHw2fHxsZWdhbCUyMGRvY3VtZW50cyUyMGdhd mVsfGVufDB8fHx8MTc3MDQwMDAwMHww&ixlib=rb-4.1.0&q=85"
                alt="Legal documentation"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Document Storage Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative rounded-2xl overflow-hidden shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1568667256549-094345857637?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwzfHxmaWxpbmclMjBjYWJpbmV0fGVufDB8fHx8MTc3MDQwMDAwMHww&ixlib=rb-4.1.0&q=85"
                alt="Document filing"
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-block px-4 py-1 bg-[#E8F6F3] text-[#2C3E50] text-sm font-semibold rounded-full mb-4">
                Document Management
              </span>
              <h2 className="font-['Merriweather'] text-3xl sm:text-4xl font-bold text-[#1A202C] mb-4">
                Organize All Your Court Documents
              </h2>
              <p className="text-lg text-[#718096] mb-6">
                Upload, store, and organize court orders, medical records, school reports, and evidence in one secure location. Access your documents anywhere, anytime.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2C3E50] mt-1 flex-shrink-0" />
                  <span className="text-[#4A5568]">Store custody agreements and court orders securely</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2C3E50] mt-1 flex-shrink-0" />
                  <span className="text-[#4A5568]">Upload photos, videos, and evidence for your case</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2C3E50] mt-1 flex-shrink-0" />
                  <span className="text-[#4A5568]">Share documents directly from your device when needed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Management Section */}
      <section className="py-20 px-4 bg-[#FDFBF7]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1 bg-[#E8F6F3] text-[#2C3E50] text-sm font-semibold rounded-full mb-4">
                Contact Management
              </span>
              <h2 className="font-['Merriweather'] text-3xl sm:text-4xl font-bold text-[#1A202C] mb-4">
                Keep Important Contacts Organized
              </h2>
              <p className="text-lg text-[#718096] mb-6">
                Maintain a centralized directory of attorneys, therapists, teachers, doctors, and other key contacts involved in your family court case.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-[#2C3E50] mt-1 flex-shrink-0" />
                  <span className="text-[#4A5568]">Store contact details for attorneys and legal professionals</span>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-[#2C3E50] mt-1 flex-shrink-0" />
                  <span className="text-[#4A5568]">Keep track of witnesses and their information</span>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-[#2C3E50] mt-1 flex-shrink-0" />
                  <span className="text-[#4A5568]">Quick access to therapists, doctors, and educators</span>
                </div>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1521791136064-7986c2920216?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHw0fHxjb250YWN0cyUyMG5ldHdvcmt8ZW58MHx8fHwxNzcwNDAwMDAwfDA&ixlib=rb-4.1.0&q=85"
                alt="Professional contacts"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Support & Advocacy Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative rounded-2xl overflow-hidden shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHw3fHxzdXBwb3J0JTIwZ3JvdXB8ZW58MHx8fHwxNzcwNDAwMDAwfDA&ixlib=rb-4.1.0&q=85"
                alt="Support community"
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-block px-4 py-1 bg-[#E8F6F3] text-[#2C3E50] text-sm font-semibold rounded-full mb-4">
                Support & Advocacy
              </span>
              <h2 className="font-['Merriweather'] text-3xl sm:text-4xl font-bold text-[#1A202C] mb-4">
                Connect With Organizations That Support Parents
              </h2>
              <p className="text-lg text-[#718096] mb-6">
                Access a curated list of advocacy groups, support organizations, and communities dedicated to helping parents navigate family court and shared parenting challenges.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-[#2C3E50] mt-1 flex-shrink-0" />
                  <span className="text-[#4A5568]">Find father's and mother's rights organizations</span>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-[#2C3E50] mt-1 flex-shrink-0" />
                  <span className="text-[#4A5568]">Connect with parental alienation support groups</span>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-[#2C3E50] mt-1 flex-shrink-0" />
                  <span className="text-[#4A5568]">Access advocates fighting for equal shared parenting</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Export & Share Section - Keep this */}
      <section className="py-20 px-4 bg-[#FDFBF7]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="font-['Merriweather'] text-3xl sm:text-4xl font-bold text-[#1A202C] mb-4">
              Export & Share Your Records
            </h2>
            <p className="text-lg text-[#718096] max-w-2xl mx-auto">
              Download your records and share them directly from your device using native sharing.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className={`custom-card interactive animate-fade-in`}
                data-testid={`feature-card-${index}`}
              >
                <div className="w-14 h-14 rounded-xl bg-[#E8F6F3] flex items-center justify-center text-[#2C3E50] mb-4 mx-auto">
                  {feature.icon}
                </div>
                <h3 className="font-['Merriweather'] text-xl font-bold text-[#1A202C] mb-2 text-center">
                  {feature.title}
                </h3>
                <p className="text-[#718096] text-center">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research & Benefits Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-['Merriweather'] text-3xl sm:text-4xl font-bold text-[#1A202C] mb-4">
              Why Both Parents Matter: The Science Behind Shared Parenting
            </h2>
            <p className="text-lg text-[#718096]">
              Decades of research consistently demonstrate the profound benefits of maintaining strong relationships with both parents after separation.
            </p>
          </div>
          
          <div className="prose prose-lg max-w-none text-[#4A5568] space-y-6">
            <p>
              Family courts across the United States increasingly recognize that children thrive when they maintain meaningful relationships with both parents. Extensive research published in peer-reviewed journals demonstrates that shared parenting arrangements lead to better outcomes across virtually every measured dimension of child wellbeing.
            </p>

            <h3 className="font-['Merriweather'] text-2xl font-bold text-[#1A202C] mt-8 mb-4">
              Academic Research on Shared Parenting Benefits
            </h3>
            
            <p>
              A comprehensive meta-analysis published in the Journal of Family Psychology (Fabricius & Suh, 2017) examined over 50 studies involving more than 200,000 children. The findings were clear: children in shared parenting arrangements demonstrated significantly better psychological adjustment, stronger academic performance, and healthier relationships with both parents compared to children in sole custody arrangements.
            </p>

            <p>
              Research from the American Psychological Association indicates that children benefit most when they spend substantial time with each parent—typically at least 35% of the time with each. Studies show these children exhibit fewer behavioral problems, lower rates of depression and anxiety, and stronger self-esteem than children who see one parent infrequently.
            </p>

            <p>
              Dr. Edward Kruk, a professor at the University of British Columbia's School of Social Work, has documented extensively how children in shared parenting arrangements maintain stronger bonds with both parents well into adulthood. His research, published in multiple peer-reviewed journals, demonstrates that equal parenting time reduces parental conflict, increases father involvement, and leads to better co-parenting relationships over time.
            </p>

            <h3 className="font-['Merriweather'] text-2xl font-bold text-[#1A202C] mt-8 mb-4">
              Long-Term Outcomes and Child Development
            </h3>

            <p>
              Longitudinal studies tracking children into adulthood reveal compelling evidence. Research published in Psychology, Public Policy, and Law found that young adults who experienced shared parenting during childhood reported significantly closer relationships with both parents, higher life satisfaction, and better mental health outcomes compared to those raised primarily by one parent.
            </p>

            <p>
              The Swedish National Longitudinal Survey of Children and Young People, which followed thousands of families over decades, found that teenagers in shared custody arrangements reported better relationships with both parents, felt more secure financially, and experienced less stress than their peers in sole custody situations. These effects persisted regardless of socioeconomic status or parental conflict levels.
            </p>

            <p>
              Academic institutions including Stanford University and Arizona State University have published research showing that children in shared parenting arrangements perform better academically, with higher graduation rates and greater college attendance. They also demonstrate stronger social skills, better emotional regulation, and lower rates of substance abuse during adolescence.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
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
    </div>
  );
}
