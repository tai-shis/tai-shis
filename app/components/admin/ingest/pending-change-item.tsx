"use client";

import { useState } from "react";
import { actionClass } from "@/app/components/auth/action-class";
import ProfileRowForm from "@/app/components/admin/profile/profile-row-form";
import RowActionLabel from "@/app/components/admin/row-action-label";
import type { PendingChange } from "@/app/lib/ingestion/types";
import {
  profileTables,
  type ProfileField,
  type ProfileFormValues,
  type ProfileMutationResult,
} from "@/app/lib/profile/tables";

/** `onApprove` takes edited values when Tai changed the proposal before approving it. */
export type PendingChangeItemProps = {
  change: PendingChange;
  onApprove: (values?: ProfileFormValues) => Promise<ProfileMutationResult>;
  onReject: () => Promise<ProfileMutationResult>;
};

const ACTION_VERB: Record<PendingChange["action"], string> = { create: "add", update: "edit", delete: "delete" };

function getTitle(change: PendingChange): string {
  const config = profileTables[change.table];
  const values = change.action === "delete" ? change.current : change.values;
  return values ? config.describeRow(values) : "(already removed)";
}

function formatValue(field: ProfileField, value: string | undefined): string {
  if (!value) return "(empty)";
  return field.kind === "list" ? value.split("\n").join("; ") : value;
}

export default function PendingChangeItem({ change, onApprove, onReject }: PendingChangeItemProps) {
  const config = profileTables[change.table];
  const [isEditing, setIsEditing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const title = getTitle(change);
  const heading = `${ACTION_VERB[change.action]} ${config.itemLabel}`;
  const rowTitle = `${heading}: ${title}`;
  const isMissingRow = change.action !== "create" && change.current === null;

  const run = async (action: () => Promise<ProfileMutationResult>) => {
    setError(null);
    setIsBusy(true);
    const result = await action();
    setIsBusy(false);
    if (!result.ok) setError(result.error);
  };

  const handleEditedApprove = async (values: ProfileFormValues) => {
    const result = await onApprove(values);
    if (result.ok) setIsEditing(false);
    return result;
  };

  return (
    <li className="flex flex-col gap-2 border-t border-border pt-2 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-x-2 px-2">
        <span className="min-w-0 break-words">
          <span className="text-accent">{heading}</span>: {title}
        </span>
        {!isEditing && (
          <span className="ml-auto flex shrink-0">
            <button onClick={() => run(() => onApprove())} disabled={isBusy || isMissingRow} className={actionClass}>
              <RowActionLabel action="approve" rowTitle={rowTitle} />
            </button>
            {change.action !== "delete" && (
              <button onClick={() => setIsEditing(true)} disabled={isBusy || isMissingRow} className={actionClass}>
                <RowActionLabel action="edit" rowTitle={rowTitle} />
              </button>
            )}
            <button onClick={() => run(onReject)} disabled={isBusy} className={`${actionClass} hover:text-destructive`}>
              <RowActionLabel action="reject" rowTitle={rowTitle} />
            </button>
          </span>
        )}
      </div>

      {change.reason && <p className="px-2 text-xs text-muted">{change.reason}</p>}
      {isMissingRow && <p className="px-2 text-xs text-muted">The entry this changes no longer exists. Reject it.</p>}

      {isEditing ? (
        <ProfileRowForm
          fields={config.fields}
          initialValues={change.values}
          submitLabel="approve"
          onSubmit={handleEditedApprove}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <ChangeDetails change={change} />
      )}

      {error && <p role="alert" className="px-2 text-sm text-destructive">{error}</p>}
    </li>
  );
}

function ChangeDetails({ change }: { change: PendingChange }) {
  const { fields } = profileTables[change.table];
  if (change.action === "delete") return null;

  const rows =
    change.action === "create"
      ? fields.filter((field) => change.values[field.name]).map((field) => ({ field, before: null }))
      : fields
          .filter((field) => (change.values[field.name] ?? "") !== (change.current?.[field.name] ?? ""))
          .map((field) => ({ field, before: change.current?.[field.name] }));

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-2 text-xs">
      {rows.map(({ field, before }) => (
        <div key={field.name} className="contents">
          <dt className="text-muted">{field.label}</dt>
          <dd className="min-w-0 whitespace-pre-wrap break-words">
            {before !== null && (
              <>
                <del className="text-muted">{formatValue(field, before)}</del>
                <span className="text-muted" aria-hidden="true"> → </span>
                <span className="sr-only"> becomes </span>
              </>
            )}
            <ins className="no-underline">{formatValue(field, change.values[field.name])}</ins>
          </dd>
        </div>
      ))}
    </dl>
  );
}
