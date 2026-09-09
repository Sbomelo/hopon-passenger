import { useEffect } from "react";
import { MapContainer, TileLayer,Marker, Popup,Polyline,useMap } from "react-leaflet";
import L from 'leaflet';

function busIcon(){
    return L.divIcon({
        html:`<div class="bus-marker-wrap">🚌</div>`,
        className: '',          // Clear Leaflet's default wrapper class
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });
}

function stopIcon(status, isFirst, isLast){
    const cls =[
        'stop-marker',
        status === 'Departed' ? 'departed' : '',
        status === 'Arrived' ? 'arrived' : '',
        isFirst ?'first' : '',
        isLast ? 'last' : ''
    ].filter(Boolean).join('');

    const size = isFirst || isLast? 20: 14;

    return L.divIcon({
        html: `<div class=${cls}></div>`,
        className:"",
        iconSize: [size, size],
        iconAnchor:[size/2, size/2],
        popupAnchor:[0,-(size/2)-4]
    });
}
    function FitBounds({stops,busPosition}){
        const map = useMap();

        useEffect(()=>{
            const points = stops.map(s => [s.latitude, s.longitude]);
            if(busPosition)
                points.push([busPosition.latitude, busPosition.longitude]);
            if(points.length > 0){
                map.fitBounds(points, {padding:[48,48]});
            }
        },[]);

        return null;
    }

export default function TripMap({stops, busPosition}){
    const orderedStops = [...stops].sort((a,b) => a.sequenceOrder - b.sequenceOrder);
    const routeLine = orderedStops.map(s => [s.latitude, s.longitude]);

    const defaultCenter = [-29.0, 30.0];

    return(
        <MapContainer
            center={defaultCenter}
            zoom={7}
            style={{height:'100p%', width:'100%'}}>
        
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                
            {routeLine.length > 1 &&(
                <Polyline 
                    positions={routeLine}
                    color="#94A3B8"
                    weight={2.5}
                    dashArray="7 5"
                    opacity={0.7}
                />
            )}

            {orderedStops.map((stop, index) => (
                <Marker key={stop.sequenceOrder}
                        position={[stop.latitude, stop.longitude]}
                        icon={stopIcon(stop.status, index === 0, index === orderedStops.length - 1)}>
                
                    <Popup>
                        <div style={{ minWidth: '130px' }}>
                            <strong style={{ fontSize: '0.95rem' }}>{stop.name}</strong>
                            <br />
                            <span style={{ fontSize: '0.78rem', opacity: 0.65 }}>
                                Stop {stop.sequenceOrder} · {stop.status}
                            </span>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {busPosition && (
                <Marker position={[busPosition.latitude, busPosition.longitude]} icon={busIcon()}>
                    <Popup>
                        <div>
                            <strong>Bus is here</strong>
                            <br />
                            <span style={{ fontSize: '0.78rem', opacity: 0.65 }}>
                                {new Date(busPosition.recordedAt).toLocaleTimeString()}
                            </span>
                        </div>
                    </Popup>
                </Marker>
            )}
            <FitBounds stops={stops} busPosition={busPosition} />
        </MapContainer>
    )
}