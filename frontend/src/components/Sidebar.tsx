"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  label: string;
  href: string;
  roles: ("admin" | "teacher" | "student")[];
}

const navItems: NavItem[] = [
  { label: "Home", href: "/", roles: ["admin", "teacher", "student"] },
  { label: "Profile", href: "/profile", roles: ["admin", "teacher", "student"] },
  { label: "Students", href: "/students", roles: ["admin", "teacher"] },
  { label: "Enrollment", href: "/enrollment", roles: ["admin", "teacher"] },
  { label: "Attendance", href: "/attendance", roles: ["admin", "teacher"] },
  { label: "My Attendance", href: "/attendance/my", roles: ["student"] },
  { label: "Settings", href: "/settings", roles: ["admin", "teacher", "student"] },
  { label: "Reports", href: "/reports", roles: ["admin"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const role = user?.role ?? "student";
  const visible = navItems.filter((n) => n.roles.includes(role));

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-gray-100 flex flex-col z-10">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-100">
        <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">F</span>
        </div>
        <span className="font-semibold text-gray-900">FaceTrack AI</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visible.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
