import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { approveRegistration, rejectRegistration } from "./actions";

type RegistrationPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "approve-failed") {
    return "Aanmelding kon niet worden goedgekeurd.";
  }

  if (error === "reject-failed") {
    return "Aanmelding kon niet worden afgewezen.";
  }

  if (error === "invalid-role") {
    return "Ongeldige rol gekozen.";
  }

  return null;
}

export default async function AdminRegistrationsPage({
  searchParams,
}: RegistrationPageProps) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, active, approved")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.approved) {
    redirect("/account-inactief?reason=pending");
  }

  if (!profile.active) {
    redirect("/account-inactief?reason=inactive");
  }

  if (profile.role !== "admin" && profile.role !== "coordinator") {
    redirect("/docent");
  }

  const { data: registrations, error: registrationsError } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, registration_notes, created_at")
    .eq("approved", false)
    .eq("active", true)
    .order("created_at", { ascending: false });

  const errorMessage = getErrorMessage(error);

  return (
    <AdminShell
      title="Aanmeldingen"
      subtitle="Nieuwe accounts die wachten op goedkeuring."
      userLabel={`${profile.full_name} · ${profile.role}`}
    >
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Openstaande aanmeldingen
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Keur bijlesdocenten goed voordat zij toegang krijgen.
          </p>
        </div>

        {errorMessage && (
          <div className="m-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {registrationsError && (
          <div className="m-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Aanmeldingen konden niet worden opgehaald.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-600">Naam</th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  E-mailadres
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Telefoon
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Opmerkingen
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Actie
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {(!registrations || registrations.length === 0) && (
                <tr>
                  <td className="px-6 py-5 text-slate-500" colSpan={5}>
                    Er zijn geen openstaande aanmeldingen.
                  </td>
                </tr>
              )}

              {(registrations ?? []).map((registration) => (
                <tr key={registration.id}>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {registration.full_name}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {registration.email}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {registration.phone ?? "-"}
                  </td>

                  <td className="max-w-xs px-6 py-4 text-slate-600">
                    {registration.registration_notes ?? "-"}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <form action={approveRegistration} className="flex gap-2">
                        <input
                          type="hidden"
                          name="profileId"
                          value={registration.id}
                        />

                        <select
                          name="role"
                          defaultValue="tutor"
                          className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900"
                        >
                          <option value="tutor">Tutor</option>
                          <option value="coordinator">Coordinator</option>
                          <option value="admin">Admin</option>
                        </select>

                        <button
                          type="submit"
                          className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                        >
                          Goedkeuren
                        </button>
                      </form>

                      <form action={rejectRegistration}>
                        <input
                          type="hidden"
                          name="profileId"
                          value={registration.id}
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          Afwijzen
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
