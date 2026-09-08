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
      .select("role, tenant_id, is_platform_admin")
      .eq("auth_user_id", caller.id)
      .single();

    if (profileErr || !callerProfile || callerProfile.role !== "admin") {
      return json({ error: "Only admins can create users" }, 403);
    }

    // --- Step 3: parse and validate the new user's details ---
    const body = await req.json();
    const {
      email,
      name,
      role,
      business_name,
      business_type,
      owner_name,
      owner_phone,
      owner_email,
      business_address,
      admin_account_email,
      admin_account_name,
      enabled_modules,
    } = body as {
      email?: string;
      name?: string;
      role?: string;
      business_name?: string;
      business_type?: string;
      owner_name?: string;
      owner_phone?: string;
      owner_email?: string;
      business_address?: string;
      admin_account_email?: string;
      admin_account_name?: string;
      enabled_modules?: Record<string, boolean>;
    };

    const hasBusinessFields = [business_name, business_type, owner_name, owner_phone, owner_email,
      business_address, admin_account_email, admin_account_name].some((value) => Boolean(value?.trim()));

    if (callerProfile.is_platform_admin && !hasBusinessFields) {
      return json({ error: "Platform admins must provide business details when creating a client" }, 400);
    }

    if (!callerProfile.is_platform_admin && hasBusinessFields) {
      return json({ error: "Tenant admins can only create staff accounts for their own tenant" }, 400);
    }

    const isClientCreation = Boolean(callerProfile.is_platform_admin && hasBusinessFields);
    const newUserEmail = isClientCreation ? admin_account_email : email;
    const newUserName = isClientCreation ? admin_account_name : name;
    const newUserRole = isClientCreation ? "admin" : role;

    if (!newUserEmail || !newUserName || !newUserRole) {
      return json({ error: "email, name, and role are required" }, 400);
    }

    if (isClientCreation && (![business_name, owner_name, admin_account_email, admin_account_name].every((value) => Boolean(value?.trim())))) {
      return json({ error: "business_name, owner_name, admin_account_email, and admin_account_name are required" }, 400);
    }

    const allowedRoles = [
      "admin",
      "sales",
      "inventory",
      "accountant",
      "technician",
    ];
    if (!allowedRoles.includes(newUserRole)) {
      return json(
        { error: `role must be one of: ${allowedRoles.join(", ")}` },
        400,
      );
    }

    const normalizedEmail = newUserEmail.trim().toLowerCase();

    // --- Step 4: use the SERVICE ROLE client (bypasses RLS) to actually create the user ---
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let tenantId = callerProfile.tenant_id;
    if (isClientCreation) {
      const { data: tenant, error: tenantErr } = await adminClient.from("tenants").insert({
        business_name: business_name!.trim(),
        business_type: business_type?.trim() || null,
        owner_name: owner_name!.trim(),
        owner_phone: owner_phone?.trim() || null,
        owner_email: owner_email?.trim().toLowerCase() || null,
        address: business_address?.trim() || null,
        is_active: true,
        enabled_modules: enabled_modules ?? {
          repair_lab: true,
          deliveries: true,
          quotations: true,
          parties: true,
          credit_management: true,
        },
      }).select("id").single();

      if (tenantErr || !tenant) {
        return json({ error: `Failed to create tenant: ${tenantErr?.message ?? "Unknown error"}` }, 400);
      }
      tenantId = tenant.id;
    }

    if (!tenantId) {
      return json({ error: "The creating admin is not associated with a tenant" }, 400);
    }

    // Generate a temporary password the new user will need to change.
    const tempPassword = crypto.randomUUID();

    const { data: created, error: createErr } =
      await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: newUserName.trim(),
          role: newUserRole,
          tenant_id: tenantId,
          is_platform_admin: false,
        },
      });

    if (createErr || !created.user) {
      if (isClientCreation) await adminClient.from("tenants").delete().eq("id", tenantId);
      return json(
        { error: createErr?.message ?? "Failed to create auth user" },
        400,
      );
    }

    const profileValues = {
      email: normalizedEmail,
      name: newUserName.trim(),
      role: newUserRole,
      tenant_id: tenantId,
      is_platform_admin: false,
      is_active: true,
    };

    const { data: updatedProfile, error: updateErr } = await adminClient
      .from("profiles")
      .update(profileValues)
      .eq("auth_user_id", created.user.id)
      .select("id")
      .maybeSingle();

    let insertErr = updateErr;
    if (!updatedProfile && !updateErr) {
      const { error: fallbackInsertErr } = await adminClient.from("profiles").insert({
      auth_user_id: created.user.id,
        ...profileValues,
      });
      insertErr = fallbackInsertErr;
    }

    if (insertErr) {
      // Roll back the auth user if the profile insert failed, so we don't
      // end up with an orphaned Auth account with no profile.
      await adminClient.auth.admin.deleteUser(created.user.id);
      if (isClientCreation) await adminClient.from("tenants").delete().eq("id", tenantId);
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