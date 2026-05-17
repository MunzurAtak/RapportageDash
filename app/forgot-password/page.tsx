"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleResetRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");
    setLoading(true);

    const supabase = createClient();

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Als dit e-mailadres bestaat, is er een link gestuurd om je wachtwoord te resetten."
    );
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            Wachtwoord vergeten
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Vul je e-mailadres in. Je ontvangt een link om een nieuw wachtwoord
            in te stellen.
          </p>
        </div>

        <form onSubmit={handleResetRequest} className="space-y-5">
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
            {loading ? "Versturen..." : "Resetlink versturen"}
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
