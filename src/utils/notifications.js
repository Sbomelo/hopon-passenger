const seenKey = 'hopon-notifications-seen-at';
export const NOTIFICATIONS_SEEN_EVENT = 'hopon:notifications-seen';

export function getNotificationsSeenAt() {
    try {
        return localStorage.getItem(seenKey) ?? '';
    } catch {
        return '';
    }
}

export function markNotificationsSeen(value) {
    try {
        localStorage.setItem(seenKey, value);
    } catch {
        // Reading the feed still works without persistent storage.
    }
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_SEEN_EVENT, { detail: value }));
}

export function countUnread(notifications, seenAt) {
    const cutoff = Date.parse(seenAt) || 0;
    return notifications.filter(item => Date.parse(item.createdAt) > cutoff).length;
}
