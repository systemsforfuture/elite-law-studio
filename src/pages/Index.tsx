import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WebsitePreviewSection from "@/components/sections/WebsitePreviewSection";
import WhatYouGetSection from "@/components/sections/WhatYouGetSection";
import TryItYourselfSection from "@/components/sections/TryItYourselfSection";
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
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-accent focus:text-navy-dark focus:shadow-xl focus:font-medium focus:text-sm"
    >
      Zum Hauptinhalt springen
    </a>
    <Navbar />
    <main id="main-content" tabIndex={-1}>
    <HeroSection />
    <TryItYourselfSection />
    <WhatYouGetSection />
    <WebsitePreviewSection />
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
    </main>
    <StickyCta />
    <ExitIntentPopup />
  </div>
);

export default Index;
