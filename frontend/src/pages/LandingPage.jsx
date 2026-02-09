import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { DocumentationSection } from "@/components/landing/DocumentationSection";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { ResearchSection } from "@/components/landing/ResearchSection";
import { Footer } from "@/components/landing/Footer";

const FEATURES = [
  {
    badge: "Parenting Journal",
    title: "Document Every Moment That Matters",
    description: "Create detailed, timestamped records of your time with your children. From daily activities to special milestones, build a comprehensive journal that demonstrates your involvement and dedication.",
    features: [
      "Record activities, meals, and quality time spent together",
      "Track mood and behavior patterns for court records",
      "Export entries for attorney review or court presentation"
    ],
    iconType: "check",
    imageSrc: "https://images.unsplash.com/photo-1544776193-352d25ca82cd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHw1fHxwYXJlbnQlMjB3cml0aW5nJTIwam91cm5hbHxlbnwwfHx8fDE3NzA0MDAwMDB8MA&ixlib=rb-4.1.0&q=85",
    imageAlt: "Parent journaling",
    reversed: false,
    bgColor: "bg-[#FDFBF7]"
  },
  {
    badge: "Scheduling",
    title: "Never Miss a Parenting Moment",
    description: "Keep track of your custody schedule, court dates, and important events all in one organized calendar. Never miss a pickup, drop-off, or court appearance again.",
    features: [
      "Track parenting time and court dates in one place",
      "Set reminders for important court appearances",
      "Document schedule compliance for legal proceedings"
    ],
    iconType: "check",
    imageSrc: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w0NjAzMjh8MHwxfHNlYXJjaHw0fHxjYWxlbmRhciUyMHBsYW5uZXJ8ZW58MHx8fHwxNzM5NTAzMDAwfDA&ixlib=rb-4.1.0&q=85",
    imageAlt: "Calendar and planner",
    reversed: true,
    bgColor: "bg-white"
  },
  {
    badge: "Violation Tracking",
    badgeColor: "bg-[#FEE2E2] text-[#D35400]",
    title: "Document Custody Order Violations",
    description: "Record and track violations of your custody agreement with detailed timestamps, severity levels, and evidence notes. Build a comprehensive record for legal proceedings.",
    features: [
      "Log parenting time denials and schedule violations",
      "Track patterns of interference and non-compliance",
      "Maintain evidence and witness information securely"
    ],
    iconType: "alert",
    imageSrc: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHw2fHxsZWdhbCUyMGRvY3VtZW50cyUyMGdhd mVsfGVufDB8fHx8MTc3MDQwMDAwMHww&ixlib=rb-4.1.0&q=85",
    imageAlt: "Legal documentation",
    reversed: false,
    bgColor: "bg-[#FDFBF7]"
  },
  {
    badge: "Document Management",
    title: "Organize All Your Court Documents",
    description: "Upload, store, and organize court orders, medical records, school reports, and evidence in one secure location. Access your documents anywhere, anytime.",
    features: [
      "Store custody agreements and court orders securely",
      "Upload photos, videos, and evidence for your case",
      "Share documents directly from your device when needed"
    ],
    iconType: "check",
    imageSrc: "https://images.unsplash.com/photo-1568667256549-094345857637?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwzfHxmaWxpbmclMjBjYWJpbmV0fGVufDB8fHx8MTc3MDQwMDAwMHww&ixlib=rb-4.1.0&q=85",
    imageAlt: "Document filing",
    reversed: true,
    bgColor: "bg-white"
  },
  {
    badge: "Contact Management",
    title: "Keep Important Contacts Organized",
    description: "Maintain a centralized directory of attorneys, therapists, teachers, doctors, and other key contacts involved in your family court case.",
    features: [
      "Store contact details for attorneys and legal professionals",
      "Keep track of witnesses and their information",
      "Quick access to therapists, doctors, and educators"
    ],
    iconType: "users",
    imageSrc: "https://images.unsplash.com/photo-1521791136064-7986c2920216?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHw0fHxjb250YWN0cyUyMG5ldHdvcmt8ZW58MHx8fHwxNzcwNDAwMDAwfDA&ixlib=rb-4.1.0&q=85",
    imageAlt: "Professional contacts",
    reversed: false,
    bgColor: "bg-[#FDFBF7]"
  },
  {
    badge: "Support & Advocacy",
    title: "Connect With Organizations That Support Parents",
    description: "Access a curated list of advocacy groups, support organizations, and communities dedicated to helping parents navigate family court and shared parenting challenges.",
    features: [
      "Find father's and mother's rights organizations",
      "Connect with parental alienation support groups",
      "Access advocates fighting for equal shared parenting"
    ],
    iconType: "heart",
    imageSrc: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHw3fHxzdXBwb3J0JTIwZ3JvdXB8ZW58MHx8fHwxNzcwNDAwMDAwfDA&ixlib=rb-4.1.0&q=85",
    imageAlt: "Support community",
    reversed: true,
    bgColor: "bg-white"
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Navbar />
      <HeroSection />
      <DocumentationSection />
      
      {FEATURES.map((feature, index) => (
        <FeatureSection key={index} {...feature} />
      ))}
      
      <ResearchSection />
      <Footer />
    </div>
  );
}
