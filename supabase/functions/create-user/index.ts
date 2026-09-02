// supabase/functions/create-user/index.ts
//
// Creates a new login account (Supabase Auth user + matching profiles row).
// This MUST run server-side because it needs the service role key, which
// bypasses RLS and must never be exposed to the browser.
//
// Security model:
// 1. The caller's own JWT (sent automatically by supabase-js) is verified
//    against a REGULAR (publishable-key) client to confirm they are a real,
//    logged-in user.
// 2. We then check THAT caller's own profiles row to confirm role = 'admin'.
//    This check uses the caller's own identity — it is never trusted from
//    the request body, so a non-admin cannot fake this by sending
//    { role: "admin" } in the payload.
// 3. Only after both checks pass do we use the SERVICE ROLE client to
//    actually create the new user.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Supabase now supports two API key formats depending on when the project
// was created:
//   - Legacy: SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY (plain strings)
//   - New:    SUPABASE_PUBLISHABLE_KEYS / SUPABASE_SECRET_KEYS (JSON objects)
// This reads whichever format is actually available on this project so the
// function works regardless of which one was auto-injected.
function resolveKey(
  legacyEnvName: string,
  newEnvName: string,
): string {
  const legacy = Deno.env.get(legacyEnvName);
  if (legacy) return legacy;

  const rawNew = Deno.env.get(newEnvName);
  if (rawNew) {
    try {
      const parsed = JSON.parse(rawNew);
      // The new-format env vars are JSON objects; take the first value
      // (commonly under a "default" key, but fall back to the first value
      // present in case the key name differs).
      const value = parsed.default ?? Object.values(parsed)[0];
      if (typeof value === "string") return value;
    } catch (_err) {
      // fall through to throw below
    }
  }

  throw new Error(
    `Could not resolve API key: neither ${legacyEnvName} nor ${newEnvName} is set/parseable.`,
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // TEMP DIAGNOSTIC — remove once the auth-header issue is confirmed fixed
    console.log("Incoming header keys:", [...req.headers.keys()]);
    console.log("Authorization present:", req.headers.has("Authorization"));

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

    let SUPABASE_ANON_KEY: string;
    let SUPABASE_SERVICE_ROLE_KEY: string;
    try {
      SUPABASE_ANON_KEY = resolveKey(
        "SUPABASE_ANON_KEY",
        "SUPABASE_PUBLISHABLE_KEYS",
      );
      SUPABASE_SERVICE_ROLE_KEY = resolveKey(
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_SECRET_KEYS",
      );
    } catch (keyErr) {
      // Surface this clearly instead of letting it fail deeper with a
      // confusing "no api key" error from a downstream fetch call.
      return json(
        { error: `Server configuration error: ${(keyErr as Error).message}` },
        500,
      );
    }

    // --- Step 1: identify the caller using their own auth token ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
      error: callerErr,
    } = await callerClient.auth.getUser();

    if (callerErr || !caller) {
      return json({ error: "Invalid or expired session" }, 401);
    }

    // --- Step 2: confirm the caller is an admin, using THEIR OWN profile row ---
    const { data: callerProfile, error: profileErr } = await callerClient
      .from("profiles")
      .select("role")
      .eq("auth_user_id", caller.id)
      .single();

    if (profileErr || !callerProfile || callerProfile.role !== "admin") {
      return json({ error: "Only admins can create users" }, 403);
    }

    // --- Step 3: parse and validate the new user's details ---
    const body = await req.json();
    const { email, name, role } = body as {
      email?: string;
      name?: string;
      role?: string;
    };

    if (!email || !name || !role) {
      return json({ error: "email, name, and role are required" }, 400);
    }

    const allowedRoles = [
      "admin",
      "sales",
      "inventory",
      "accountant",
      "technician",
    ];
    if (!allowedRoles.includes(role)) {
      return json(
        { error: `role must be one of: ${allowedRoles.join(", ")}` },
        400,
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // --- Step 4: use the SERVICE ROLE client (bypasses RLS) to actually create the user ---
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate a temporary password the new user will need to change.
    const tempPassword = crypto.randomUUID();

    const { data: created, error: createErr } =
      await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true,
      });

    if (createErr || !created.user) {
      return json(
        { error: createErr?.message ?? "Failed to create auth user" },
        400,
      );
    }

    const { error: insertErr } = await adminClient.from("profiles").insert({
      auth_user_id: created.user.id,
      email: normalizedEmail,
      name,
      role,
      is_active: true,
    });

    if (insertErr) {
      // Roll back the auth user if the profile insert failed, so we don't
      // end up with an orphaned Auth account with no profile.
      await adminClient.auth.admin.deleteUser(created.user.id);
      return json(
        { error: `Failed to create profile: ${insertErr.message}` },
        400,
      );
    }

    return json({
      success: true,
      userId: created.user.id,
      email: normalizedEmail,
      tempPassword,
    });
  } catch (err) {
    return json({ error: (err as Error).message ?? "Unexpected error" }, 500);
  }
});