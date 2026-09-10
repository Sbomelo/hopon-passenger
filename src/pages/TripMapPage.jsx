import { useState, useEffect } from 'react';
import { getMyTrips, getMapData } from '../api/hoponApi.js';
import { useSignalR } from '../hooks/useSignalR.js';
import TripMap from '../components/TripMap.jsx';

export default function TripMapPage({ token, onLogout, onNavigate, tripId: tripIdProp }) {
    const [mapData,      setMapData]      = useState(null);
    const [busPosition,  setBusPosition]  = useState(null);
    const [tripStatus,   setTripStatus]   = useState('');
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState('');

    useEffect(() => {
        async function load() {
            try {
                let resolvedTripId = tripIdProp;

                if (!resolvedTripId) {
                    
                    const { liveTrips } = await getMyTrips(token);
                    if (liveTrips.length === 0) {
                        setError('No active trips found for your ticket.');
                        return;
                    }
                    resolvedTripId = liveTrips[0].tripId;
                }

                const data = await getMapData(resolvedTripId, token);
                setMapData(data);
                setTripStatus(data.status);

                if (data.lastKnownLocation) {
                    setBusPosition(data.lastKnownLocation);
                }
            } catch (err) {
                setError(err.message ?? 'Failed to load trip data.');
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [token, tripIdProp]);  

    useSignalR(
        mapData?.tripId,
        token,
        (locationData) => {
            setBusPosition({
                latitude:   locationData.latitude,
                longitude:  locationData.longitude,
                recordedAt: locationData.recordedAt
            });
        },
        (statusData) => {
            setTripStatus(statusData.status);
        }
    );

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next    = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('hopon-theme', next);
    }

    useEffect(() => {
        const saved = localStorage.getItem('hopon-theme');
        if (saved) document.documentElement.setAttribute('data-theme', saved);
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <p style={{ opacity: 0.6 }}>Loading your trip…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', padding: '2rem' }}>
                <p style={{ color: 'var(--color-danger)', textAlign: 'center' }}>{error}</p>
                <button
                    className="hopon-btn"
                    style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
                    onClick={() => onNavigate('dashboard')}
                >
                    Back to my trips
                </button>
            </div>
        );
    }

    const statusColor =
        tripStatus === 'Delayed'   ? 'var(--color-danger)'      :
        tripStatus === 'Completed' ? 'var(--color-success)'     :
                                     'var(--color-interactive)';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

            <header style={{
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                padding: '0.7rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
                gap: '0.5rem'
            }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                    <button
                        onClick={() => onNavigate('dashboard')}
                        title="Back to my trips"
                        style={{
                            background: 'none',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            padding: '0.3rem 0.55rem',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            color: 'var(--color-text)',
                            flexShrink: 0
                        }}
                    >
                        Trips
                    </button>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-interactive)', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {mapData?.routeName}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{
                        background: 'var(--color-surface-alt)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '999px',
                        padding: '0.2rem 0.65rem',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: statusColor
                    }}>
                        {tripStatus === 'InProgress' ? 'In Progress' : tripStatus}
                    </span>

                    <button
                        onClick={toggleTheme}
                        title="Toggle theme"
                        style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.3rem 0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                        🌙
                    </button>

                    <button
                        onClick={() => onNavigate('emergency-contact')}
                        title="Emergency contact"
                        style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.3rem 0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                        Emergency Contact
                    </button>

                    <button
                        onClick={onLogout}
                        style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)', padding: '0.3rem 0.65rem', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                        Log out
                    </button>
                </div>
            </header>

            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <TripMap
                    stops={mapData?.stops ?? []}
                    busPosition={busPosition}
                />
            </div>

            <div style={{
                background: 'var(--color-surface)',
                borderTop: '1px solid var(--color-border)',
                padding: '0.45rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.78rem',
                opacity: 0.65,
                flexShrink: 0
            }}>
                <span>
                    {busPosition
                        ? `Last GPS update: ${new Date(busPosition.recordedAt).toLocaleTimeString()}`
                        : 'Waiting for bus location…'}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-interactive)' }}>
                    {(mapData?.stops ?? []).length} stops on route
                </span>
            </div>
        </div>
    );
}