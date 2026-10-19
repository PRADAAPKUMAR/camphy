import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export interface UserProfile { id: string; full_name: string; display_name: string; avatar_url: string | null; account_type: "student" | "teacher"; grade: "igcse" | "as" | "a2" | null; school: string | null; country: string | null; preferences: Record<string, unknown>; usage_summary: Record<string, unknown>; setup_completed: boolean }
interface AuthValue { loading: boolean; session: Session | null; user: User | null; profile: UserProfile | null; role: "user" | "admin"; refreshProfile: () => Promise<void>; historyLoading: boolean; historyError: string | null; refreshHistory: () => void; signOut: () => Promise<void> }
export const AuthContext = createContext<AuthValue | null>(null);

export const useAuth = () => { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be inside AuthProvider"); return value; };
