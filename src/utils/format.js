const timeZone = 'Africa/Johannesburg';

export function formatDateTime(value) {
    if (!value || Number.isNaN(Date.parse(value))) return '—';
    return `${formatDate(value, true)} · ${formatTime(value)} SAST`;
}

export function formatRelativeTime(value, now = Date.now()) {
    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) return '—';
    const minutes = Math.max(0, Math.floor((now - timestamp) / 60_000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

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
