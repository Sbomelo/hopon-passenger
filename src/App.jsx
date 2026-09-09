import { useState } from "react"
import LoginPage from './pages/LoginPage.jsx'
import TripMapPage from "./pages/TripMapPage.jsx"
import EmergencyContactPage from './pages/EmergencyContactPage.jsx';
import './index.css'
import 'leaflet/dist/leaflet.css'

function App() {

 const[token,setToken] = useState(localStorage.getItem("hopon_token"))

 const [currentPage, setCurrentPage] = useState('map');
 
 function handleLogin(newToken){
  localStorage.setItem("hopon_token", newToken)
  setToken(newToken)
  setCurrentPage('map');
 }

 function handleLogout(){
  localStorage.removeItem("hopon_token")
  setToken(null)
  setCurrentPage('map');
 }

if(!token){
  return <LoginPage onLogin={handleLogin} />
}

if (currentPage === 'emergency-contact') {
        return (
            <EmergencyContactPage
                token={token}
                onBack={() => setCurrentPage('map')}
            />
        );
  }

return <TripMapPage token={token} onLogout={handleLogout}  onNavigate={setCurrentPage}/>
}

export default App
