import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const safe = (value: string | null) => (value?.startsWith("/") && !value.startsWith("//") ? value : null);

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  useEffect(() => {
    const target = safe(params.get("returnTo")) ?? safe(sessionStorage.getItem("auth-return")) ?? "/";
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      if (ok) {
        sessionStorage.removeItem("auth-return");
        navigate(target, { replace: true });
      } else {
        toast.error("Sign-in could not be completed. Please try again.");
        navigate(`/auth?returnTo=${encodeURIComponent(target)}`, { replace: true });
      }
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => { if (session) finish(true); });
    supabase.auth.getSession().then(({ data }) => { if (data.session) finish(true); });
    const timer = window.setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => finish(!!data.session));
    }, 5000);
    return () => { sub.subscription.unsubscribe(); window.clearTimeout(timer); };
  }, [navigate, params]);
  return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Completing sign in" /></div>;
}
