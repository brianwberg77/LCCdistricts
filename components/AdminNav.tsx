"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function AdminNav() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.user.id)
        .single();

      setIsAdmin(data?.role === "admin");
    };

    load();
  }, [supabase]);

  if (!isAdmin) return null;

  return (
    <>
      <Link href="/admin" className="text-sm hover:underline">
        Return to Admin
      </Link>
    </>
  );
}