import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PainPointsSection from "@/components/PainPointsSection";
import ModulesSection from "@/components/sections/ModulesSection";
import AgentsSection from "@/components/sections/AgentsSection";
import AutomationSection from "@/components/AutomationSection";
import ROICalculator from "@/components/sections/ROICalculator";
import PricingSection from "@/components/sections/PricingSection";
import ComparisonSection from "@/components/ComparisonSection";
import IntegrationsSection from "@/components/sections/IntegrationsSection";
import OnboardingTeaser from "@/components/sections/OnboardingTeaser";
import TestimonialsSection from "@/components/TestimonialsSection";
import AboutSection from "@/components/AboutSection";
import TrustSection from "@/components/TrustSection";
import FaqSection from "@/components/FaqSection";
import SalesCTASection from "@/components/sections/SalesCTASection";
import Footer from "@/components/Footer";
import StickyCta from "@/components/StickyCta";
import ExitIntentPopup from "@/components/ExitIntentPopup";

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <HeroSection />
    <PainPointsSection />
    <ModulesSection />
    <AgentsSection />
    <AutomationSection />
    <ROICalculator />
    <PricingSection />
    <ComparisonSection />
    <IntegrationsSection />
    <OnboardingTeaser />
    <TestimonialsSection />
    <AboutSection />
    <TrustSection />
    <FaqSection />
    <SalesCTASection />
    <Footer />
    <StickyCta />
    <ExitIntentPopup />
  </div>
);

export default Index;
