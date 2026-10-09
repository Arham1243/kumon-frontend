import cronstrue from 'cronstrue';

/**
 * Convert a standard 5-field cron expression into a human-readable description.
 *
 * Backed by the `cronstrue` library so every valid cron grammar (steps, ranges,
 * lists, mixed day-of-month + day-of-week, etc.) gets a proper English phrase
 * instead of falling back to the raw expression.
 *
 * The Laravel scheduler interprets hour/minute fields in `config('app.timezone')`,
 * which is locked to UTC for this app, so the clock times shown here are
 * already in UTC. We do not append a timezone suffix.
 *
 * Examples (verbatim cronstrue output in verbose mode):
 *   '* * * * *'        -> 'Every minute, every hour, every day'
 *   '*\/15 * * * *'    -> 'Every 15 minutes'
 *   '0 * * * *'        -> 'Every hour, every day'
 *   '0 0 * * *'        -> 'At 12:00 AM, every day'
 *   '0 9 * * 1-5'      -> 'At 09:00 AM, Monday through Friday'
 *   '6 * 6 1 1'        -> 'At 6 minutes past the hour, on day 6 of the month, only on Monday, only in January'
 *
 * Verbose mode is on so the description always names the recurrence (e.g.
 * "every day") instead of the terse "At 12:00 AM", which super-admins found
 * ambiguous when scanning the jobs list.
 *
 * @param {string|null|undefined} expression
 * @returns {string}
 */
export function describeCronExpression(expression) {
    if (typeof expression !== 'string' || expression.trim() === '') {
        return '-';
    }

    const trimmed = expression.trim();
    if (trimmed.split(/\s+/).length !== 5) {
        return trimmed;
    }

    try {
        return cronstrue.toString(trimmed, {
            use24HourTimeFormat: false,
            verbose: true,
            throwExceptionOnParseError: true
        });
    } catch {
        return trimmed;
    }
}
