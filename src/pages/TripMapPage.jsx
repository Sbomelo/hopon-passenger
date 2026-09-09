import { useState, useEffect } from 'react';
import { getMyTrips, getMapData } from '../api/hoponApi.js';
import { useSignalR } from '../hooks/useSignalR.js';
import TripMap from '../components/TripMap.jsx';

export default function TripMapPage({ token, onLogout }) {
  const [mapData, setMapData]       = useState(null);
  const [busPosition, setBusPosition] = useState(null);
  const [tripStatus, setTripStatus] = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    async function load() {
      try {
        // Step 1 — find this passenger's active trip
        const { liveTrips } = await getMyTrips(token);

        if (liveTrips.length === 0) {
          setError('No active trips found for your ticket.');
          return;
        }

        const tripId = liveTrips[0].tripId;

        // Step 2 — load the map-specific data
        const data = await getMapData(tripId, token);
        setMapData(data);
        setTripStatus(data.status);

        // Pre-populate the bus position from the last recorded location,
        // so the marker appears immediately before the first SignalR update.
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
  }, [token]);

  useSignalR(
    mapData?.tripId,
    token,
    (locationData) => {
      // Called every time the driver broadcasts a new GPS coordinate.
      // Updating busPosition state causes TripMap to re-render with the new position.
      setBusPosition({
        latitude:    locationData.latitude,
        longitude:   locationData.longitude,
        recordedAt:  locationData.recordedAt
      });
    },
    (statusData) => {
      setTripStatus(statusData.status);
    }
  );

  //Theme toggle
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('hopon-theme', next);
  }

  // Restore persisted theme on mount
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
        <button className="hopon-btn" style={{ width: 'auto', padding: '0.6rem 1.5rem' }} onClick={onLogout}>
          Log out
        </button>
      </div>
    );
  }

  const statusColor = tripStatus === 'Delayed'
    ? 'var(--color-danger)'
    : tripStatus === 'Completed'
    ? 'var(--color-success)'
    : 'var(--color-interactive)';

  return (

    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/*Header*/}
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
        <div>
          <div style={{ fontWeight: 700, color: 'var(--color-interactive)', fontSize: '1.15rem' }}>
            Hopon
          </div>
          <div style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: '0.05rem' }}>
            {mapData?.routeName}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Live status badge */}
          <span style={{
            background: 'var(--color-surface-alt)',
            border: `1px solid var(--color-border)`,
            borderRadius: '999px',
            padding: '0.2rem 0.65rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: statusColor
          }}>
            {tripStatus}
          </span>

          <button
            onClick={toggleTheme}
            title="Toggle theme"
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '0.3rem 0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            🌙
          </button>

          <button
            onClick={onLogout}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-text)',
              padding: '0.3rem 0.65rem',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Log out
          </button>
        </div>
      </header>

      {/*Map fills all remaining vertical space */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <TripMap
          stops={mapData?.stops ?? []}
          busPosition={busPosition}
        />
      </div>

      {/*Footer*/}
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