import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarPlus, CheckCircle2, Download, Flame } from 'lucide-react';
import {
  DEFAULT_REMINDER_TIME,
  buildIcs,
  computeStreak,
  formatTime,
  googleCalendarUrl,
  isPastReminderTime,
  loadReminder,
  saveReminder,
  type SavedReminder,
} from '@/lib/meditationReminder';

interface DailyReminderCardProps {
  /** Local "YYYY-MM-DD" days with a meditation (owned by the page, which records sessions). */
  meditationDays: string[];
}

/**
 * Daily reminder that lives in the user's own calendar (no account, works on every phone),
 * plus an on-device streak and a gentle "not yet today" nudge.
 */
export function DailyReminderCard({ meditationDays }: DailyReminderCardProps) {
  const [saved, setSaved] = React.useState<SavedReminder | null>(() => loadReminder());
  const [time, setTime] = React.useState(saved?.time ?? DEFAULT_REMINDER_TIME);
  const [now, setNow] = React.useState(() => new Date());

  // Refresh once a minute so "not yet today" / the streak roll over at the right moment.
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const { streak, doneToday } = computeStreak(meditationDays, now);
  const pageUrl = `${window.location.origin}/tools/meditation`;
  const timeChanged = saved !== null && saved.time !== time;

  const remember = (via: SavedReminder['via']) => {
    const reminder: SavedReminder = { time, via, addedAt: new Date().toISOString() };
    saveReminder(reminder);
    setSaved(reminder);
  };

  const addToGoogle = () => {
    window.open(googleCalendarUrl(time, pageUrl, new Date()), '_blank', 'noopener,noreferrer');
    remember('google');
  };

  const downloadIcs = () => {
    const blob = new Blob([buildIcs(time, pageUrl, new Date())], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meditation-reminder.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    remember('ics');
  };

  const nudge =
    !doneToday && saved && isPastReminderTime(saved.time, now)
      ? `Your ${formatTime(saved.time)} moment is waiting whenever you're ready.`
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Meditation Reminder</CardTitle>
        <CardDescription>
          Add a gentle daily reminder to your own calendar. No account needed, and you can change or remove it
          there anytime.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Today + streak */}
        <div className="flex flex-wrap items-center gap-2 text-sm" aria-live="polite">
          {doneToday ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 font-medium text-green-800 dark:bg-green-900/40 dark:text-green-200">
              <CheckCircle2 className="h-4 w-4" /> Done today
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 font-medium text-purple-800 dark:bg-purple-900/40 dark:text-purple-200">
              Not yet today
            </span>
          )}
          {streak > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 font-medium text-orange-800 dark:bg-orange-900/40 dark:text-orange-200">
              <Flame className="h-4 w-4" /> {streak}-day streak
            </span>
          )}
        </div>
        {nudge && <p className="text-sm text-gray-700 dark:text-gray-300">{nudge}</p>}

        {/* Time + calendar buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="meditation-reminder-time">Remind me every day at</Label>
            <Input
              id="meditation-reminder-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value || DEFAULT_REMINDER_TIME)}
              className="w-36"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={addToGoogle} className="gap-2">
              <CalendarPlus className="h-4 w-4" /> Google Calendar
            </Button>
            <Button variant="outline" onClick={downloadIcs} className="gap-2">
              <Download className="h-4 w-4" /> Apple / Outlook (.ics)
            </Button>
          </div>
        </div>

        {saved && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {timeChanged ? (
              <>
                You added a reminder for <strong>{formatTime(saved.time)}</strong>. To switch to{' '}
                {formatTime(time)}, add the new one and delete the old event in your calendar.
              </>
            ) : (
              <>
                ✓ Reminder added for <strong>{formatTime(saved.time)}</strong> each day. To change or stop it, edit the
                “Meditation moment” event in your calendar app.
              </>
            )}
          </p>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Your streak counts a day once you've listened for a minute or finished a meditation. It's saved only on
          this device.
        </p>
      </CardContent>
    </Card>
  );
}
