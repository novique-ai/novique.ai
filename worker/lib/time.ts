export function currentMonday(now = new Date()): string {
  const localDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const noonUtc = new Date(`${localDate}T12:00:00Z`);
  const daysSinceMonday = (noonUtc.getUTCDay() + 6) % 7;
  noonUtc.setUTCDate(noonUtc.getUTCDate() - daysSinceMonday);
  return noonUtc.toISOString().slice(0, 10);
}

export function isMonday(now = new Date()): boolean {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
  }).format(now) === 'Mon';
}
