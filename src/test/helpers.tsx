import { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TenantProvider } from "@/contexts/TenantContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { MandantAuthProvider } from "@/contexts/MandantAuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";

export const renderWithProviders = (ui: ReactElement, route = "/") => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <MandantAuthProvider>
            <TenantProvider>
              <TooltipProvider>
                <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
              </TooltipProvider>
            </TenantProvider>
          </MandantAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
