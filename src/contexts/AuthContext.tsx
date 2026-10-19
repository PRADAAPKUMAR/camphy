import { AuthContext, type UserProfile } from "./auth-context";
import { fetchAccountHistory } from "@/lib/account-progress";
import { restorePerformanceHistory, setPerformanceAccount } from "@/lib/performance-history";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null); const [profile, setProfile] = useState<UserProfile | null>(null); const [role, setRole] = useState<"user" | "admin">("user"); const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyRevision, setHistoryRevision] = useState(0);
  const refreshHistory = useCallback(() => setHistoryRevision((value) => value + 1), []);
  const userId = session?.user.id ?? null;
  useEffect(() => {
    let active = true;
    setPerformanceAccount(userId);
    setHistoryError(null);
    setHistoryLoading(!!userId);
    if (userId) {
      fetchAccountHistory(userId).then((records) => {
        if (active) restorePerformanceHistory(userId, records);
      }).catch(() => { if (active) setHistoryError("Cloud progress could not be loaded. Your saved device history is still available."); })
        .finally(() => { if (active) setHistoryLoading(false); });
    }
    return () => { active = false; };
  }, [userId, historyRevision]);
  const refreshProfile = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("account-bootstrap", { body: {} });
    if (!error && data?.profile) { setProfile(data.profile as UserProfile); setRole(data.role === "admin" ? "admin" : "user"); }
  }, []);
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => { if (!active) return; setSession(data.session); setLoading(false); if (data.session) void refreshProfile(); }).catch(() => { if (active) setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); if (!next) { setProfile(null); setRole("user"); setLoading(false); } else window.setTimeout(() => void refreshProfile(), 0); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [refreshProfile]);
  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);
  const value = useMemo(() => ({ loading, session, user: session?.user ?? null, profile, role, refreshProfile, historyLoading, historyError, refreshHistory, signOut }), [loading, session, profile, role, refreshProfile, historyLoading, historyError, refreshHistory, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
