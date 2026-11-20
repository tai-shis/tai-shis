"use client";

import { useState } from "react";
import { actionClass } from "@/app/components/auth/action-class";
import ProfileRowForm from "@/app/components/admin/profile/profile-row-form";
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

export default function ProfileRowItem({ row, config, onUpdate, onDelete, onSetVisibility }: ProfileRowItemProps) {
  const [mode, setMode] = useState<RowMode>("viewing");
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
    <li className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-2">
        <span className={`min-w-0 truncate ${row.visible ? "text-foreground" : "text-muted"}`}>{title}</span>
        {!row.visible && <span className="shrink-0 text-muted">(hidden)</span>}
        <span className="ml-auto flex shrink-0">
          {mode === "viewing" && (
            <>
              <button onClick={() => runRowAction(() => onSetVisibility(!row.visible))} disabled={isBusy} className={actionClass}>
                <RowActionLabel action={row.visible ? "hide" : "show"} rowTitle={title} />
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
      {mode === "editing" && (
        <ProfileRowForm
          fields={config.fields}
          initialValues={row.values}
          submitLabel="save"
          onSubmit={handleUpdate}
          onCancel={() => setMode("viewing")}
        />
      )}
      {error && <p role="alert" className="text-sm text-destructive px-2">{error}</p>}
    </li>
  );
}

// One wrapping span keeps the label a single flex item, so the button's gap never splits it.
function RowActionLabel({ action, rowTitle }: { action: string; rowTitle: string }) {
  return (
    <span>
      [{action}<span className="sr-only"> {rowTitle}</span>]
    </span>
  );
}
