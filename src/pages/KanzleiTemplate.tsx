import Navbar from "@/components/kanzlei-template/Navbar";
import Hero from "@/components/kanzlei-template/Hero";
import PainPoints from "@/components/kanzlei-template/PainPoints";
import PracticeAreas from "@/components/kanzlei-template/PracticeAreas";
import CaseResults from "@/components/kanzlei-template/CaseResults";
import Process from "@/components/kanzlei-template/Process";
import Comparison from "@/components/kanzlei-template/Comparison";
import Testimonials from "@/components/kanzlei-template/Testimonials";
import About from "@/components/kanzlei-template/About";
import Team from "@/components/kanzlei-template/Team";
import Trust from "@/components/kanzlei-template/Trust";
import CtaBanner from "@/components/kanzlei-template/CtaBanner";
import Faq from "@/components/kanzlei-template/Faq";
import Contact from "@/components/kanzlei-template/Contact";
import Footer from "@/components/kanzlei-template/Footer";
import StickyCta from "@/components/kanzlei-template/StickyCta";
import ExitIntent from "@/components/kanzlei-template/ExitIntent";
import SystemsBadge from "@/components/kanzlei-template/SystemsBadge";

const KanzleiTemplate = () => (
  <div className="min-h-screen">
    <Navbar />
    <Hero />
    <PainPoints />
    <PracticeAreas />
    <CaseResults />
    <Process />
    <Comparison />
    <Testimonials />
    <About />
    <Team />
    <Trust />
    <CtaBanner />
    <Faq />
    <Contact />
    <Footer />
    <StickyCta />
    <ExitIntent />
    <SystemsBadge />
  </div>
);

export default KanzleiTemplate;
