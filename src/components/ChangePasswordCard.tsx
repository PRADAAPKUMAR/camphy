import { useState } from "react";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isStrongPassword, passwordRules } from "@/lib/password-strength";

export default function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const strong = isStrongPassword(next);
  const matches = next.length > 0 && next === confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strong) return void toast.error("Please choose a stronger password.");
    if (!matches) return void toast.error("The new passwords do not match.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: next, current_password: current } as Parameters<typeof supabase.auth.updateUser>[0]);
      if (error) throw error;
      toast.success("Password changed");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change password");
    } finally { setBusy(false); }
  };

  const type = show ? "text" : "password";
  return (
    <form onSubmit={submit} className="mt-8 space-y-4 border-t border-border pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Change password</h2>
        <Button type="button" variant="ghost" size="icon" onClick={() => setShow(!show)} aria-label={show ? "Hide passwords" : "Show passwords"}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
      </div>
      <div><Label htmlFor="current-password">Current password</Label><Input id="current-password" type={type} autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
      <div><Label htmlFor="new-password">New password</Label><Input id="new-password" type={type} autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} /></div>
      <ul className="grid gap-1 text-xs sm:grid-cols-2">
        {passwordRules.map((r) => { const ok = r.test(next); return <li key={r.label} className={`flex items-center gap-1.5 ${ok ? "text-primary" : "text-muted-foreground"}`}>{ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}{r.label}</li>; })}
      </ul>
      <div><Label htmlFor="confirm-password">Retype new password</Label><Input id="confirm-password" type={type} autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {confirm.length > 0 && !matches && <p className="mt-1 text-xs text-destructive">Passwords do not match.</p>}</div>
      <Button disabled={busy || !strong || !matches || !current}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update password</Button>
    </form>
  );
}
