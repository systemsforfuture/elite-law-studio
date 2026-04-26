import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TenantProvider } from "@/contexts/TenantContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import KanzleiTemplate from "./pages/KanzleiTemplate.tsx";
import NotFound from "./pages/NotFound.tsx";
import DashboardLayout from "./layouts/DashboardLayout.tsx";
import OverviewPage from "./pages/dashboard/OverviewPage.tsx";
import VoicePage from "./pages/dashboard/VoicePage.tsx";
import InboxPage from "./pages/dashboard/InboxPage.tsx";
import MandantenPage from "./pages/dashboard/MandantenPage.tsx";
import AktenPage from "./pages/dashboard/AktenPage.tsx";
import TerminePage from "./pages/dashboard/TerminePage.tsx";
import DokumentePage from "./pages/dashboard/DokumentePage.tsx";
import MahnwesenPage from "./pages/dashboard/MahnwesenPage.tsx";
import AgentenPage from "./pages/dashboard/AgentenPage.tsx";
import ImportPage from "./pages/dashboard/ImportPage.tsx";
import BrandingPage from "./pages/dashboard/BrandingPage.tsx";
import TeamPage from "./pages/dashboard/TeamPage.tsx";
import AbrechnungPage from "./pages/dashboard/AbrechnungPage.tsx";
import AuditPage from "./pages/dashboard/AuditPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TenantProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/template/kanzlei" element={<KanzleiTemplate />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<OverviewPage />} />
                <Route path="voice" element={<VoicePage />} />
                <Route path="inbox" element={<InboxPage />} />
                <Route path="mandanten" element={<MandantenPage />} />
                <Route path="akten" element={<AktenPage />} />
                <Route path="termine" element={<TerminePage />} />
                <Route path="dokumente" element={<DokumentePage />} />
                <Route path="mahnwesen" element={<MahnwesenPage />} />
                <Route path="agenten" element={<AgentenPage />} />
                <Route path="import" element={<ImportPage />} />
                <Route path="branding" element={<BrandingPage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="abrechnung" element={<AbrechnungPage />} />
                <Route path="audit" element={<AuditPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </TenantProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
