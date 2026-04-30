"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";

export default function AdminNav() {
  const { user, role } = useSupabase();
  const pathname = usePathname();

  if (!user || role !== "admin") return null;

  const isOnAdmin = pathname.startsWith("/admin");

  return isOnAdmin ? (
    <Link
      href="/dashboard"
      className="text-[#0a2540] hover:text-[#d4af37]"
    >
      Dashboard
    </Link>
  ) : (
    <Link
      href="/admin"
      className="text-[#0a2540] hover:text-[#d4af37]"
    >
      Return to Admin
    </Link>
  );
}