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
    <main className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <p className="text-sm text-slate-600">{userLabel}</p>
              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="flex-1 px-8 py-8">{children}</div>
      </div>
    </main>
  );
}
