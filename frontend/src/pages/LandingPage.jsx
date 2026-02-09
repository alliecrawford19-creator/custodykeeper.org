import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, FileText, Shield, Scale, Send } from "lucide-react";

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

      {/* Research & Benefits Section */}
      <section className="py-20 px-4 bg-[#FDFBF7]">
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

            <h3 className="font-['Merriweather'] text-2xl font-bold text-[#1A202C] mt-8 mb-4">
              Documentation Makes a Difference
            </h3>

            <p>
              Family law attorneys and child custody evaluators consistently emphasize that well-documented parenting time significantly impacts court decisions. Detailed records of involvement, consistent communication, and active participation in children's lives demonstrate commitment and capability. CustodyKeeper provides the tools to create this comprehensive documentation, supporting your case for meaningful parenting time.
            </p>

            <p>
              Courts recognize that children need both parents actively involved in their lives. When you can demonstrate consistent, engaged parenting through detailed records, you strengthen your position in custody proceedings and help ensure your children benefit from the proven advantages of shared parenting arrangements.
            </p>
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
