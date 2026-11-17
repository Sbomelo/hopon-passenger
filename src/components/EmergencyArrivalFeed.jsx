import { useEffect, useState } from 'react';
import { getNotifications } from '../api/hoponApi.js';
import { formatDate, formatTime } from '../utils/format.js';

export default function EmergencyArrivalFeed({ token }) {
    const [notifications, setNotifications] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        async function load() {
            try {
                const data = await getNotifications(token);
                if (active) {
                    setNotifications(data.filter(item => item.type === 'Emergency'));
                    setError('');
                }
            } catch {
                if (active) setError('Could not load emergency contact alerts.');
            }
        }
        load();
        const timer = setInterval(load, 30000);
        return () => { active = false; clearInterval(timer); };
    }, [token]);

    return (
        <section aria-labelledby="emergency-alerts-title" style={{ marginBottom: '2rem' }}>
            <h2 id="emergency-alerts-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
                Emergency contact alerts
            </h2>
            {error && <p role="status" style={{ color: 'var(--color-danger)' }}>{error}</p>}
            {!error && notifications.length === 0 && <p>No arrival alerts yet.</p>}
            <ul style={{ listStyle: 'none', display: 'grid', gap: '0.75rem' }}>
                {notifications.map(item => (
                    <li key={item.id} style={{
                        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                        borderRadius: '12px', padding: '1rem', overflowWrap: 'anywhere'
                    }}>
                        <p>{item.message}</p>
                        <p style={{ fontSize: '0.8rem', marginTop: '0.4rem', color: item.status === 'Failed'
                            ? 'var(--color-danger)' : 'var(--color-text)' }}>
                            {item.status} · {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
                        </p>
                    </li>
                ))}
            </ul>
        </section>
    );
}
