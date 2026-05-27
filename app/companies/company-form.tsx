"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCompany } from "./actions";

export function CompanyForm() {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (formData) => {
        await createCompany(formData);
        ref.current?.reset();
      }}
      className="border rounded-lg p-4 space-y-4"
    >
      <h2 className="font-medium">New Company</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" required placeholder="Acme Corp" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" placeholder="acme.com" />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Optional context" />
      </div>
      <Button type="submit">Add Company</Button>
    </form>
  );
}
