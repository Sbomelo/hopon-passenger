import { useEffect, useState } from 'react';
import { getTripHistory } from '../api/hoponApi.js';
import { formatDateTime } from '../utils/format.js';
import AppHeader from '../components/AppHeader.jsx';

export default function TripHistoryPage({ tripId, token, onNavigate, onLogout }) {
    const [history, setHistory] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let cancelled = false;
        getTripHistory(tripId, token).then(data => {
            if (!cancelled) setHistory(data);
        }).catch(err => {
            if (!cancelled) setError(err.message);
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tripId, token, attempt]);

    return (
        <div className="passenger-page">
            <AppHeader title="Trip history" onBack={() => onNavigate('dashboard')}
                onNavigate={onNavigate} onLogout={onLogout} onNotifications={() => onNavigate('notifications')} />
            <main className="page-content">
                {loading && <p role="status">Loading trip history…</p>}
                {error && <div role="alert"><p className="error-text">{error}</p>
                    <button className="hopon-btn" onClick={() => { setError(''); setLoading(true); setAttempt(attempt + 1); }}>Try again</button></div>}
                {!loading && !error && history && <>
                    <section className="section-card">
                        <h2>{history.routeName}</h2>
                        <p>{history.status} · {history.ticketReference} · Seat {history.seatNumber || '—'}</p>
                        <p>Your stop: {history.destinationStopName || '—'}</p>
                        <ScheduleTimes scheduledArrival={history.scheduledArrival} actualArrival={history.actualArrival}
                            scheduledDeparture={history.scheduledDeparture} actualDeparture={history.actualDeparture} />
                        <p>Boarded: {formatDateTime(history.boardedAt)}</p>
                        <p>Left the bus: {formatDateTime(history.alightedAt)}</p>
                    </section>
                    <section className="section-card">
                        <h2>Stops</h2>
                        {history.stops.length === 0 && <p>No stops recorded for this trip.</p>}
                        <ol className="stops-timeline">
                            {[...history.stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder).map(stop => (
                                <li key={stop.sequenceOrder} className={stop.status === 'Arrived' ? 'stop-arrived' : stop.status === 'Departed' ? 'stop-visited' : ''}>
                                    <h3>{stop.stopName}</h3><p className="muted">{stop.status}</p>
                                    <ScheduleTimes {...stop} />
                                </li>
                            ))}
                        </ol>
                    </section>
                </>}
            </main>
        </div>
    );
}

function ScheduleTimes({ scheduledDeparture, actualDeparture, scheduledArrival, actualArrival }) {
    return <dl className="schedule-times">
        <div><dt>Scheduled departure</dt><dd>{formatDateTime(scheduledDeparture)}</dd></div>
        <div><dt>Actual departure</dt><dd>{formatDateTime(actualDeparture)}</dd></div>
        <div><dt>Scheduled arrival</dt><dd>{formatDateTime(scheduledArrival)}</dd></div>
        <div><dt>Actual arrival</dt><dd>{formatDateTime(actualArrival)}</dd></div>
    </dl>;
}
