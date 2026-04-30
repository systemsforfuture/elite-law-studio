import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TenantProvider } from "@/contexts/TenantContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { MandantAuthProvider } from "@/contexts/MandantAuthContext";
import { ErrorBoundary } from "@/lib/sentry";

const ErrorFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center px-6">
    <div className="text-center max-w-md">
      <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-4">
        <span className="block w-2 h-2 rounded-full bg-accent" />
      </div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-2">
        Etwas ist schief gelaufen
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Wir haben den Fehler aufgezeichnet und werden ihn beheben. Versuchen
        Sie die Seite neu zu laden.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 rounded-xl bg-accent text-accent-foreground font-semibold hover:bg-gold-dark transition-colors"
      >
        Neu laden
      </button>
    </div>
  </div>
);

// Eager: critical landing routes (first paint matters)
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";

// Lazy: secondary marketing + auth flow
const AuthCallback = lazy(() => import("./pages/AuthCallback.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));
const KanzleiTemplate = lazy(() => import("./pages/KanzleiTemplate.tsx"));
const PortalLogin = lazy(() => import("./pages/portal/PortalLogin.tsx"));
const PortalDashboard = lazy(() => import("./pages/portal/PortalDashboard.tsx"));

// Lazy: legal / compliance pages
const Datenschutz = lazy(() => import("./pages/legal/Datenschutz.tsx"));
const Impressum = lazy(() => import("./pages/legal/Impressum.tsx"));
const AGB = lazy(() => import("./pages/legal/AGB.tsx"));
const AVV = lazy(() => import("./pages/legal/AVV.tsx"));

// Lazy: kanzlei admin shell + 14 modules — heaviest part of app
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout.tsx"));
const OverviewPage = lazy(() => import("./pages/dashboard/OverviewPage.tsx"));
const VoicePage = lazy(() => import("./pages/dashboard/VoicePage.tsx"));
const InboxPage = lazy(() => import("./pages/dashboard/InboxPage.tsx"));
const MandantenPage = lazy(() => import("./pages/dashboard/MandantenPage.tsx"));
const AktenPage = lazy(() => import("./pages/dashboard/AktenPage.tsx"));
const TerminePage = lazy(() => import("./pages/dashboard/TerminePage.tsx"));
const DokumentePage = lazy(() => import("./pages/dashboard/DokumentePage.tsx"));
const MahnwesenPage = lazy(() => import("./pages/dashboard/MahnwesenPage.tsx"));
const AgentenPage = lazy(() => import("./pages/dashboard/AgentenPage.tsx"));
const ImportPage = lazy(() => import("./pages/dashboard/ImportPage.tsx"));
const BrandingPage = lazy(() => import("./pages/dashboard/BrandingPage.tsx"));
const TeamPage = lazy(() => import("./pages/dashboard/TeamPage.tsx"));
const AbrechnungPage = lazy(() => import("./pages/dashboard/AbrechnungPage.tsx"));
const AuditPage = lazy(() => import("./pages/dashboard/AuditPage.tsx"));
const PersonalPage = lazy(() => import("./pages/dashboard/PersonalPage.tsx"));
const IntegrationenPage = lazy(() => import("./pages/dashboard/IntegrationenPage.tsx"));
const SystemStatusPage = lazy(() => import("./pages/dashboard/SystemStatusPage.tsx"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
  </div>
);

const App = () => (
  <ErrorBoundary fallback={<ErrorFallback />}>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <MandantAuthProvider>
          <TenantProvider>
            <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/template/kanzlei" element={<KanzleiTemplate />} />
                <Route path="/portal" element={<PortalLogin />} />
                <Route path="/portal/dashboard" element={<PortalDashboard />} />
                <Route path="/datenschutz" element={<Datenschutz />} />
                <Route path="/impressum" element={<Impressum />} />
                <Route path="/agb" element={<AGB />} />
                <Route path="/avv" element={<AVV />} />
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
                  <Route path="personal" element={<PersonalPage />} />
                  <Route path="integrationen" element={<IntegrationenPage />} />
                  <Route path="system-status" element={<SystemStatusPage />} />
                  <Route path="abrechnung" element={<AbrechnungPage />} />
                  <Route path="audit" element={<AuditPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
            </TooltipProvider>
          </TenantProvider>
        </MandantAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
