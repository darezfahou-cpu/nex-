import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — NEXORA Logistics" },
      {
        name: "description",
        content: "Sign in to the NEXORA customer portal to book shipments and follow every load.",
      },
      { property: "og:title", content: "Sign in — NEXORA Logistics" },
      { property: "og:description", content: "Access the NEXORA customer portal." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate({ to: "/dashboard", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setCheckEmail(true);
          toast.success("Account created. Confirm your email to sign in.");
          return;
        }
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Try email instead.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <section className="mx-auto max-w-md px-5 py-20">
      <p className="eyebrow">Customer portal</p>
      <h1 className="mt-4 text-3xl uppercase">
        {mode === "signin" ? "Sign in" : "Create account"}
      </h1>

      {checkEmail && (
        <div className="mt-6 border border-primary/40 bg-primary/10 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            Confirm your email
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to {email}. Open it, then sign in here.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {mode === "signup" && (
          <div>
            <Label htmlFor="fullName" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Full name
            </Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-2 rounded-none" />
          </div>
        )}
        <div>
          <Label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Email
          </Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 rounded-none" />
        </div>
        <div>
          <Label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Password
          </Label>
          <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 rounded-none" />
        </div>
        <Button type="submit" className="w-full rounded-none" disabled={busy}>
          {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button variant="outline" className="w-full rounded-none" onClick={handleGoogle}>
        Continue with Google
      </Button>

      <button
        type="button"
        className="mt-6 w-full font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-primary"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
      >
        {mode === "signin" ? "No account? Create one" : "Already registered? Sign in"}
      </button>
    </section>
  );
}
