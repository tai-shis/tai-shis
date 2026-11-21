"use client";

import { useId, useRef, useState } from "react";
import { actionClass } from "@/app/components/auth/action-class";
import type { ProfileField, ProfileFormValues, ProfileMutationResult } from "@/app/lib/profile/tables";

/** `onSubmit` resolves with the save result. Field errors from it are shown inline. */
export type ProfileRowFormProps = {
  fields: ProfileField[];
  initialValues: ProfileFormValues;
  submitLabel: string;
  onSubmit: (values: ProfileFormValues) => Promise<ProfileMutationResult>;
  onCancel: () => void;
};

const inputClass = "w-full min-w-0 border border-border bg-transparent px-2 py-1 text-sm text-foreground";

function isWideField(field: ProfileField): boolean {
  return field.kind === "multiline" || field.kind === "list";
}

function getFieldPlacementClass(field: ProfileField): string {
  if (isWideField(field)) return "sm:col-span-2";
  return field.startsNewRow ? "sm:col-start-1" : "";
}

export default function ProfileRowForm({ fields, initialValues, submitLabel, onSubmit, onCancel }: ProfileRowFormProps) {
  const idPrefix = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(initialValues);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const hasRequiredField = fields.some((field) => field.isRequired);
  const getFieldId = (name: string) => `${idPrefix}-${name}`;

  const focusFirstInvalidField = (errors: Record<string, string>) => {
    const firstInvalid = fields.find((field) => errors[field.name]);
    if (firstInvalid) document.getElementById(getFieldId(firstInvalid.name))?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSaving(true);
    const result = await onSubmit(values);
    setIsSaving(false);
    if (result.ok) return;

    const errors = result.fieldErrors ?? {};
    if (Object.keys(errors).length === 0) {
      setFormError(result.error);
      return;
    }
    setFieldErrors(errors);
    focusFirstInvalidField(errors);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const isTextarea = e.target instanceof HTMLTextAreaElement;
    if (isTextarea && e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate className="flex flex-col gap-4 px-2">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <FormField
            key={field.name}
            id={getFieldId(field.name)}
            field={field}
            value={values[field.name] ?? ""}
            error={fieldErrors[field.name]}
            onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))}
          />
        ))}
      </div>
      {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {hasRequiredField && <p className="text-xs text-muted">* required</p>}
        <div className="ml-auto flex">
          <button type="button" onClick={onCancel} disabled={isSaving} className={actionClass}>[cancel]</button>
          <button type="submit" disabled={isSaving} className={actionClass}>[{submitLabel}]</button>
        </div>
      </div>
    </form>
  );
}

type FormFieldProps = {
  id: string;
  field: ProfileField;
  value: string;
  error: string | undefined;
  onChange: (value: string) => void;
};

function getFieldHint(field: ProfileField): string | null {
  if (field.kind === "list") return "One per line.";
  return null;
}

const PLACEHOLDER_BY_KIND: Partial<Record<ProfileField["kind"], string>> = {
  url: "https://",
  month: "MM-YYYY",
};

function FormField({ id, field, value, error, onChange }: FormFieldProps) {
  const hint = getFieldHint(field);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;
  const controlProps = {
    id,
    name: field.name,
    value,
    required: field.isRequired,
    autoComplete: "off",
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  };

  return (
    <div className={`flex flex-col gap-1 ${getFieldPlacementClass(field)}`}>
      <label htmlFor={id} className="text-sm text-muted">
        {field.label}
        {field.isRequired && <span aria-hidden="true"> *</span>}
      </label>
      {isWideField(field) ? (
        <textarea
          {...controlProps}
          rows={field.kind === "list" ? 4 : 3}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} resize-y`}
        />
      ) : (
        <input
          {...controlProps}
          type={field.kind === "url" ? "url" : "text"}
          inputMode={field.kind === "month" ? "numeric" : undefined}
          spellCheck={field.kind === "url" ? false : undefined}
          placeholder={PLACEHOLDER_BY_KIND[field.kind]}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
      {hint && <p id={hintId} className="text-xs text-muted">{hint}</p>}
      {error && <p id={errorId} className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
