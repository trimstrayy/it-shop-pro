import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

function resolveKey(legacyName: string, newName: string): string | undefined {
  const legacy = Deno.env.get(legacyName);
  if (legacy) return legacy;
  const raw = Deno.env.get(newName);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    const value = parsed.default ?? Object.values(parsed)[0];
    return typeof value === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}

async function sendViaSparrowSms(recipient: string, message: string): Promise<void> {
  const token = Deno.env.get("SPARROW_SMS_TOKEN");
  const from = Deno.env.get("SPARROW_SMS_FROM") || "ITGADGET";
  if (!token) throw new Error("SPARROW_SMS_TOKEN is not configured");

  const response = await fetch("https://api.sparrowsms.com/v2/sms/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token, from, to: recipient, text: message }),
  });
  if (!response.ok) throw new Error(`Sparrow SMS returned HTTP ${response.status}`);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = resolveKey("SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEYS");
  const serviceKey = resolveKey("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEYS");
  if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "Server configuration error" }, 500);

  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "Missing Authorization header" }, 401);

  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();
  if (authError || !caller) return json({ error: "Invalid or expired session" }, 401);

  const { data: profile } = await callerClient.from("profiles").select("role, is_active").eq("auth_user_id", caller.id).single();
  const allowedRoles = ["admin", "sales", "accountant"];
  if (!profile?.is_active || !allowedRoles.includes(profile.role)) return json({ error: "Only active staff can send SMS" }, 403);

  const body = await req.json() as { invoiceId?: string; recipient?: string; message?: string };
  if (!body.recipient || !body.message) return json({ error: "recipient and message are required" }, 400);

  const adminClient = createClient(supabaseUrl, serviceKey);
  const invoiceId = body.invoiceId && /^[0-9a-f-]{36}$/i.test(body.invoiceId) ? body.invoiceId : null;
  try {
    await sendViaSparrowSms(body.recipient, body.message);
    await adminClient.from("sms_logs").insert({ invoice_id: invoiceId, recipient: body.recipient, message: body.message, provider: "sparrow-sms", status: "sent", sent_by: caller.id });
    return json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMS delivery failed";
    await adminClient.from("sms_logs").insert({ invoice_id: invoiceId, recipient: body.recipient, message: body.message, provider: "sparrow-sms", status: "failed", error_message: message, sent_by: caller.id });
    return json({ error: message }, 502);
  }
});