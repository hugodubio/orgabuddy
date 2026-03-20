"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { hasSupabaseEnv } from "@/lib/auth/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TEST_ACCOUNTS = [
  { email: "hugo@orgabuddy.app", label: "Hugo (admin)" },
  { email: "ras@orgabuddy.app", label: "Ras (member)" },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const useSupabase = hasSupabaseEnv();

  async function signIn(emailToUse: string, passwordToUse: string) {
    setLoading(true);
    try {
      if (useSupabase) {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password: passwordToUse });
        if (error) throw error;
      } else {
        const response = await fetch("/api/dev-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailToUse }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || "Unable to sign in.");
        }
      }
      toast.success("Signed in.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await signIn(email, password);
  }

  return (
    <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-primary/20 via-white/[0.03] to-accent/10 p-10 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/70">OrgaBuddy</p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-tight">Smart rehearsal planning for multi-band chaos.</h1>
          <p className="mt-5 max-w-lg text-base text-muted-foreground">
            Collect availability once, rank the best overlap instantly, and confirm the rehearsal without another message thread.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {["Bands", "Overlap", "Calendar"].map((item) => (
            <div key={item} className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">
              <p className="text-lg font-semibold text-foreground">{item}</p>
              <p className="mt-2">Built for practical scheduling, not admin busywork.</p>
            </div>
          ))}
        </div>
      </div>
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            {useSupabase ? "Enter your credentials to access the dashboard." : "Test mode — pick an account to enter directly."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!useSupabase ? (
            <div className="space-y-3">
              {TEST_ACCOUNTS.map((account) => (
                <Button
                  key={account.email}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={loading}
                  onClick={() => signIn(account.email, "")}
                >
                  {loading ? "Entering..." : `Enter as ${account.label}`}
                </Button>
              ))}
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Enter dashboard"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
