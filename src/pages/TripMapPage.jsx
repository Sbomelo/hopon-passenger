import { useState, useEffect } from 'react';
import { getMyTrips, getMapData, getBoardingStatus, boardTrip, alightTrip, getEmergencyContact } from '../api/hoponApi.js';
import { useSignalR } from '../hooks/useSignalR.js';
import SosSheet from '../components/SosSheet.jsx';
import BoardingPanel from '../components/BoardingPanel.jsx';
import TripMap from '../components/TripMap.jsx';
import { getTheme, setTheme } from '../utils/theme.js';
import { MAP_STYLES, DEFAULT_LIGHT_STYLE } from '../components/mapStyles.js';

export default function TripMapPage({ token, onLogout, onNavigate, tripId: tripIdProp, unreadCount }) {
    const [mapData,      setMapData]      = useState(null);
    const [busPosition,  setBusPosition]  = useState(null);
    const [tripStatus,   setTripStatus]   = useState('');
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState('');

    const [sosOpen, setSosOpen] = useState(false);
    const [contact, setContact] = useState(null);
    const [contactLoading, setContactLoading] = useState(true);
    const [contactError, setContactError] = useState('');

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

    useEffect(() => {
        if (!sosOpen) return;
        let cancelled = false;
        getEmergencyContact(token).then(data => {
            if (!cancelled) setContact(data);
        }).catch(err => {
            if (!cancelled) setContactError(err.message);
        }).finally(() => {
            if (!cancelled) setContactLoading(false);
        });
        return () => { cancelled = true; };
    }, [sosOpen, token]);

    function openSos() {
        setContact(null);
        setContactError('');
        setContactLoading(true);
        setSosOpen(true);
    }

    async function refreshMapData() {
        try {
            const data = await getMapData(mapData.tripId, token);
            setMapData(data);
            setTripStatus(data.status);
        } catch (err) { setError(err.message); }
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
            if (statusData.status === 'Completed' || statusData.status === 'Cancelled') {
                onNavigate('dashboard');
                return;
            }
            setTripStatus(statusData.status);
            refreshMapData();
        },
        refreshMapData
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

            <header className="tm-header">
                <div className="tm-header__route">
                    <button onClick={() => onNavigate('dashboard')} title="Back to my trips">Trips</button>
                    <strong title={mapData.routeName}>{mapData.routeName}</strong>
                </div>
                <div className="tm-header__actions">
                    <span className="tm-header__status" data-status={tripStatus}>
                        {tripStatus === 'InProgress' ? 'In Progress' : tripStatus}
                    </span>
                    <button onClick={() => onNavigate('notifications')} aria-label={`Notifications, ${unreadCount ?? 0} unread`}>
                        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
                        </svg>
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                    </button>
                    <button onClick={toggleMapTheme} aria-label="Toggle theme" title="Toggle theme">{isDark ? '☀️' : '🌙'}</button>
                    <button onClick={() => onNavigate('emergency-contact')} aria-label="Emergency Contact" title="Emergency Contact">
                        <span className="tm-header__label">Emergency Contact</span>
                        <span className="tm-header__mobile-icon" aria-hidden="true">☎</span>
                    </button>
                    <button className="tm-header__logout" onClick={onLogout} aria-label="Log out" title="Log out">
                        <span className="tm-header__label">Log out</span>
                        <span className="tm-header__mobile-icon" aria-hidden="true">⇥</span>
                    </button>
                </div>
            </header>

            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <TripMap
                    key={mapData.tripId}
                    stops={mapData.stops}
                    busPosition={busPosition}
                    routeName={mapData.routeName}
                    destinationStopName={mapData.destinationStopName}
                    destinationEstimatedArrival={mapData.destinationEstimatedArrival}
                    status={tripStatus}
                    styleKey={styleKey}
                    onStyleChange={changeMapStyle}
                >
                    <BoardingPanel status={boardingStatus} busy={boardingBusy} error={boardingError}
                        onBoard={() => confirmBoarding(boardTrip)} onAlight={() => confirmBoarding(alightTrip)} />
                </TripMap>
                <button className="tm-sos" onClick={openSos} aria-label="SOS emergency help">SOS</button>
                {sosOpen && <SosSheet contact={contact} loading={contactLoading} error={contactError}
                    onClose={() => setSosOpen(false)} onEditContact={() => onNavigate('emergency-contact')} />}
            </div>
        </div>
    );
}
