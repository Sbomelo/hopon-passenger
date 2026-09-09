import { useState } from "react"
import LoginPage from './pages/LoginPage.jsx'
import TripMapPage from "./pages/TripMapPage.jsx"
import './index.css'
import 'leaflet/dist/leaflet.css'

function App() {

 const[token,setToken] = useState(localStorage.getItem("hopon_token"))
 
 function handleLogin(newToken){
  localStorage.setItem("hopon_token", newToken)
  setToken(newToken)
 }

 function handleLogout(){
  localStorage.removeItem("hopon_token")
  setToken(null)
 }

if(!token){
  return <LoginPage onLogin={handleLogin} />
}

return <TripMapPage token={token} onLogout={handleLogout} />
}

export default App
