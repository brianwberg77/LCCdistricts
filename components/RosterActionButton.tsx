"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RosterActionButton({
    eventId,
    profileId,
    isSelected,
    variant = "yes",
}: {
    eventId: string;
    profileId: string;
    isSelected: boolean;
    variant?: "yes" | "maybe";
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function toggle() {
        setLoading(true);

        try {
            await fetch("/admin/events/roster/select", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    event_id: eventId,
                    profile_id: profileId,
                    action: isSelected ? "remove" : "add",
                }),
            });

            // Re-fetch server data WITHOUT a full navigation.
            // This preserves the current scroll position.
            router.refresh();
        } finally {
            setLoading(false);
        }
    }

    const base =
        "px-3 py-2 rounded-lg text-sm transition disabled:opacity-50";

    const cls = isSelected
        ? `${base} bg-red-100 text-red-800 hover:bg-red-200`
        : variant === "maybe"
            ? `${base} bg-yellow-200 text-yellow-900 hover:bg-yellow-300`
            : `${base} bg-green-100 text-green-800 hover:bg-green-200`;

    return (
        <button onClick={toggle} disabled={loading} className={cls}>
            {loading ? "…" : isSelected ? "Remove" : "Select"}
        </button>
    );
}
