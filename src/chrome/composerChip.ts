/** Shared chip styling for composer toolbar pickers on elevated backgrounds. */
export function composerChipClass(
  elevated: string | undefined,
  open: boolean,
  active = false,
) {
  if (!elevated) {
    if (active) return "bg-content/20 text-content";
    return open
      ? "bg-content/10 text-content"
      : "bg-content/10 text-content hover:bg-content/15";
  }
  return `session-composer-chip${open || active ? " session-composer-chip-open" : ""}`;
}

export function composerChipMutedClass(elevated: string | undefined) {
  return elevated ? "session-composer-chip-muted" : "text-content/50";
}
