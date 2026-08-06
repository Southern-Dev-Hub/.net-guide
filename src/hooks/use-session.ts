import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type SessionState = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
};

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    user: null,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    let active = true;

    async function resolve(user: User | null) {
      if (!user) {
        if (active) setState({ user: null, isAdmin: false, loading: false });
        return;
      }
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (active) setState({ user, isAdmin: data === true, loading: false });
    }

    supabase.auth.getSession().then(({ data }) => resolve(data.session?.user ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      void resolve(session?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
