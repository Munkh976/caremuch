import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const defaultPassword = "123456";
    const preservedEmails = ["admin@test.com", "munkh.mn@gmail.com"];

    // Get the single agency
    const { data: agencyData, error: agencyError } = await supabaseAdmin
      .from("agency")
      .select("id")
      .limit(1)
      .single();

    if (agencyError || !agencyData) {
      throw new Error("No agency found. Please create an agency first.");
    }

    const agencyId = agencyData.id;

    const results = {
      deleted: 0,
      admins_preserved: [] as string[],
      clients: [] as any[],
      caregivers: [] as any[],
      errors: [] as any[],
    };

    // Get all auth users
    const { data: { users: allUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    // Identify preserved accounts (admins + specified emails)
    const preservedUserIds: string[] = [];
    for (const user of allUsers || []) {
      if (preservedEmails.includes(user.email || "")) {
        preservedUserIds.push(user.id);
        results.admins_preserved.push(user.email || "");
      }
    }

    // Delete all users except preserved ones
    for (const user of allUsers || []) {
      if (!preservedUserIds.includes(user.id)) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(user.id);
          results.deleted++;
        } catch (error) {
          console.error(`Failed to delete user ${user.email}:`, error);
        }
      }
    }

    // Reset user_id in clients and caregivers tables
    await supabaseAdmin.from("clients").update({ user_id: null }).neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("caregivers").update({ user_id: null }).neq("id", "00000000-0000-0000-0000-000000000000");

    // Ensure preserved admin users have proper roles and profiles
    for (const userId of preservedUserIds) {
      const user = (allUsers || []).find(u => u.id === userId);
      if (!user) continue;

      // Ensure profile exists
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();

      if (!existingProfile) {
        await supabaseAdmin.from("profiles").insert({
          id: userId,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || user.email || "",
          agency_id: agencyId,
        });
      } else {
        await supabaseAdmin.from("profiles")
          .update({ agency_id: agencyId })
          .eq("id", userId);
      }

      // Ensure admin role exists
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "system_admin")
        .single();

      if (!existingRole) {
        await supabaseAdmin.from("user_roles").insert({
          user_id: userId,
          role: "system_admin",
          agency_id: agencyId,
        });
      }
    }

    // Create users for all clients
    const { data: clients } = await supabaseAdmin.from("clients").select("*");

    for (const client of clients || []) {
      if (!client.email) {
        results.errors.push({ type: "client", name: `${client.first_name} ${client.last_name}`, error: "No email" });
        continue;
      }
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: client.email,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: {
            full_name: `${client.first_name} ${client.last_name}`,
            agency_id: agencyId,
          },
        });
        if (authError) throw authError;

        // Wait for profile trigger
        await new Promise(r => setTimeout(r, 300));

        // Ensure profile has correct agency
        await supabaseAdmin.from("profiles")
          .update({ agency_id: agencyId, phone: client.phone })
          .eq("id", authUser.user.id);

        // Link client record
        await supabaseAdmin.from("clients")
          .update({ user_id: authUser.user.id })
          .eq("id", client.id);

        // Assign client role
        await supabaseAdmin.from("user_roles").insert({
          user_id: authUser.user.id,
          role: "client",
          agency_id: agencyId,
        });

        results.clients.push({
          email: client.email,
          name: `${client.first_name} ${client.last_name}`,
          userId: authUser.user.id,
        });
      } catch (error) {
        results.errors.push({
          type: "client",
          email: client.email,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Create users for all caregivers
    const { data: caregivers } = await supabaseAdmin.from("caregivers").select("*");

    for (const caregiver of caregivers || []) {
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: caregiver.email,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: {
            full_name: `${caregiver.first_name} ${caregiver.last_name}`,
            agency_id: agencyId,
          },
        });
        if (authError) throw authError;

        await new Promise(r => setTimeout(r, 300));

        await supabaseAdmin.from("profiles")
          .update({ agency_id: agencyId, phone: caregiver.phone })
          .eq("id", authUser.user.id);

        await supabaseAdmin.from("caregivers")
          .update({ user_id: authUser.user.id })
          .eq("id", caregiver.id);

        await supabaseAdmin.from("user_roles").insert({
          user_id: authUser.user.id,
          role: "caregiver",
          agency_id: agencyId,
        });

        results.caregivers.push({
          email: caregiver.email,
          name: `${caregiver.first_name} ${caregiver.last_name}`,
          userId: authUser.user.id,
        });
      } catch (error) {
        results.errors.push({
          type: "caregiver",
          email: caregiver.email,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        agencyId,
        message: `Preserved ${results.admins_preserved.length} admins. Deleted ${results.deleted} old users. Created ${results.clients.length} client users and ${results.caregivers.length} caregiver users.`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
