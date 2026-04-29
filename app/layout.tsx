import type { Metadata } from "next";
import "./globals.css";
import { SupabaseProvider } from "@/components/SupabaseProvider";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Lincolnshire Country Club | District Roster",
  description: "Official Interclub Match Roster & Availability",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <SupabaseProvider>
          {/* Header */}
          <header className="header-bg text-white py-4 sticky top-0 z-50 shadow-md">
            <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
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
                  <h1 className="text-2xl font-serif tracking-wide">Lincolnshire Country Club</h1>
                  <p className="text-sm text-[#d4af37] -mt-1">District Roster • Interclub Matches</p>
                </div>
              </div>
              <nav className="flex gap-6 text-sm font-medium">
                <a href="/" className="hover:text-[#d4af37]">Schedule</a>
                <a href="/login" className="hover:text-[#d4af37]">Member Login</a>
              </nav>
            </div>
          </header>

          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}