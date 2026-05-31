import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { SubmitButton } from "@/components/ui/submit-button";
import { activatePeriod } from "./actions";

export default async function AdminPeriodsPage() {
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

  const { data: periods, error } = await supabase
    .from("report_periods")
    .select("id, name, start_date, end_date, deadline, active")
    .order("start_date", { ascending: false });

  return (
    <AdminShell
      title="Periodes"
      subtitle="Beheer rapportageperiodes, deadlines en actieve maand."
      userLabel={`${profile.full_name} · ${profile.role}`}
    >
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Rapportageperiodes
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Er kan steeds één actieve periode zijn.
            </p>
          </div>

          <Link
            href="/admin/periods/new"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            + Nieuw toevoegen
          </Link>
        </div>

        {error && (
          <div className="m-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Periodes konden niet worden opgehaald.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Periode
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Startdatum
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Einddatum
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Deadline
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Status
                </th>
                <th className="px-6 py-3 font-medium text-slate-600">
                  Actie
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {(!periods || periods.length === 0) && (
                <tr>
                  <td className="px-6 py-5 text-slate-500" colSpan={6}>
                    Er zijn nog geen rapportageperiodes.
                  </td>
                </tr>
              )}

              {(periods ?? []).map((period) => (
                <tr key={period.id}>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {period.name}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {period.start_date}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {period.end_date}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {period.deadline}
                  </td>

                  <td className="px-6 py-4">
                    {period.active ? (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                        Actief
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        Inactief
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {period.active ? (
                      <span className="text-sm text-slate-400">
                        Huidige periode
                      </span>
                    ) : (
                      <form action={activatePeriod}>
                        <input type="hidden" name="periodId" value={period.id} />
                        <SubmitButton
                          pendingText="Activeren..."
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Actief maken
                        </SubmitButton>
                      </form>
                    )}
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
