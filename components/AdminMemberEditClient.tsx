"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  cell_phone: string | null;
  member_number: string | null;
  cdga_number: string | null;
  role: string | null;
};

export default function AdminMemberEditClient() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  // ✅ Next.js official way to read dynamic params in Client Components [1](https://nextjs.org/docs/app/api-reference/functions/use-params)
  const params = useParams<{ id?: string }>();
  const memberId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState<string>("");
  const [member, setMember] = useState<ProfileRow | null>(null);

  // Editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cellPhone, setCellPhone] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [cdgaNumber, setCdgaNumber] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");

  useEffect(() => {
    const load = async () => {
      setErrorText("");

      // Keep debug: if id is missing, show it loudly
      if (!memberId) {
        setLoading(false);
        setErrorText("DEBUG: useParams() returned no member id. URL param not resolved.");
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", memberId)
        .single();

      if (error || !data) {
        setLoading(false);
        setErrorText(
          "DEBUG: Failed to load member (RLS? not found?). " + (error?.message ?? "")
        );
        return;
      }

      const m = data as ProfileRow;
      setMember(m);

      // Initialize fields
      setFirstName(m.first_name ?? "");
      setLastName(m.last_name ?? "");
      setCellPhone(m.cell_phone ?? "");
      setMemberNumber(m.member_number ?? "");
      setCdgaNumber(m.cdga_number ?? "");
      setRole((m.role === "admin" ? "admin" : "member") as "admin" | "member");

      setLoading(false);
    };

    load();
  }, [memberId, supabase]);

  const save = async () => {
    setErrorText("");

    if (!memberId) {
      setErrorText("DEBUG: Cannot save because memberId is missing.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        cell_phone: cellPhone.trim() || null,
        member_number: memberNumber.trim() || null,
        cdga_number: cdgaNumber.trim() || null,
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", memberId);

    setSaving(false);

    if (error) {
      setErrorText("DEBUG: Save failed: " + error.message);
      return;
    }

    // Back to members with a notice
    router.push("/admin/members?notice=" + encodeURIComponent("Member updated."));
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-serif text-[#0a2540]">Loading Member…</h1>
        <p className="text-gray-600 mt-2">Waiting on member record.</p>
      </main>
    );
  }

  if (!memberId) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-4">
        <h1 className="text-2xl font-serif text-[#0a2540]">Edit Member</h1>
        <p className="text-red-600">{errorText}</p>
        <Link href="/admin/members" className="text-blue-700 underline">
          ← Back to Members
        </Link>
      </main>
    );
  }

  if (!member) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-4">
        <h1 className="text-2xl font-serif text-[#0a2540]">Edit Member</h1>
        <p className="text-red-600">{errorText || "Member could not be loaded."}</p>
        <Link href="/admin/members" className="text-blue-700 underline">
          ← Back to Members
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif text-[#0a2540]">Edit Member</h1>
          <p className="text-gray-600">{member.email ?? "(no email on file)"}</p>
        </div>
        <Link href="/admin/members" className="text-sm text-blue-700">
          ← Back to Members
        </Link>
      </div>

      {errorText ? (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {errorText}
        </div>
      ) : null}

      <section className="bg-white rounded-2xl shadow-xl p-8 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cell Phone</label>
          <input
            value={cellPhone}
            onChange={(e) => setCellPhone(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Member Club #</label>
            <input
              value={memberNumber}
              onChange={(e) => setMemberNumber(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">CDGA #</label>
            <input
              value={cdgaNumber}
              onChange={(e) => setCdgaNumber(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "member" | "admin")}
            className="w-full border px-3 py-2 rounded-lg"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2 bg-[#0a2540] text-white rounded-lg hover:bg-black disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Member"}
        </button>
		<div className="border-t pt-6 mt-8">
		  <h3 className="text-sm font-semibold text-red-700">
			Danger Zone
		  </h3>

		  <form
			method="POST"
			action={`/admin/members/${memberId}/deactivate`}
			onSubmit={e => {
			  if (!confirm('This will remove this golfer from all future use. Are you sure?')) {
				e.preventDefault()
			  }
			}}
		  >
			<button
			  type="submit"
			  className="mt-3 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
			>
			  Deactivate Golfer
			</button>
		  </form>
		</div>
      </section>
    </main>
  );
}