/**
 * Daily meditation reminder + streak, without accounts.
 *
 * A browser can't wake itself up to notify someone while the site is closed, so the reminder
 * lives in the user's own calendar (Google link or an .ics file for Apple/Outlook): one daily
 * event with an alert. The streak is stored only on this device (localStorage).
 *
 * Pure functions take `now` so they can be tested; storage helpers swallow errors because
 * localStorage can be unavailable (private mode, blocked site data).
 */

export const DEFAULT_REMINDER_TIME = '20:00';
/** A session counts once this much of a meditation has been watched (or it reached the end). */
export const MEDITATION_COUNTS_AFTER_SECONDS = 60;

const DAYS_KEY = 'meditation_days_v1';
const REMINDER_KEY = 'meditation_reminder_v1';
const EVENT_MINUTES = 15;
const EVENT_TITLE = '🌿 Meditation moment'; // neutral on a lock screen: no mention of grief
const EVENT_DETAILS = 'A few quiet minutes, just for you. Choose a guided meditation:';

export interface SavedReminder {
  time: string; // "HH:MM", 24h, local time
  via: 'google' | 'ics';
  addedAt: string; // ISO timestamp
}

// ── Dates ────────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

/** "YYYY-MM-DD" in the user's local time zone. */
export function localDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse "HH:MM" (24h). Falls back to the default for anything malformed. */
export function parseTime(time: string): { hours: number; minutes: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  const hours = m ? Number(m[1]) : NaN;
  const minutes = m ? Number(m[2]) : NaN;
  if (!m || hours > 23 || minutes > 59) return parseTime(DEFAULT_REMINDER_TIME);
  return { hours, minutes };
}

/** The next time the reminder would fire: today if still ahead, otherwise tomorrow. */
export function nextOccurrence(time: string, now: Date = new Date()): Date {
  const { hours, minutes } = parseTime(time);
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next;
}

/** True when today's reminder time has already passed. */
export function isPastReminderTime(time: string, now: Date = new Date()): boolean {
  const { hours, minutes } = parseTime(time);
  return now.getHours() * 60 + now.getMinutes() >= hours * 60 + minutes;
}

/** "20:00" → "8:00 PM" (or the user's locale format). */
export function formatTime(time: string, locale?: string): string {
  const { hours, minutes } = parseTime(time);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

// ── Streak ───────────────────────────────────────────────────────────────────

/**
 * Consecutive days with a meditation, ending today, or ending yesterday if today isn't done
 * yet (so the streak doesn't look broken in the morning).
 */
export function computeStreak(days: string[], now: Date = new Date()): { streak: number; doneToday: boolean } {
  const set = new Set(days);
  const doneToday = set.has(localDateKey(now));
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!doneToday) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (set.has(localDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { streak, doneToday };
}

export function loadMeditationDays(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(DAYS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((d) => typeof d === 'string') : [];
  } catch {
    return [];
  }
}

/** Mark today as meditated. Returns the updated list (unchanged if already marked). */
export function recordMeditationToday(now: Date = new Date()): string[] {
  const days = loadMeditationDays();
  const today = localDateKey(now);
  if (days.includes(today)) return days;
  const updated = [...days, today].sort().slice(-400); // a bit over a year is plenty
  try {
    localStorage.setItem(DAYS_KEY, JSON.stringify(updated));
  } catch {
    /* storage unavailable: the streak just won't persist */
  }
  return updated;
}

export function loadReminder(): SavedReminder | null {
  try {
    const r = JSON.parse(localStorage.getItem(REMINDER_KEY) || 'null');
    return r && typeof r.time === 'string' ? (r as SavedReminder) : null;
  } catch {
    return null;
  }
}

export function saveReminder(reminder: SavedReminder): void {
  try {
    localStorage.setItem(REMINDER_KEY, JSON.stringify(reminder));
  } catch {
    /* ignore */
  }
}

// ── Calendar ─────────────────────────────────────────────────────────────────

/** Local "floating" date-time for calendars: 20261122T200000 */
const calendarLocal = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

const calendarUtc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

/** Escape text for an .ics property value (RFC 5545). */
const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

/**
 * A daily repeating event with an alert at the start time. Times are "floating" (no time zone),
 * which calendars read as the device's local time, so 20:00 stays 20:00 wherever the user is.
 */
export function buildIcs(time: string, pageUrl: string, now: Date = new Date()): string {
  const start = nextOccurrence(time, now);
  const end = new Date(start.getTime() + EVENT_MINUTES * 60 * 1000);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Grief Literacy//Meditation Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:meditation-reminder-${now.getTime()}@grief-literacy`,
    `DTSTAMP:${calendarUtc(now)}`,
    `DTSTART:${calendarLocal(start)}`,
    `DTEND:${calendarLocal(end)}`,
    'RRULE:FREQ=DAILY',
    `SUMMARY:${icsText(EVENT_TITLE)}`,
    `DESCRIPTION:${icsText(`${EVENT_DETAILS} ${pageUrl}`)}`,
    `URL:${pageUrl}`,
    'TRANSP:TRANSPARENT', // don't show the user as busy
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(EVENT_TITLE)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

/** Google Calendar "create event" link for the same daily event, in the user's time zone. */
export function googleCalendarUrl(time: string, pageUrl: string, now: Date = new Date(), timeZone?: string): string {
  const start = nextOccurrence(time, now);
  const end = new Date(start.getTime() + EVENT_MINUTES * 60 * 1000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: EVENT_TITLE,
    details: `${EVENT_DETAILS} ${pageUrl}`,
    dates: `${calendarLocal(start)}/${calendarLocal(end)}`,
    recur: 'RRULE:FREQ=DAILY',
  });
  const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (tz) params.set('ctz', tz);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
