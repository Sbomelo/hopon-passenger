import {useRef, useEffect} from 'react';
import * as signalR from '@microsoft/signalr';

export function useSignalR (tripId, token, onLocationUpdate, onStatusUpdate, onStopUpdate){

    const callbacksRef = useRef({ onLocationUpdate, onStatusUpdate, onStopUpdate });

    // Use the latest callbacks without reconnecting on every parent render.
    useEffect(() => {
        callbacksRef.current = { onLocationUpdate, onStatusUpdate, onStopUpdate };
    }, [onLocationUpdate, onStatusUpdate, onStopUpdate]);

    useEffect(()=>{

        if(!tripId || !token)
            return;

        const connection  =new signalR.HubConnectionBuilder()
                .withUrl(`/hubs/trip?access_token=${token}`)
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Warning)
                .build();

        connection.on('ReceiveLocationUpdate', (data) =>{
            callbacksRef.current.onLocationUpdate(data);
        });

        connection.on('ReceiveTripStatusUpdate', (data) =>{
            callbacksRef.current.onStatusUpdate?.(data);
        });

        connection.on('ReceiveStopUpdate', (data) => {
            callbacksRef.current.onStopUpdate?.(data);
        });

        connection.onreconnected(() => {
            connection.invoke('JoinTrip', tripId).then(() => callbacksRef.current.onStopUpdate?.()).catch(() => {});
        });

        connection.start()
                  .then(()=> connection.invoke('JoinTrip', tripId))
                  .catch(err => console.log('signalR error:', err));

        return() =>{
            connection.invoke('LeaveTrip', tripId).catch(() =>{});
            connection.stop();
        };

    },[tripId, token]);
}
