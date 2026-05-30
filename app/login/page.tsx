"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage("Kon gebruiker niet ophalen.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, active, approved")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      setErrorMessage("Geen profiel gevonden voor deze gebruiker.");
      setLoading(false);
      return;
    }

    if (!profile.approved) {
      await supabase.auth.signOut();
      router.push("/account-inactief?reason=pending");
      router.refresh();
      return;
    }

    if (!profile.active) {
      await supabase.auth.signOut();
      router.push("/account-inactief?reason=inactive");
      router.refresh();
      return;
    }

    if (profile.role === "admin" || profile.role === "coordinator") {
      router.push("/admin");
    } else {
      router.push("/docent");
    }

    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            010 op niveau
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Log in om rapportages te beheren of in te vullen.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              E-mailadres
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
              placeholder="naam@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Wachtwoord
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
              placeholder="••••••••"
            />
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-slate-700">Ingelogd blijven</span>
          </label>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Inloggen..." : "Inloggen"}
          </button>

          <div className="flex items-center justify-between pt-2 text-sm">
            <Link href="/register" className="font-medium text-slate-700 hover:text-slate-900">
              Registreren
            </Link>

            <Link
              href="/forgot-password"
              className="font-medium text-slate-700 hover:text-slate-900"
            >
              Wachtwoord vergeten?
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
