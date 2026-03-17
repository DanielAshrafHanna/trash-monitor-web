"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import type { Bin } from "@/lib/types";

type Props = {
  bin: Bin;
};

type FormState = {
  name: string;
  location: string;
  area: string;
  notes: string;
};

export function BinCardActions({ bin }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: bin.name,
    location: bin.location,
    area: bin.area,
    notes: bin.notes ?? "",
  });

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/bins/${bin.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          location: form.location.trim(),
          area: form.area.trim(),
          notes: form.notes.trim(),
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update bin");
      }

      setEditing(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to update bin",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete ${bin.name}? This will remove it from the dashboard.`,
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/bins/${bin.id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete bin");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete bin",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (editing) {
    return (
      <form
        className="mt-6 grid gap-3 rounded-[22px] border border-[#dfd8cb] bg-[#fffaf3] p-4"
        onSubmit={handleSave}
      >
        <p className="text-sm font-semibold text-[#17251c]">Edit bin details</p>
        <input
          className="rounded-[16px] border border-[#d9d7cd] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2f7552]"
          placeholder="Display name"
          required
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
        />
        <input
          className="rounded-[16px] border border-[#d9d7cd] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2f7552]"
          placeholder="Location"
          required
          value={form.location}
          onChange={(event) => updateField("location", event.target.value)}
        />
        <input
          className="rounded-[16px] border border-[#d9d7cd] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2f7552]"
          placeholder="Area"
          required
          value={form.area}
          onChange={(event) => updateField("area", event.target.value)}
        />
        <textarea
          className="min-h-24 rounded-[16px] border border-[#d9d7cd] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2f7552]"
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
        />
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-[16px] bg-[#1e5f41] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#174a33] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Saving..." : "Save changes"}
          </button>
          <button
            className="rounded-[16px] border border-[#d2d0c6] bg-white px-4 py-3 text-sm font-semibold text-[#2d4034] transition hover:bg-[#f6f2ea]"
            disabled={submitting}
            type="button"
            onClick={() => {
              setEditing(false);
              setError(null);
              setForm({
                name: bin.name,
                location: bin.location,
                area: bin.area,
                notes: bin.notes ?? "",
              });
            }}
          >
            Cancel
          </button>
        </div>
        {error ? <p className="text-sm text-[#a62f1f]">{error}</p> : null}
      </form>
    );
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button
        className="rounded-[16px] border border-[#d2d0c6] bg-white px-4 py-3 text-sm font-semibold text-[#2d4034] transition hover:bg-[#f6f2ea] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={submitting}
        type="button"
        onClick={() => setEditing(true)}
      >
        Edit
      </button>
      <button
        className="rounded-[16px] border border-[#e6c4ba] bg-[#fff4f1] px-4 py-3 text-sm font-semibold text-[#9f3021] transition hover:bg-[#fde8e2] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={submitting}
        type="button"
        onClick={handleDelete}
      >
        Delete
      </button>
      {error ? <p className="self-center text-sm text-[#a62f1f]">{error}</p> : null}
    </div>
  );
}
