import { useState, useEffect } from "react"
import { AUTH_FAILURE_EVENT } from './api/hoponApi.js'
import { useNotificationCount } from './hooks/useNotificationCount.js';
import TripHistoryPage from './pages/TripHistoryPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import LoginPage from './pages/LoginPage.jsx'
import TripMapPage from "./pages/TripMapPage.jsx"
import DashboardPage        from './pages/DashboardPage.jsx';
import EmergencyContactPage from './pages/EmergencyContactPage.jsx';
import './index.css'

function App() {

 const[token,setToken] = useState(localStorage.getItem("hopon_token"))

 const [currentPage, setCurrentPage] = useState('map');
 const [selectedTripId, setSelectedTripId] = useState(null);
 const unreadCount = useNotificationCount(token, currentPage === 'dashboard' || currentPage === 'map');
 
 function handleLogin(newToken){
  localStorage.setItem("hopon_token", newToken)
  setToken(newToken)
  setCurrentPage('map');
  setSelectedTripId(null);
 }

 function handleLogout(){
  localStorage.removeItem("hopon_token")
  setToken(null)
  setCurrentPage('map');
  setSelectedTripId(null);
 }

 function handleOpenHistory(tripId) {
  setSelectedTripId(tripId);
  setCurrentPage('history');
 }

 function handleOpenTrip(tripId) {
        setSelectedTripId(tripId);
        setCurrentPage('map');
    }

 useEffect(() => {
  function handleAuthFailure(event) {
   // Ignore a late response from a session that has already been replaced.
   if (event.detail.token === localStorage.getItem('hopon_token')) {
    handleLogout();
   }
  }

  window.addEventListener(AUTH_FAILURE_EVENT, handleAuthFailure);
  return () => window.removeEventListener(AUTH_FAILURE_EVENT, handleAuthFailure);
 }, []);

if(!token){
  return <LoginPage onLogin={handleLogin} />
}

if (currentPage === 'history') {
 return <TripHistoryPage key={selectedTripId} tripId={selectedTripId} token={token} onNavigate={setCurrentPage} onLogout={handleLogout} />;
}

if (currentPage === 'notifications') {
 return <NotificationsPage token={token} onNavigate={setCurrentPage} onLogout={handleLogout} />;
}

if (currentPage === 'dashboard') {
        return (
            <DashboardPage
                token={token}
                unreadCount={unreadCount}
                onLogout={handleLogout}
                onNavigate={setCurrentPage}
                onOpenHistory={handleOpenHistory}
                onOpenTrip={handleOpenTrip}
            />
        );
    }

if (currentPage === 'emergency-contact') {
        return (
            <EmergencyContactPage
                token={token}
                onBack={() => setCurrentPage('dashboard')}
            />
        );
  }

return <TripMapPage unreadCount={unreadCount} token={token} onLogout={handleLogout}  onNavigate={setCurrentPage}  tripId={selectedTripId}/>
}

export default App
