const timeZone = 'Africa/Johannesburg';

export function formatTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString('en-ZA', { timeZone, hour: '2-digit', minute: '2-digit' });
}

export function formatDate(value, includeYear = false) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-ZA', {
        timeZone, weekday: 'short', day: 'numeric', month: 'short',
        ...(includeYear ? { year: 'numeric' } : {}),
    });
}
