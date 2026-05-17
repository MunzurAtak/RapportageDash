"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");
    setLoading(true);

    if (password.length < 8) {
      setErrorMessage("Wachtwoord moet minimaal 8 tekens bevatten.");
      setLoading(false);
      return;
    }

    if (password !== passwordRepeat) {
      setErrorMessage("Wachtwoorden komen niet overeen.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Je wachtwoord is gewijzigd. Je wordt doorgestuurd naar login.");

    setTimeout(async () => {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    }, 1200);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            Nieuw wachtwoord instellen
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Kies een nieuw wachtwoord voor je account.
          </p>
        </div>

        <form onSubmit={handlePasswordUpdate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nieuw wachtwoord
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
              placeholder="Minimaal 8 tekens"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Herhaal nieuw wachtwoord
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={passwordRepeat}
              onChange={(event) => setPasswordRepeat(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
              placeholder="Herhaal nieuw wachtwoord"
            />
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          {message && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Opslaan..." : "Wachtwoord opslaan"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="font-medium text-slate-700 hover:text-slate-900">
            Terug naar login
          </Link>
        </div>
      </div>
    </main>
  );
}
