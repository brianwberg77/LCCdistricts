"use client";

import Link from "next/link";
import { useSupabase } from "@/components/SupabaseProvider";

export default function ProfileNav() {
  const { user } = useSupabase();
  if (!user) return null;

  return (
    <Link
      href="/profile"
      className="text-[#0a2540] hover:text-[#d4af37]"
    >
      My Profile
    </Link>
  );
}