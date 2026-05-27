"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CompanyForm } from "../company-form";

type CompanyData = {
  id: string;
  name: string;
  website: string | null;
  notes: string | null;
};

export function CompanyHeader({ company }: { company: CompanyData }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <CompanyForm
        defaultValues={company}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold">{company.name}</h1>
        {company.website && (
          <p className="text-sm text-muted-foreground mt-1">
            <a
              href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {company.website}
            </a>
          </p>
        )}
        {company.notes && (
          <p className="text-sm text-muted-foreground mt-2">{company.notes}</p>
        )}
      </div>
      <Button variant="outline" size="sm" className="shrink-0" onClick={() => setEditing(true)}>
        Edit
      </Button>
    </div>
  );
}
