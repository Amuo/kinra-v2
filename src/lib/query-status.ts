export function queryStatus(queries: { isPending: boolean; error: unknown }[]) {
  return {
    loading: queries.some((query) => query.isPending),
    error: queries.find((query) => query.error)?.error ?? null,
  };
}
