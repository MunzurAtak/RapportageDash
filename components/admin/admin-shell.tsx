import { ReactNode } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

type AdminShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  userLabel: string;
};

export function AdminShell({
  children,
  title,
  subtitle,
  userLabel,
}: AdminShellProps) {
  return (
    <main className="min-h-screen bg-slate-100 lg:flex">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
              <p className="text-sm text-slate-600">{userLabel}</p>
              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </main>
  );
}
