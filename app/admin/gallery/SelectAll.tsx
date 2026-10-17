"use client";

/** ticks or unticks every checkbox that belongs to the bulk form */
export function SelectAll({ form }: { form: string }) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
      <input
        type="checkbox"
        onChange={(e) => {
          document.querySelectorAll<HTMLInputElement>(`input[type=checkbox][form="${form}"]`).forEach((c) => (c.checked = e.target.checked));
        }}
      />
      select all
    </label>
  );
}
