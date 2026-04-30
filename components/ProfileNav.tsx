"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function ProfileNav() {
  const supabase = createClient();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data?.user);
    });
  }, [supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (!loggedIn) {
    return (
      <Link href="/login" className="text-sm text-[#0a2540] hover:text-[#d4af37]">
        Member Login
      </Link>
    );
  }

  return (
    <>
      <Link href="/profile" className="text-sm text-[#0a2540] hover:text-[#d4af37]">
        My Profile
      </Link>
      <button
        onClick={logout}
        className="text-sm text-[#0a2540] hover:text-[#d4af37]"
      >
        Logout
      </button>
    </>
  );
}
