"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FilePenLine,
  GraduationCap,
  Home,
  Menu,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

const menuItems = [
  {
    label: "Home",
    href: "/admin",
    icon: Home,
  },
  {
    label: "Mijn rapportages",
    href: "/docent",
    icon: FilePenLine,
  },
  {
    label: "Aanmeldingen",
    href: "/admin/registrations",
    icon: UserPlus,
  },
  {
    label: "Bijlesdocenten",
    href: "/admin/tutors",
    icon: Users,
  },
  {
    label: "Leerlingen",
    href: "/admin/students",
    icon: GraduationCap,
  },
  {
    label: "Periodes",
    href: "/admin/periods",
    icon: CalendarDays,
  },
  {
    label: "Rapportages",
    href: "/admin/reports",
    icon: ClipboardList,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(false);

  return (
    <>
      {/* Desktop collapsible sidebar */}
      <aside
        className={`hidden min-h-screen shrink-0 bg-teal-600 text-white transition-all duration-200 lg:block ${
          desktopExpanded ? "w-72" : "w-20"
        }`}
      >
        <div className="border-b border-teal-500 px-4 py-5">
          <div className="flex items-center justify-between gap-3">
            {desktopExpanded ? (
              <div>
                <p className="text-sm font-medium text-teal-100">
                  010 op niveau
                </p>
                <h1 className="mt-1 text-lg font-semibold">Adminpaneel</h1>
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-800 text-sm font-bold">
                010
              </div>
            )}

            <button
              type="button"
              onClick={() => setDesktopExpanded((value) => !value)}
              className="rounded-lg bg-teal-800 p-2 text-white hover:bg-teal-900"
              aria-label={desktopExpanded ? "Menu inklappen" : "Menu uitklappen"}
              title={desktopExpanded ? "Menu inklappen" : "Menu uitklappen"}
            >
              {desktopExpanded ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <nav className="py-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 border-b border-teal-500 px-5 py-4 text-sm font-semibold transition ${
                  isActive
                    ? "bg-teal-800 text-white"
                    : "bg-teal-600 text-teal-50 hover:bg-teal-700"
                } ${desktopExpanded ? "justify-start" : "justify-center"}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {desktopExpanded && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile collapsed menu */}
      <div className="border-b border-teal-700 bg-teal-600 text-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm font-medium text-teal-100">010 op niveau</p>
            <h1 className="text-lg font-semibold">Adminpaneel</h1>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-3 py-2 text-sm font-semibold text-white"
          >
            {mobileMenuOpen ? (
              <>
                <X className="h-4 w-4" />
                Sluiten
              </>
            ) : (
              <>
                <Menu className="h-4 w-4" />
                Menu
              </>
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="grid gap-2 border-t border-teal-500 px-4 py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${
                    isActive
                      ? "bg-teal-800 text-white"
                      : "bg-teal-500 text-teal-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </>
  );
}
