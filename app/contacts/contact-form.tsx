"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Company } from "@/db/schema";
import { createContact } from "./actions";

export function ContactForm({ companies }: { companies: Company[] }) {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (formData) => {
        await createContact(formData);
        ref.current?.reset();
      }}
      className="border rounded-lg p-4 space-y-4"
    >
      <h2 className="font-medium">New Contact</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" required placeholder="Jane Smith" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="company">Company</Label>
          <Select name="companyId">
            <SelectTrigger id="company">
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="jane@acme.com" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" placeholder="+1 555 000 0000" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="role">Role</Label>
          <Input id="role" name="role" placeholder="VP Engineering" />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Optional context" />
      </div>
      <Button type="submit">Add Contact</Button>
    </form>
  );
}
