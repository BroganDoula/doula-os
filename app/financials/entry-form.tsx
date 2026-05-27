"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createFinancialEntry, updateFinancialEntry } from "./actions";

export type EntryType = "revenue" | "cash_on_hand" | "recurring_cost" | "ar_item";
type Company = { id: string; name: string };

export type EntryDefaultValues = {
  id: string;
  type: EntryType;
  clientId: string | null;
  description: string;
  amountCents: number;
  date: string;
  dueDate: string | null;
  paidAt: string | null;
  recurringPeriod: string | null;
  notes: string | null;
};

const TYPE_LABELS: Record<EntryType, string> = {
  revenue: "Revenue Entry",
  cash_on_hand: "Cash Snapshot",
  recurring_cost: "Recurring Cost",
  ar_item: "AR Item",
};

export function EntryForm({
  type,
  companies,
  defaultValues,
  onCancel,
}: {
  type: EntryType;
  companies: Company[];
  defaultValues?: EntryDefaultValues;
  onCancel?: () => void;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const isEdit = !!defaultValues;

  return (
    <form
      ref={ref}
      action={async (formData) => {
        if (isEdit) {
          await updateFinancialEntry(formData);
        } else {
          await createFinancialEntry(formData);
          ref.current?.reset();
        }
        onCancel?.();
      }}
      className="border rounded-lg p-4 space-y-4"
    >
      {isEdit && <input type="hidden" name="id" value={defaultValues.id} />}
      <input type="hidden" name="type" value={type} />
      <h2 className="font-medium">
        {isEdit ? `Edit ${TYPE_LABELS[type]}` : `New ${TYPE_LABELS[type]}`}
      </h2>

      {/* Client dropdown — revenue (optional) and ar_item (required) */}
      {(type === "revenue" || type === "ar_item") && (
        <div className="space-y-1">
          <Label htmlFor="clientId">
            Client {type === "ar_item" ? "*" : "(optional)"}
          </Label>
          <select
            id="clientId"
            name="clientId"
            required={type === "ar_item"}
            defaultValue={defaultValues?.clientId ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">No client</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="description">
            {type === "cash_on_hand" ? "Account *" : "Description *"}
          </Label>
          <Input
            id="description"
            name="description"
            required
            placeholder={
              type === "cash_on_hand" ? "Chase Business Checking" :
              type === "recurring_cost" ? "Adobe CC" :
              type === "ar_item" ? "Invoice #1234" :
              "Acme Corp — June"
            }
            defaultValue={defaultValues?.description ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="amount">Amount ($) *</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="5000"
            required
            defaultValue={defaultValues ? defaultValues.amountCents / 100 : ""}
          />
        </div>
      </div>

      {/* Period — recurring_cost only */}
      {type === "recurring_cost" && (
        <div className="space-y-1">
          <Label htmlFor="recurringPeriod">Period *</Label>
          <select
            id="recurringPeriod"
            name="recurringPeriod"
            required
            defaultValue={defaultValues?.recurringPeriod ?? "monthly"}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
            <option value="one_time">One-time</option>
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="date">
            {type === "cash_on_hand" ? "Snapshot Date *" :
             type === "ar_item" ? "Date Sent *" :
             type === "recurring_cost" ? "Start Date *" :
             "Date *"}
          </Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={defaultValues?.date ?? ""}
          />
        </div>

        {/* Due date — ar_item only */}
        {type === "ar_item" && (
          <div className="space-y-1">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={defaultValues?.dueDate ?? ""}
            />
          </div>
        )}
      </div>

      {/* Paid date — ar_item only */}
      {type === "ar_item" && (
        <div className="space-y-1">
          <Label htmlFor="paidAt">Paid Date (blank = outstanding)</Label>
          <Input
            id="paidAt"
            name="paidAt"
            type="date"
            defaultValue={defaultValues?.paidAt ?? ""}
          />
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="…"
          defaultValue={defaultValues?.notes ?? ""}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          {isEdit ? "Save" : `Add ${TYPE_LABELS[type]}`}
        </Button>
        {isEdit && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
