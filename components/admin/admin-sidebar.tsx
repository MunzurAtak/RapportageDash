"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Home,
  UserPlus,
  Users,
} from "lucide-react";

const menuItems = [
  {
    label: "Home",
    href: "/admin",
    icon: Home,
  },
  {
    label: "Aanmeldingen",
    href: "/admin/registrations",
    icon: UserPlus,
  },
  {
    label: "Bijlesdocenten & Personeel",
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

  return (
    <aside className="min-h-screen w-72 bg-teal-600 text-white">
      <div className="border-b border-teal-500 px-6 py-5">
        <p className="text-sm font-medium text-teal-100">010 op niveau</p>
        <h1 className="mt-1 text-lg font-semibold">Adminpaneel</h1>
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
              className={`flex items-center gap-3 border-b border-teal-500 px-6 py-4 text-sm font-semibold transition ${
                isActive
                  ? "bg-teal-800 text-white"
                  : "bg-teal-600 text-teal-50 hover:bg-teal-700"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
