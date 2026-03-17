"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

const initialState = {
  deviceId: "",
  name: "",
  location: "",
  area: "",
  notes: "",
};

function normalizeDeviceId(value: string) {
  return value.trim().replace(/\s+/g, "-").toLowerCase();
}

export function AddBinForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField(field: keyof typeof initialState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/bins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: form.deviceId.trim(),
          name: form.name.trim(),
          location: form.location.trim(),
          area: form.area.trim(),
          notes: form.notes.trim(),
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        bin?: { deviceId: string };
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to add bin");
      }

      setForm(initialState);
      setMessage(`Bin added successfully. Saved Device ID: ${data.bin?.deviceId ?? normalizeDeviceId(form.deviceId)}`);
      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to add bin",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-white/70 bg-[rgba(255,251,246,0.86)] p-6 shadow-[0_18px_60px_rgba(49,58,46,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#66755d]">
        Add Bin
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
        Register a new trash bin
      </h2>
      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <input
          className="rounded-[18px] border border-[#d9d7cd] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2f7552]"
          placeholder="Device ID (e.g. esp32-bin-04)"
          required
          value={form.deviceId}
          onChange={(event) => updateField("deviceId", event.target.value)}
        />
        <p className="-mt-1 px-1 text-xs text-[#66755d]">
          This ID must match the ESP&apos;s Webhook Device ID. Spaces will be
          converted to hyphens when the bin is saved.
        </p>
        <p className="-mt-3 px-1 text-xs font-semibold text-[#1e5f41]">
          Saved as: {normalizeDeviceId(form.deviceId || "esp32-bin-01")}
        </p>
        <input
          className="rounded-[18px] border border-[#d9d7cd] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2f7552]"
          placeholder="Display name"
          required
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
        />
        <input
          className="rounded-[18px] border border-[#d9d7cd] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2f7552]"
          placeholder="Location"
          required
          value={form.location}
          onChange={(event) => updateField("location", event.target.value)}
        />
        <input
          className="rounded-[18px] border border-[#d9d7cd] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2f7552]"
          placeholder="Area"
          required
          value={form.area}
          onChange={(event) => updateField("area", event.target.value)}
        />
        <textarea
          className="min-h-24 rounded-[18px] border border-[#d9d7cd] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2f7552]"
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
        />
        <button
          className="rounded-[18px] bg-[#1e5f41] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#174a33] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Adding..." : "Add Bin"}
        </button>
        {message ? (
          <p className="text-sm text-[#1e5f41]">{message}</p>
        ) : null}
        {error ? <p className="text-sm text-[#a62f1f]">{error}</p> : null}
      </form>
    </section>
  );
}
