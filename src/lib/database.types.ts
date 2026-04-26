// Datenbank-Typen für die SYSTEMS™ Plattform.
//
// In Sprint 2 generieren wir diese Datei automatisch:
//   `supabase gen types typescript --project-id dsgenkjlkdzkoplnxebg > src/lib/database.types.ts`
//
// Bis dahin minimaler Stub — passt zum Schema in supabase/migrations/0001_schema.sql.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          kanzlei_name: string;
          domain: string | null;
          subdomain: string | null;
          branding_config: Json;
          subscription_tier: "foundation" | "growth" | "premium";
          subscription_status: string;
          inhaber_name: string | null;
          notfall_nummer: string | null;
          rechtsgebiete: string[] | null;
          onboarded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tenants"]["Row"]> & {
          kanzlei_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Row"]>;
      };
      users: {
        Row: {
          id: string;
          tenant_id: string;
          email: string;
          name: string;
          role: "owner" | "anwalt" | "mitarbeiter" | "support";
          avatar_initials: string | null;
          rechtsgebiete: string[] | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & {
          id: string;
          tenant_id: string;
          email: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_tenant_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
  };
}
