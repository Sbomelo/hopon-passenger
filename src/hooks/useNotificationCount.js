import { useEffect, useState } from 'react';
import { getNotifications } from '../api/hoponApi.js';
import { countUnread, getNotificationsSeenAt, NOTIFICATIONS_SEEN_EVENT } from '../utils/notifications.js';

export function useNotificationCount(token, enabled) {
    const [feed, setFeed] = useState({ token: null, items: [] });
    const [seenAt, setSeenAt] = useState(getNotificationsSeenAt);

    useEffect(() => {
        function updateSeen(event) { setSeenAt(event.detail); }
        function updateFromOtherTab(event) {
            if (event.key === 'hopon-notifications-seen-at') setSeenAt(event.newValue ?? '');
        }
        window.addEventListener(NOTIFICATIONS_SEEN_EVENT, updateSeen);
        window.addEventListener('storage', updateFromOtherTab);
        return () => {
            window.removeEventListener(NOTIFICATIONS_SEEN_EVENT, updateSeen);
            window.removeEventListener('storage', updateFromOtherTab);
        };
    }, []);

    useEffect(() => {
        if (!token || !enabled) return;
        let cancelled = false;
        let pending = false;
        async function refresh() {
            if (pending) return;
            pending = true;
            try {
                const items = await getNotifications(token);
                if (!cancelled) setFeed({ token, items });
            } catch {
                // Keep the last count; the feed page displays fetch errors.
            } finally { pending = false; }
        }
        refresh();
        const timer = window.setInterval(refresh, 30_000);
        // Ignore a late response as well as clearing the timer when leaving a screen.
        return () => { cancelled = true; window.clearInterval(timer); };
    }, [token, enabled]);

    return feed.token === token ? countUnread(feed.items, seenAt) : 0;
}
