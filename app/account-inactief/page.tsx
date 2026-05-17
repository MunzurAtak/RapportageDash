import Link from "next/link";

type AccountInactivePageProps = {
  searchParams: Promise<{
    reason?: string;
  }>;
};

export default async function AccountInactivePage({
  searchParams,
}: AccountInactivePageProps) {
  const { reason } = await searchParams;

  const title =
    reason === "pending"
      ? "Account wacht op goedkeuring"
      : "Account niet actief";

  const message =
    reason === "pending"
      ? "Je account is aangemaakt, maar moet eerst worden goedgekeurd door een admin."
      : "Je account is inactief. Neem contact op met een admin van 010 op niveau.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>

        <p className="mt-3 text-sm text-slate-600">{message}</p>

        <Link
          href="/login"
          className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Terug naar login
        </Link>
      </div>
    </main>
  );
}
