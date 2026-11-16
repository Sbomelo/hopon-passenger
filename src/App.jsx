import { useState, useEffect } from "react"
import { AUTH_FAILURE_EVENT } from './api/hoponApi.js'
import LoginPage from './pages/LoginPage.jsx'
import TripMapPage from "./pages/TripMapPage.jsx"
import DashboardPage        from './pages/DashboardPage.jsx';
import EmergencyContactPage from './pages/EmergencyContactPage.jsx';
import './index.css'

function App() {

 const[token,setToken] = useState(localStorage.getItem("hopon_token"))

 const [currentPage, setCurrentPage] = useState('map');
 const [selectedTripId, setSelectedTripId] = useState(null);
 
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

if (currentPage === 'dashboard') {
        return (
            <DashboardPage
                token={token}
                onLogout={handleLogout}
                onNavigate={setCurrentPage}
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

return <TripMapPage token={token} onLogout={handleLogout}  onNavigate={setCurrentPage}  tripId={selectedTripId}/>
}

export default App
