// Same as the server: the same visitor counts once in this time for each professional
export const VIEW_WINDOW_MS = 6 * 3600_000;

// Has this device counted a visit to the professional lately? Records it when it has not.
export const shouldCountView = (
  stored: Record<string, number>,
  id: string,
  now = Date.now(),
): { count: boolean; stored: Record<string, number> } => {
  if (now - (stored[id] ?? 0) < VIEW_WINDOW_MS) return { count: false, stored };
  // The old ones leave, so the list does not grow forever
  const recent = Object.fromEntries(
    Object.entries(stored).filter(([, at]) => now - at < VIEW_WINDOW_MS),
  );
  return { count: true, stored: { ...recent, [id]: now } };
};
