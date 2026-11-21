"use client";

import { useState } from "react";
import { actionClass } from "@/app/components/auth/action-class";
import ProfileRowForm from "@/app/components/admin/profile/profile-row-form";
import RowActionLabel from "@/app/components/admin/row-action-label";
import type {
  ProfileFormValues,
  ProfileMutationResult,
  ProfileRow,
  ProfileTableConfig,
} from "@/app/lib/profile/tables";

/** Each action resolves with its save result. A failed result's error is shown under the row. */
export type ProfileRowItemProps = {
  row: ProfileRow;
  config: ProfileTableConfig;
  onUpdate: (values: ProfileFormValues) => Promise<ProfileMutationResult>;
  onDelete: () => Promise<ProfileMutationResult>;
  onSetVisibility: (visible: boolean) => Promise<ProfileMutationResult>;
};

type RowMode = "viewing" | "editing" | "confirmingDelete";

/** A private row stays in the profile but the public chat never sees it. [hide] only folds away the details here. */
export default function ProfileRowItem({ row, config, onUpdate, onDelete, onSetVisibility }: ProfileRowItemProps) {
  const [mode, setMode] = useState<RowMode>("viewing");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const title = config.describeRow(row.values);

  const runRowAction = async (action: () => Promise<ProfileMutationResult>) => {
    setError(null);
    setIsBusy(true);
    const result = await action();
    setIsBusy(false);
    setMode("viewing");
    if (!result.ok) setError(result.error);
  };

  const handleUpdate = async (values: ProfileFormValues) => {
    const result = await onUpdate(values);
    if (result.ok) setMode("viewing");
    return result;
  };

  const startEditing = () => {
    setError(null);
    setMode("editing");
  };

  return (
    // rounded-none! overrides the global 8px radius, which bends the ends of a top-only border.
    <li className="flex flex-col gap-2 border-t border-border rounded-none! pt-2 first:border-t-0 first:pt-0">
      {/* On narrow screens the buttons wrap under the title instead of squeezing it away. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2">
        <span className={`min-w-0 max-w-full truncate ${row.visible ? "text-foreground" : "text-muted"}`}>
          {/* First, so truncating a long title can't cut it off. */}
          {!row.visible && <span className="text-muted">(private) </span>}
          {title}
        </span>
        <span className="ml-auto flex shrink-0 flex-wrap">
          {mode === "viewing" && (
            <>
              <button onClick={() => setIsCollapsed(!isCollapsed)} aria-expanded={!isCollapsed} className={actionClass}>
                <RowActionLabel action={isCollapsed ? "show" : "hide"} rowTitle={title} />
              </button>
              <button onClick={() => runRowAction(() => onSetVisibility(!row.visible))} disabled={isBusy} className={actionClass}>
                <RowActionLabel action={row.visible ? "private" : "public"} rowTitle={title} />
              </button>
              <button onClick={startEditing} disabled={isBusy} className={actionClass}>
                <RowActionLabel action="edit" rowTitle={title} />
              </button>
              <button onClick={() => setMode("confirmingDelete")} disabled={isBusy} className={actionClass}>
                <RowActionLabel action="delete" rowTitle={title} />
              </button>
            </>
          )}
          {mode === "confirmingDelete" && (
            <>
              <button onClick={() => runRowAction(onDelete)} disabled={isBusy} className={`${actionClass} hover:text-destructive`}>
                [delete {config.itemLabel}]
              </button>
              <button onClick={() => setMode("viewing")} disabled={isBusy} className={actionClass}>[cancel]</button>
            </>
          )}
        </span>
      </div>
      {mode === "editing" ? (
        <ProfileRowForm
          fields={config.fields}
          initialValues={row.values}
          submitLabel="save"
          onSubmit={handleUpdate}
          onCancel={() => setMode("viewing")}
        />
      ) : (
        !isCollapsed && <RowDetails row={row} config={config} />
      )}
      {error && <p role="alert" className="text-sm text-destructive px-2">{error}</p>}
    </li>
  );
}

/** Every filled field, so a row can be read in full without opening the form. */
function RowDetails({ row, config }: { row: ProfileRow; config: ProfileTableConfig }) {
  const fields = config.fields.filter((field) => row.values[field.name]?.trim());
  if (fields.length === 0) return null;
  return (
    <dl className={`grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-2 text-xs ${row.visible ? "" : "text-muted"}`}>
      {fields.map((field) => {
        const value = row.values[field.name];
        return (
          <div key={field.name} className="contents">
            <dt className="text-muted">{field.label}</dt>
            <dd className="min-w-0 break-words">
              {field.kind === "list" ? (
                <ul className="flex flex-col">
                  {value.split("\n").filter((item) => item.trim()).map((item, i) => (
                    <li key={i}>
                      <span className="text-muted" aria-hidden="true">- </span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="whitespace-pre-wrap">{value}</span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
