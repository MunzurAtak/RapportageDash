"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [registrationNotes, setRegistrationNotes] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          registration_notes: registrationNotes,
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();

    router.push("/account-inactief?reason=pending");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            Registreren
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Maak een account aan als bijlesdocent. Een admin moet je account
            eerst goedkeuren voordat je kunt inloggen.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Voor- en achternaam *
            </label>
            <input
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
              placeholder="Bijvoorbeeld: Fatih Demir"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              E-mailadres *
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
              Telefoonnummer
            </label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
              placeholder="Optioneel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Opmerkingen
            </label>
            <textarea
              value={registrationNotes}
              onChange={(event) => setRegistrationNotes(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
              placeholder="Optioneel: bijvoorbeeld welke vakken of leerlingen je begeleidt."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Wachtwoord *
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
              Herhaal wachtwoord *
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={passwordRepeat}
              onChange={(event) => setPasswordRepeat(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
              placeholder="Herhaal wachtwoord"
            />
          </div>

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
            {loading ? "Registreren..." : "Registratie versturen"}
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
