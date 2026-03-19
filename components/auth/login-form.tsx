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

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      if (hasSupabaseEnv()) {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }
      } else {
        const response = await fetch("/api/dev-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
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
            {hasSupabaseEnv() ? "Use the seeded demo credentials or your own Supabase Auth account." : "Local dev auth is active. Use the seeded demo credentials."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} placeholder="hugo@orgabuddy.app" onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} placeholder="orga" onChange={(event) => setPassword(event.target.value)} />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Enter dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
