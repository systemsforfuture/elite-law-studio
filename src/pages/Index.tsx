import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PainPointsSection from "@/components/PainPointsSection";
import PracticeAreas from "@/components/PracticeAreas";
import CaseResultsSection from "@/components/CaseResultsSection";
import ProcessSection from "@/components/ProcessSection";
import ComparisonSection from "@/components/ComparisonSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import AboutSection from "@/components/AboutSection";
import TeamSection from "@/components/TeamSection";
import AutomationSection from "@/components/AutomationSection";
import TrustSection from "@/components/TrustSection";
import CtaBanner from "@/components/CtaBanner";
import FaqSection from "@/components/FaqSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import StickyCta from "@/components/StickyCta";
import ExitIntentPopup from "@/components/ExitIntentPopup";

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <HeroSection />
    <PainPointsSection />
    <PracticeAreas />
    <CaseResultsSection />
    <ProcessSection />
    <ComparisonSection />
    <TestimonialsSection />
    <AboutSection />
    <TeamSection />
    <AutomationSection />
    <TrustSection />
    <CtaBanner />
    <FaqSection />
    <ContactSection />
    <Footer />
    <StickyCta />
    <ExitIntentPopup />
  </div>
);

export default Index;
