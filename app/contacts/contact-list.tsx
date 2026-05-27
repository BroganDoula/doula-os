"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContactForm } from "./contact-form";
import { deleteContact } from "./actions";
import type { Company } from "@/db/schema";

type ContactRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  notes: string | null;
  companyId: string | null;
  companyName: string | null;
};

export function ContactList({
  rows,
  companies,
}: {
  rows: ContactRow[];
  companies: Company[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="pb-2 font-medium">Name</th>
          <th className="pb-2 font-medium">Company</th>
          <th className="pb-2 font-medium">Role</th>
          <th className="pb-2 font-medium">Email</th>
          <th className="pb-2 font-medium">Phone</th>
          <th className="pb-2" />
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={6} className="py-6 text-center text-muted-foreground">
              No contacts yet.
            </td>
          </tr>
        )}
        {rows.map((c) =>
          editingId === c.id ? (
            <tr key={c.id}>
              <td colSpan={6} className="py-2">
                <ContactForm
                  companies={companies}
                  defaultValues={c}
                  onCancel={() => setEditingId(null)}
                />
              </td>
            </tr>
          ) : (
            <tr key={c.id} className="border-b">
              <td className="py-2 font-medium">{c.name}</td>
              <td className="py-2 text-muted-foreground">{c.companyName ?? "—"}</td>
              <td className="py-2 text-muted-foreground">{c.role ?? "—"}</td>
              <td className="py-2 text-muted-foreground">{c.email ?? "—"}</td>
              <td className="py-2 text-muted-foreground">{c.phone ?? "—"}</td>
              <td className="py-2 text-right">
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(c.id)}>Edit</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      setDeleteError(null);
                      const fd = new FormData();
                      fd.append("id", c.id);
                      const res = await deleteContact(fd);
                      if (res?.error) setDeleteError(res.error);
                    }}
                  >Delete</Button>
                </div>
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
    {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
    </div>
  );
}
