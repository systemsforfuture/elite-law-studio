import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PracticeAreas from "@/components/PracticeAreas";
import ProcessSection from "@/components/ProcessSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import AboutSection from "@/components/AboutSection";
import TeamSection from "@/components/TeamSection";
import TrustSection from "@/components/TrustSection";
import CtaBanner from "@/components/CtaBanner";
import FaqSection from "@/components/FaqSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <HeroSection />
    <PracticeAreas />
    <ProcessSection />
    <TestimonialsSection />
    <AboutSection />
    <TeamSection />
    <TrustSection />
    <CtaBanner />
    <FaqSection />
    <ContactSection />
    <Footer />
  </div>
);

export default Index;
