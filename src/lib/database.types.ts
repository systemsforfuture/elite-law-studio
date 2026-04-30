// Datenbank-Typen für die SYSTEMS™ Plattform (Stub bis `supabase gen types` läuft).
//
// Hinweis: Wir typen Tabellen bewusst lose (Row/Insert/Update als flexible Records),
// damit Query-Code, der auf JSONB-Felder wie agent_config / provider_config / branding_config
// zugreift, ohne ständige TS2339-Fehler kompiliert. Sobald die echten Typen generiert
// werden, ersetzt das die Stubs.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type AnyRecord = Record<string, unknown>;

interface FlexTable {
  Row: AnyRecord;
  Insert: AnyRecord;
  Update: AnyRecord;
}

export interface Database {
  public: {
    Tables: {
      tenants: FlexTable;
      users: FlexTable;
      mandanten: FlexTable;
      audit_log: FlexTable;
      dokumente: FlexTable;
      akten: FlexTable;
      termine: FlexTable;
      rechnungen: FlexTable;
      konversationen: FlexTable;
      activities: FlexTable;
    };
    Views: Record<string, never>;
    Functions: {
      current_tenant_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      invite_user: {
        Args: { p_email: string; p_name: string; p_role: string };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
  };
}
