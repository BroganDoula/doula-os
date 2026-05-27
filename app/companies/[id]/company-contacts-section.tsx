"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteConfirm } from "@/components/ui/delete-confirm";
import { ContactForm } from "@/app/contacts/contact-form";
import { deleteContact } from "@/app/contacts/actions";

type ContactRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  notes: string | null;
  companyId: string | null;
};

type Company = { id: string; name: string };

export function CompanyContactsSection({
  contacts,
  companyId,
  companyName,
}: {
  contacts: ContactRow[];
  companyId: string;
  companyName: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});

  // Single-item list so ContactForm dropdown is pre-locked to this company
  const companies: Company[] = [{ id: companyId, name: companyName }];

  return (
    <div className="space-y-3">
      {showAdd ? (
        <ContactForm
          companies={companies}
          defaultCompanyId={companyId}
          onCancel={() => setShowAdd(false)}
        />
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
          + Add Contact
        </Button>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">Name</th>
            <th className="pb-2 font-medium">Email</th>
            <th className="pb-2 font-medium">Phone</th>
            <th className="pb-2 font-medium">Role</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {contacts.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-muted-foreground">
                No contacts for this company.
              </td>
            </tr>
          )}
          {contacts.map((c) =>
            editingId === c.id ? (
              <tr key={c.id}>
                <td colSpan={5} className="py-2">
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
                <td className="py-2 text-muted-foreground">{c.email ?? "—"}</td>
                <td className="py-2 text-muted-foreground">{c.phone ?? "—"}</td>
                <td className="py-2 text-muted-foreground">{c.role ?? "—"}</td>
                <td className="py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(c.id)}>Edit</Button>
                    <DeleteConfirm
                      title="Delete contact?"
                      description={`This will permanently delete ${c.name}.`}
                      onConfirm={async () => {
                        setDeleteErrors((prev) => { const n = { ...prev }; delete n[c.id]; return n; });
                        const fd = new FormData();
                        fd.append("id", c.id);
                        fd.append("companyId", companyId);
                        const res = await deleteContact(fd);
                        if (res?.error) setDeleteErrors((prev) => ({ ...prev, [c.id]: res.error }));
                      }}
                    />
                  </div>
                  {deleteErrors[c.id] && (
                    <p className="text-xs text-red-500 mt-1 text-right">{deleteErrors[c.id]}</p>
                  )}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
