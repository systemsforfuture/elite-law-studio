// CORS-Header für alle Edge Functions.
// Der Lead-Capture-Endpoint ist von Marketing-Sites erreichbar; die anderen
// werden nur aus der eigenen App aufgerufen, deshalb origin=eigene Domain.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const handleCors = (req: Request): Response | null => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
};
