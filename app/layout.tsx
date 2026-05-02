import type { Metadata } from "next";
import "./globals.css";
import { SupabaseProvider } from "@/components/SupabaseProvider";
import Image from "next/image";
import AdminNav from "@/components/AdminNav";
import Link from "next/link";
import ProfileNav from "@/components/ProfileNav";
import AuthNav from "@/components/AuthNav";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const metadata: Metadata = {
  title: "Lincolnshire Country Club | District Roster",
  description: "Official Interclub Match Roster & Availability",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ Server-side auth check every render
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: userData } = await supabase.auth.getUser();

  let isAdmin = false;

  if (userData?.user) {
    const { data } = await supabase.rpc("is_admin");
    isAdmin = Boolean(data);
  }

  return (
    <html lang="en">
      <body className="bg-gray-50">
        <SupabaseProvider>
          {/* Header */}
          <header className="header-bg py-4 sticky top-0 z-50 shadow-md">
            <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
              {/* Logo + Title */}
              <div className="flex items-center gap-4">
                <Image
                  src="/logo.png"
                  alt="Lincolnshire Country Club"
                  width={80}
                  height={80}
                  className="rounded-full"
                  priority
                />
                <div>
                  <h1 className="text-2xl font-serif tracking-wide text-[#0a2540]">
                    Lincolnshire Country Club
                  </h1>
                  <p className="text-sm text-[#d4af37] -mt-1">
                    District Roster • Interclub Matches
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex gap-6 text-sm font-medium">
                {isAdmin && <AdminNav />}
                <AuthNav />
              </nav>
            </div>
          </header>

          {/* Page Content */}
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}