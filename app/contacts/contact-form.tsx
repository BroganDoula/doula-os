"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createContact, updateContact } from "./actions";

type Company = { id: string; name: string };

type DefaultValues = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  notes: string | null;
  companyId: string | null;
};

export function ContactForm({
  companies,
  defaultValues,
  onCancel,
  defaultCompanyId,
}: {
  companies: Company[];
  defaultValues?: DefaultValues;
  onCancel?: () => void;
  defaultCompanyId?: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const isEdit = !!defaultValues;

  return (
    <form
      ref={ref}
      action={async (formData) => {
        if (isEdit) {
          await updateContact(formData);
        } else {
          await createContact(formData);
          ref.current?.reset();
        }
        onCancel?.();
      }}
      className="border rounded-lg p-4 space-y-4"
    >
      {isEdit && <input type="hidden" name="id" value={defaultValues.id} />}
      <h2 className="font-medium">{isEdit ? "Edit Contact" : "New Contact"}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" required placeholder="Jane Smith" defaultValue={defaultValues?.name} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="companyId">Company</Label>
          <select
            id="companyId"
            name="companyId"
            defaultValue={defaultValues?.companyId ?? defaultCompanyId ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">No company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="jane@acme.com" defaultValue={defaultValues?.email ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" placeholder="+1 555 000 0000" defaultValue={defaultValues?.phone ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="role">Role</Label>
          <Input id="role" name="role" placeholder="VP Engineering" defaultValue={defaultValues?.role ?? ""} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Optional context" defaultValue={defaultValues?.notes ?? ""} />
      </div>
      <div className="flex gap-2">
        <Button type="submit">{isEdit ? "Save" : "Add Contact"}</Button>
        {isEdit && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
