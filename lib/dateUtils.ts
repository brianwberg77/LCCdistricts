/**
 * dateUtils.ts
 *
 * IMPORTANT RULE:
 * All event timestamps are stored as "timestamp without time zone"
 * and represent literal Central Time (America/Chicago).
 *
 * We must NEVER allow JavaScript to auto-convert them.
 */

/**
 * Parse a timestamp string (YYYY-MM-DD HH:MM:SS or ISO-like)
 * as a literal Central Time local date.
 */
export function parseCentralTimestamp(ts: string): Date {
  // Normalize "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DDTHH:MM:SS"
  const normalized = ts.includes("T") ? ts : ts.replace(" ", "T");

  const [datePart, timePart] = normalized.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second = "0"] = timePart.split(":");

  return new Date(
    year,
    month - 1,
    day,
    Number(hour),
    Number(minute),
    Number(second)
  );
}

/**
 * Format an event date/time for display (Central Time, literal).
 */
export function formatEventDateTime(ts: string): string {
  const d = parseCentralTimestamp(ts);

  return d.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format just the date (no time).
 */
export function formatEventDate(ts: string): string {
  const d = parseCentralTimestamp(ts);

  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format just the time (e.g. "1:00 PM").
 */
export function formatEventTime(ts: string): string {
  const d = parseCentralTimestamp(ts);

  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format RSVP cutoff.
 */
export function formatRsvpCutoff(ts: string): string {
  const d = parseCentralTimestamp(ts);

  return d.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}