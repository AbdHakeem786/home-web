const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Clamps client-supplied page/limit query params so list endpoints can't be asked to return unbounded data. */
export function parsePagination(query: Record<string, unknown>): { page: number; limit: number } {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT));
  return { page, limit };
}
