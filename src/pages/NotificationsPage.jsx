import { useEffect, useState } from 'react';
import { getMyTrips, getNotifications } from '../api/hoponApi.js';
import AppHeader from '../components/AppHeader.jsx';
import { formatDateTime, formatRelativeTime } from '../utils/format.js';
import { markNotificationsSeen } from '../utils/notifications.js';

export default function NotificationsPage({ token, profile, onNavigate, onLogout }) {
    const [notifications, setNotifications] = useState([]);
    const [routes, setRoutes] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let cancelled = false;
        // A notification arriving during this request stays unread on the next poll.
        const openedAt = new Date().toISOString();
        async function load() {
            try {
                const items = await getNotifications(token);
                if (cancelled) return;
                setNotifications([...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
                markNotificationsSeen(openedAt);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        // Route names are optional; a failed trip lookup must not hide the feed.
        getMyTrips(token).then(data => {
            if (!cancelled) setRoutes(Object.fromEntries([...data.liveTrips, ...data.pastTrips].map(trip => [trip.tripId, trip.routeName])));
        }).catch(() => {});
        return () => { cancelled = true; };
    }, [token, attempt]);

    function retry() { setError(''); setLoading(true); setAttempt(attempt + 1); }

    return (
        <div className="passenger-page">
            <AppHeader title="Notifications" onBack={() => onNavigate('dashboard')}
                profile={profile} onNavigate={onNavigate} onLogout={onLogout} />
            <main className="page-content">
                {loading && <p role="status">Loading notifications…</p>}
                {error && <div role="alert"><p className="error-text">{error}</p><button className="hopon-btn" onClick={retry}>Try again</button></div>}
                {!loading && !error && (notifications.length === 0
                    ? <p className="section-card">No notifications yet. Your trip updates will appear here.</p>
                    : <ul className="notification-list">{notifications.map(item => (
                        <li key={item.id} className="section-card notification-item">
                            <span aria-hidden="true" className="notification-icon">{notificationIcon(item.type)}</span>
                            <div>
                                <strong>{notificationLabel(item.type)}</strong>
                                {(item.routeName || routes[item.tripId]) && <p className="muted">{item.routeName || routes[item.tripId]}</p>}
                                <p>{item.message}</p>
                                <p className="muted">{item.channel} · {item.status}</p>
                                <time dateTime={item.createdAt}>{formatRelativeTime(item.createdAt)} · {formatDateTime(item.createdAt)}</time>
                            </div>
                        </li>
                    ))}</ul>)}
            </main>
        </div>
    );
}

function notificationIcon(type) {
    return type === 'Emergency' ? '☎' : type === 'Delay' ? '◷' : type === 'Arrival' ? '⚑' : type === 'Cancellation' ? '×' : '♢';
}

function notificationLabel(type) {
    const labels = { FourHoursBefore: '4-hour reminder', TwoHoursBefore: '2-hour reminder',
        ThirtyMinutesBefore: '30-minute reminder', TenMinutesBefore: 'Get ready to get off',
        Arrival: 'Arrival', Delay: 'Trip delayed', Emergency: 'Emergency contact alert', Cancellation: 'Trip cancelled' };
    return labels[type] ?? 'Trip update';
}
