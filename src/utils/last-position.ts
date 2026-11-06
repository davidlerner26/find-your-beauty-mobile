export type Position = { lat: number; lng: number };

// The last position is used right away (and a new one is only asked for when it is older than this)
export const FRESH_MS = 10 * 60_000;
// Older than this it is not used at all
export const STALE_MS = 24 * 60 * 60_000;

// Reads what was saved as the last position, or null when it is missing, malformed or too old
export const parseLastPosition = (
  text: string | null,
  now = Date.now(),
): { position: Position; at: number } | null => {
  try {
    const last = JSON.parse(text ?? 'null');
    const valid =
      typeof last?.position?.lat === 'number' &&
      typeof last.position.lng === 'number' &&
      typeof last.at === 'number' &&
      now - last.at < STALE_MS;
    return valid ? last : null;
  } catch {
    return null;
  }
};
