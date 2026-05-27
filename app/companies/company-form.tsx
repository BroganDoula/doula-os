"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCompany, updateCompany } from "./actions";

type DefaultValues = { id: string; name: string; website: string | null; notes: string | null };

export function CompanyForm({
  defaultValues,
  onCancel,
}: {
  defaultValues?: DefaultValues;
  onCancel?: () => void;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const isEdit = !!defaultValues;

  return (
    <form
      ref={ref}
      action={async (formData) => {
        if (isEdit) {
          await updateCompany(formData);
        } else {
          await createCompany(formData);
          ref.current?.reset();
        }
        onCancel?.();
      }}
      className="border rounded-lg p-4 space-y-4"
    >
      {isEdit && <input type="hidden" name="id" value={defaultValues.id} />}
      <h2 className="font-medium">{isEdit ? "Edit Company" : "New Company"}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" required placeholder="Acme Corp" defaultValue={defaultValues?.name} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" placeholder="acme.com" defaultValue={defaultValues?.website ?? ""} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Optional context" defaultValue={defaultValues?.notes ?? ""} />
      </div>
      <div className="flex gap-2">
        <Button type="submit">{isEdit ? "Save" : "Add Company"}</Button>
        {isEdit && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
