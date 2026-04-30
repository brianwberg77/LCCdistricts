"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthState = "loading" | "logged-in" | "logged-out";

export default function AuthNav() {
  const supabase = createClient();
  const router = useRouter();
  const [state, setState] = useState<AuthState>("loading");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setState(data?.user ? "logged-in" : "logged-out");
    });

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      supabase.auth.getUser().then(({ data }) => {
        setState(data?.user ? "logged-in" : "logged-out");
      });
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    setState("logged-out");
    router.push("/schedule");
    router.refresh();
  };

  // Avoid flicker
  if (state === "loading") return null;

  // ✅ LOGGED OUT NAV
  if (state === "logged-out") {
    return (
      <>
        <Link href="/schedule" className="text-sm hover:underline">
          Schedule
        </Link>
        <Link href="/login" className="text-sm hover:underline">
          Member Login
        </Link>
      </>
    );
  }

  // ✅ LOGGED IN NAV (role links handled elsewhere)
  return (
    <>
	<Link href="/schedule">Schedule</Link>
	<Link href="/dashboard">Dashboard</Link>
      <Link href="/profile" className="text-sm hover:underline">
        My Profile
      </Link>
      <button
        onClick={logout}
        className="text-sm hover:underline"
      >
        Logout
      </button>
    </>
  );
}