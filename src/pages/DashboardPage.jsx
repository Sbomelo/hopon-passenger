import { useState, useEffect } from 'react';
import { getMyTrips } from '../api/hoponApi.js';
import { formatTime, formatDate } from '../utils/format.js';
import AppHeader from '../components/AppHeader.jsx';
import EmergencyArrivalFeed from '../components/EmergencyArrivalFeed.jsx';


export default function DashboardPage({ token, onLogout, onNavigate, onOpenTrip, onOpenHistory, unreadCount }) {
    const [liveTrips, setLiveTrips] = useState([]);
    const [pastTrips, setPastTrips] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');

    useEffect(() => {
        async function load() {
            try {
                const data = await getMyTrips(token);
                setLiveTrips(data.liveTrips);
                setPastTrips(data.pastTrips);
            } catch (err) {
                setError(err.message ?? 'Failed to load your trips.');
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [token]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <p style={{ opacity: 0.6 }}>Loading your trips…</p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>

            <AppHeader title="Hopon" subtitle="My trips" unreadCount={unreadCount} onNotifications={() => onNavigate('notifications')} onNavigate={onNavigate} onLogout={onLogout} />

            <div style={{ flex: 1, padding: '1.25rem 1rem', maxWidth: '600px', width: '100%', margin: '0 auto' }}>

                <EmergencyArrivalFeed token={token} />

                {error && (
                    <p style={{ color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '0.88rem' }}>
                        {error}
                    </p>
                )}

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        opacity: 0.5,
                        marginBottom: '0.75rem',
                        textTransform: 'uppercase'
                    }}>
                        Active trips
                    </h2>

                    {liveTrips.length === 0 ? (
                        <div style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '12px',
                            padding: '1.75rem',
                            textAlign: 'center',
                            opacity: 0.55,
                            fontSize: '0.9rem'
                        }}>
                            No active trips right now.
                        </div>
                    ) : (
                        liveTrips.map(trip => (
                            <LiveTripCard
                                key={trip.tripId}
                                trip={trip}
                                onOpenMap={() => onOpenTrip(trip.tripId)}
                            />
                        ))
                    )}
                </section>

                {pastTrips.length > 0 && (
                    <section>
                        <h2 style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            opacity: 0.5,
                            marginBottom: '0.75rem',
                            textTransform: 'uppercase'
                        }}>
                            Past trips
                        </h2>
                        {pastTrips.map(trip => (
                            <PastTripCard key={trip.tripId} trip={trip} onOpen={() => onOpenHistory(trip.tripId)} />
                        ))}
                    </section>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const color =
        status === 'Delayed'    ? 'var(--color-danger)'      :
        status === 'Completed'  ? 'var(--color-success)'     :
        status === 'Cancelled'  ? 'var(--color-danger)'      :
        status === 'InProgress' ? 'var(--color-interactive)' :
                                  'var(--color-text)';

    const label = status === 'InProgress' ? 'In Progress' : status;

    return (
        <span style={{
            background: 'var(--color-surface-alt)',
            border: '1px solid var(--color-border)',
            borderRadius: '999px',
            padding: '0.15rem 0.6rem',
            fontSize: '0.72rem',
            fontWeight: 600,
            color,
            whiteSpace: 'nowrap',
            flexShrink: 0
        }}>
            {label}
        </span>
    );
}

function LiveTripCard({ trip, onOpenMap }) {
    const etaColor = trip.status === 'Delayed' ? 'var(--color-danger)' : 'var(--color-interactive)';

    return (
        <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '14px',
            padding: '1rem 1.1rem',
            marginBottom: '0.75rem'
        }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)', marginRight: '0.5rem' }}>
                    {trip.routeName}
                </span>
                <StatusBadge status={trip.status} />
            </div>

            <div style={{ fontSize: '0.77rem', opacity: 0.5, marginBottom: '0.85rem' }}>
                {formatDate(trip.tripDate)} &nbsp;·&nbsp; {trip.ticketReference}
            </div>

            <div style={{
                display: 'flex',
                gap: '0.5rem',
                background: 'var(--color-surface-alt)',
                borderRadius: '10px',
                padding: '0.65rem 0.8rem',
                marginBottom: '0.85rem'
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '0.2rem', letterSpacing: '0.05em' }}>
                        DEPARTS
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {formatTime(trip.scheduledDeparture)}
                    </div>
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '0.2rem', letterSpacing: '0.05em' }}>
                        SCHEDULED
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {formatTime(trip.scheduledArrival)}
                    </div>
                </div>

                {trip.estimatedArrival && (
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '0.2rem', letterSpacing: '0.05em' }}>
                            {trip.isEstimate ? 'ETA' : 'ARRIVED'}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: etaColor }}>
                            {formatTime(trip.estimatedArrival)}
                        </div>
                    </div>
                )}
            </div>

            <p className="your-stop">Your stop: {trip.destinationStopName || '—'} · ETA {formatTime(trip.destinationEstimatedArrival)} SAST</p>

            {/* Track button */}
            <button
                onClick={onOpenMap}
                className="hopon-btn"
                style={{ padding: '0.65rem', fontSize: '0.875rem' }}
            >
                🗺️ &nbsp;Track on map
            </button>
        </div>
    );
}

function PastTripCard({ trip, onOpen }) {
    return (
        <button type="button" className="past-trip-button" onClick={onOpen} aria-label={`View history for ${trip.routeName}, ticket ${trip.ticketReference}`} style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            marginBottom: '0.6rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '0.75rem'
        }}>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem', color: 'var(--color-text)' }}>
                    {trip.routeName}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.55 }}>
                    {formatDate(trip.tripDate, true)}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.45, marginTop: '0.1rem' }}>
                    {formatTime(trip.scheduledDeparture)} → {formatTime(trip.scheduledArrival)}
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.35, marginTop: '0.1rem', fontFamily: 'monospace' }}>
                    {trip.ticketReference}
                </div>
            </div>
            <StatusBadge status={trip.status} />
        </button>
    );
}
