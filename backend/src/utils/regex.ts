/** Escapes regex special characters so user-supplied search input can't build unintended (or ReDoS-prone) patterns. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
