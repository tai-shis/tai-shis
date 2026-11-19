function isDialogOpen(): boolean {
  return document.querySelector('[role="dialog"]') !== null;
}

export function shouldIgnoreShortcut(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return true;
  if (isDialogOpen()) return true;
  const target = e.target;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}
