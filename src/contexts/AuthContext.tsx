import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile { id: string; full_name: string; display_name: string; avatar_url: string | null; account_type: "student" | "teacher"; grade: "igcse" | "as" | "a2" | null; school: string | null; country: string | null; preferences: Record<string, unknown>; usage_summary: Record<string, unknown>; setup_completed: boolean }
interface AuthValue { loading: boolean; session: Session | null; user: User | null; profile: UserProfile | null; role: "user" | "admin"; refreshProfile: () => Promise<void>; signOut: () => Promise<void> }
const AuthContext = createContext<AuthValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null); const [profile, setProfile] = useState<UserProfile | null>(null); const [role, setRole] = useState<"user" | "admin">("user"); const [loading, setLoading] = useState(true);
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
  const value = useMemo(() => ({ loading, session, user: session?.user ?? null, profile, role, refreshProfile, signOut }), [loading, session, profile, role, refreshProfile, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be inside AuthProvider"); return value; };
