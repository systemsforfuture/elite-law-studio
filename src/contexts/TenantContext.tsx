import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { currentTenant } from "@/data/mockData";
import type { Tenant } from "@/data/types";

interface TenantContextValue {
  tenant: Tenant;
  setTenant: (t: Tenant) => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [tenant, setTenant] = useState<Tenant>(currentTenant);
  const value = useMemo(() => ({ tenant, setTenant }), [tenant]);
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
};
