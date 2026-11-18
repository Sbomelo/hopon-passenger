import { useState, useEffect } from 'react';
import { getMyTrips, getMapData, getBoardingStatus, boardTrip, alightTrip } from '../api/hoponApi.js';
import { useSignalR } from '../hooks/useSignalR.js';
import BoardingPanel from '../components/BoardingPanel.jsx';
import TripMap from '../components/TripMap.jsx';
import AppHeader from '../components/AppHeader.jsx';
import { getTheme, setTheme } from '../utils/theme.js';
import { MAP_STYLES, DEFAULT_LIGHT_STYLE } from '../components/mapStyles.js';

export default function TripMapPage({ token, onLogout, onNavigate, tripId: tripIdProp, unreadCount }) {
    const [mapData,      setMapData]      = useState(null);
    const [busPosition,  setBusPosition]  = useState(null);
    const [tripStatus,   setTripStatus]   = useState('');
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState('');

    const [boardingStatus, setBoardingStatus] = useState(null);
    const [boardingBusy, setBoardingBusy] = useState(false);
    const [boardingError, setBoardingError] = useState('');

    const [styleKey, setStyleKey] = useState(() =>
        getTheme() === 'dark' ? 'dark' : DEFAULT_LIGHT_STYLE
    );
    const isDark = MAP_STYLES[styleKey].dark;

    function changeMapStyle(key) {
        setStyleKey(key);
        setTheme(MAP_STYLES[key].dark ? 'dark' : 'light');
    }

    function toggleMapTheme() {
        changeMapStyle(isDark ? DEFAULT_LIGHT_STYLE : 'dark');
    }

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

    useEffect(() => {
        if (!mapData?.tripId) return;
        let cancelled = false;
        getBoardingStatus(mapData.tripId, token).then(status => {
            if (!cancelled) setBoardingStatus(status);
        }).catch(err => {
            if (!cancelled) setBoardingError(err.message);
        });
        return () => { cancelled = true; };
    }, [mapData?.tripId, token]);

    async function confirmBoarding(action) {
        if (boardingBusy) return;
        setBoardingBusy(true);
        setBoardingError('');
        try {
            const status = await (boardingStatus ? action : getBoardingStatus)(mapData.tripId, token);
            setBoardingStatus(status);
        } catch (err) { setBoardingError(err.message); }
        finally { setBoardingBusy(false); }
    }

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

    return (
       
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>

            <AppHeader title={mapData.routeName} subtitle={tripStatus === 'InProgress' ? 'In Progress' : tripStatus}
                onBack={() => onNavigate('dashboard')} onNavigate={onNavigate} onLogout={onLogout}
                unreadCount={unreadCount} onNotifications={() => onNavigate('notifications')}
                isDark={isDark} onToggleTheme={toggleMapTheme} />

            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <TripMap
                    key={mapData.tripId}
                    stops={mapData.stops}
                    busPosition={busPosition}
                    routeName={mapData.routeName}
                    status={tripStatus}
                    styleKey={styleKey}
                    onStyleChange={changeMapStyle}
                >
                    <BoardingPanel status={boardingStatus} busy={boardingBusy} error={boardingError}
                        onBoard={() => confirmBoarding(boardTrip)} onAlight={() => confirmBoarding(alightTrip)} />
                </TripMap>
            </div>
        </div>
    );
}