import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ event_id: string }> }
) {
    const { event_id } = await params;
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    );

    /* ---------- Auth ---------- */
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    /* ---------- Form Data ---------- */
    const formData = await request.formData();
    const profile_id = String(formData.get("profile_id") || "");

    if (!event_id || !profile_id) {
        return NextResponse.redirect(
            new URL(`/admin/events/${event_id}/roster`, request.url)
        );
    }

    /* ---------- Remove from roster ---------- */
    const { error } = await supabase
        .from("event_roster")
        .delete()
        .eq("event_id", event_id)
        .eq("profile_id", profile_id);

    if (error) {
        console.error("Remove from roster failed:", error);
    }

    return NextResponse.redirect(
        new URL(`/admin/events/${event_id}/roster`, request.url)
    );
}
