import { useEffect, useState } from 'react';
import { AUTH_FAILURE_EVENT, getPassengerProfile } from './api/hoponApi.js';
import { useNotificationCount } from './hooks/useNotificationCount.js';
import ChangeNumberPage from './pages/ChangeNumberPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import EmergencyContactPage from './pages/EmergencyContactPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import TripHistoryPage from './pages/TripHistoryPage.jsx';
import TripMapPage from './pages/TripMapPage.jsx';
import './index.css';

export default function App() {
    const [token, setToken] = useState(() => localStorage.getItem('hopon_token'));
    const [profile, setProfile] = useState(null);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [returnPage, setReturnPage] = useState('dashboard');
    const [selectedTripId, setSelectedTripId] = useState(null);
    const [notice, setNotice] = useState('');
    const unreadCount = useNotificationCount(token, currentPage === 'dashboard' || currentPage === 'map');

    function handleLogin(session) {
        localStorage.setItem('hopon_token', session.token);
        setToken(session.token);
        setProfile({ fullName: session.fullName, phoneNumber: session.phoneNumber });
        setCurrentPage('dashboard');
        setSelectedTripId(null);
        setNotice('');
    }

    function handleLogout() {
        localStorage.removeItem('hopon_token');
        setToken(null);
        setProfile(null);
        setCurrentPage('dashboard');
        setSelectedTripId(null);
        setNotice('');
    }

    function navigate(page) {
        if (page === 'emergency-contact' || page === 'change-number') setReturnPage(currentPage);
        setNotice('');
        setCurrentPage(page);
    }

    function openTrip(page, tripId) {
        setSelectedTripId(tripId);
        navigate(page);
    }

    useEffect(() => {
        function handleAuthFailure(event) {
            if (event.detail.token === localStorage.getItem('hopon_token')) handleLogout();
        }

        window.addEventListener(AUTH_FAILURE_EVENT, handleAuthFailure);
        return () => window.removeEventListener(AUTH_FAILURE_EVENT, handleAuthFailure);
    }, []);

    useEffect(() => {
        if (!token || profile) return;
        let cancelled = false;
        getPassengerProfile(token).then(data => {
            if (!cancelled) setProfile(data);
        }).catch(() => {
            // A network failure leaves trips and the profile actions independently usable.
        });
        return () => { cancelled = true; };
    }, [token, profile]);

    if (!token) return <LoginPage onLogin={handleLogin} />;

    const pageProps = { token, profile, onLogout: handleLogout, onNavigate: navigate };

    switch (currentPage) {
        case 'history':
            return <TripHistoryPage {...pageProps} key={selectedTripId} tripId={selectedTripId} />;
        case 'notifications':
            return <NotificationsPage {...pageProps} />;
        case 'emergency-contact':
            return <EmergencyContactPage token={token} onBack={() => navigate(returnPage)} />;
        case 'change-number':
            return <ChangeNumberPage token={token} currentNumber={profile?.phoneNumber}
                onBack={() => navigate(returnPage)} onChanged={session => {
                    handleLogin(session);
                    setNotice('Phone number updated. Use your new number the next time you sign in.');
                }} />;
        case 'map':
            return <TripMapPage {...pageProps} key={selectedTripId} tripId={selectedTripId} unreadCount={unreadCount} />;
        default:
            return <DashboardPage {...pageProps} unreadCount={unreadCount} notice={notice}
                onOpenTrip={tripId => openTrip('map', tripId)} onOpenHistory={tripId => openTrip('history', tripId)} />;
    }
}
