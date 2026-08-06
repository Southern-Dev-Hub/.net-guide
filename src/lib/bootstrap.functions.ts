import { createServerFn } from "@tanstack/react-start";

const ADMIN_EMAIL = "admin@dotnetguide.local";
const ADMIN_PASSWORD = "admin123";

/**
 * Creates the default administrator account the first time it is called.
 * It is a no-op once any administrator exists, so it cannot be used to
 * escalate privileges later on.
 */
export const ensureDefaultAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: existing, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("role", "admin")
    .limit(1);

  if (roleError) throw new Error(roleError.message);
  if (existing && existing.length > 0) return { created: false, email: ADMIN_EMAIL };

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { username: "admin" },
  });

  let userId = created?.user?.id;

  if (createError || !userId) {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    userId = list?.users.find((u) => u.email === ADMIN_EMAIL)?.id;
    if (!userId) throw new Error(createError?.message ?? "Could not create the administrator");
  }

  const { error: insertError } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: userId, role: "admin" });
  if (insertError && !insertError.message.includes("duplicate")) {
    throw new Error(insertError.message);
  }

  return { created: true, email: ADMIN_EMAIL };
});
