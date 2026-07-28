import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
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

    // Auth
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
        return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const event_id = String(formData.get("event_id") || "");
    const profile_id = String(formData.get("profile_id") || "");
    const action = String(formData.get("action") || "");

    if (!event_id || !profile_id) {
        return NextResponse.json({ ok: false, error: "missing_params" }, { status: 400 });
    }

    if (action === "remove") {
        const { error } = await supabase
            .from("event_roster")
            .delete()
            .eq("event_id", event_id)
            .eq("profile_id", profile_id);

        if (error) {
            console.error(error);
            return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
        }
    } else {
        const { error } = await supabase.from("event_roster").insert({
            event_id,
            profile_id,
            role: "playing",
        });

        if (error) {
            console.error(error);
            return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
        }
    }

    // Return JSON instead of redirecting — the client calls router.refresh()
    return NextResponse.json({ ok: true });
}
